# AWS MSK (Amazon Managed Streaming for Kafka) Module
# This module provisions and configures an Amazon MSK cluster with appropriate security, 
# monitoring, and logging configurations for the AI-driven Freight Optimization Platform.

# Required providers
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Get current AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Calculate effective security groups based on input
locals {
  effective_security_groups = length(var.security_group_ids) > 0 ? var.security_group_ids : [aws_security_group.msk[0].id]
}

# Random string for S3 bucket name uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# KMS key for MSK encryption at rest (if not provided)
resource "aws_kms_key" "msk" {
  count                   = var.encryption_at_rest_kms_key_arn == null ? 1 : 0
  description             = "KMS key for MSK cluster encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  tags                    = merge(var.tags, { Name = "${var.cluster_name}-kms", Environment = var.environment })
}

# KMS key alias
resource "aws_kms_alias" "msk" {
  count         = var.encryption_at_rest_kms_key_arn == null ? 1 : 0
  name          = "alias/${var.cluster_name}-key"
  target_key_id = aws_kms_key.msk[0].key_id
}

# CloudWatch log group for MSK broker logs
resource "aws_cloudwatch_log_group" "msk_log_group" {
  name              = "/aws/msk/${var.cluster_name}"
  retention_in_days = var.log_retention_days
  tags              = merge(var.tags, { Name = "${var.cluster_name}-logs", Environment = var.environment })
}

# S3 bucket for MSK logs
resource "aws_s3_bucket" "msk_logs" {
  bucket        = "${lower(var.cluster_name)}-logs-${random_string.bucket_suffix.result}"
  force_destroy = true
  tags          = merge(var.tags, { Name = "${var.cluster_name}-logs", Environment = var.environment })
}

# S3 bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "msk_logs_encryption" {
  bucket = aws_s3_bucket.msk_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "msk_logs_lifecycle" {
  bucket = aws_s3_bucket.msk_logs.id

  rule {
    id     = "log-expiration"
    status = "Enabled"

    expiration {
      days = var.s3_logs_retention_days
    }
  }
}

# Block public access to S3 bucket
resource "aws_s3_bucket_public_access_block" "msk_logs_public_access_block" {
  bucket                  = aws_s3_bucket.msk_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Security group for MSK cluster (if not provided)
resource "aws_security_group" "msk" {
  count       = length(var.security_group_ids) == 0 ? 1 : 0
  name        = "${var.cluster_name}-sg"
  description = "Security group for MSK cluster"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 9092
    to_port     = 9092
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
    description = "Kafka plaintext"
  }

  ingress {
    from_port   = 9094
    to_port     = 9094
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
    description = "Kafka TLS"
  }

  ingress {
    from_port   = 2181
    to_port     = 2181
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
    description = "ZooKeeper"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(var.tags, { Name = "${var.cluster_name}-sg", Environment = var.environment })
}

# MSK configuration
resource "aws_msk_configuration" "main" {
  name             = "${var.cluster_name}-config"
  kafka_versions   = [var.kafka_version]
  server_properties = <<PROPERTIES
auto.create.topics.enable=${var.auto_create_topics_enable}
default.replication.factor=${var.default_replication_factor}
min.insync.replicas=${var.min_insync_replicas}
num.partitions=${var.num_partitions}
log.retention.hours=168
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000
PROPERTIES
}

# Main MSK cluster
resource "aws_msk_cluster" "main" {
  cluster_name           = var.cluster_name
  kafka_version          = var.kafka_version
  number_of_broker_nodes = var.number_of_broker_nodes

  broker_node_group_info {
    instance_type   = var.broker_instance_type
    client_subnets  = var.subnet_ids
    security_groups = local.effective_security_groups

    storage_info {
      ebs_storage_info {
        volume_size = var.ebs_volume_size
      }
    }
  }

  encryption_info {
    encryption_at_rest_kms_key_arn = var.encryption_at_rest_kms_key_arn != null ? var.encryption_at_rest_kms_key_arn : aws_kms_key.msk[0].arn
    encryption_in_transit {
      client_broker = var.encryption_in_transit_client_broker
      in_cluster    = var.encryption_in_transit_in_cluster
    }
  }

  open_monitoring {
    prometheus {
      jmx_exporter {
        enabled_in_broker = true
      }
      node_exporter {
        enabled_in_broker = true
      }
    }
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.msk_log_group.name
      }
      s3 {
        enabled = true
        bucket  = aws_s3_bucket.msk_logs.id
        prefix  = "logs/msk-"
      }
    }
  }

  configuration_info {
    arn      = aws_msk_configuration.main.arn
    revision = aws_msk_configuration.main.latest_revision
  }

  enhanced_monitoring = var.enhanced_monitoring

  tags = merge(var.tags, { Name = var.cluster_name, Environment = var.environment })
}

# CloudWatch alarm for MSK CPU utilization
resource "aws_cloudwatch_metric_alarm" "msk_cpu_alarm" {
  alarm_name          = "${var.cluster_name}-cpu-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CpuUser"
  namespace           = "AWS/Kafka"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors MSK cluster CPU utilization"
  
  dimensions = {
    "Cluster Name" = var.cluster_name
  }
  
  tags = merge(var.tags, { Name = "${var.cluster_name}-cpu-alarm", Environment = var.environment })
}

# CloudWatch alarm for MSK disk utilization
resource "aws_cloudwatch_metric_alarm" "msk_disk_alarm" {
  alarm_name          = "${var.cluster_name}-disk-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "KafkaDataLogsDiskUsed"
  namespace           = "AWS/Kafka"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "This metric monitors MSK cluster disk utilization"
  
  dimensions = {
    "Cluster Name" = var.cluster_name
  }
  
  tags = merge(var.tags, { Name = "${var.cluster_name}-disk-alarm", Environment = var.environment })
}