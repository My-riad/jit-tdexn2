# =============================================================================
# Development Environment Configuration for AI-driven Freight Optimization Platform
# =============================================================================
#
# This Terraform configuration sets up the complete development environment 
# infrastructure for the freight optimization platform, including:
#
# - VPC with public, private, and database subnets across multiple AZs
# - EKS cluster for container orchestration
# - RDS PostgreSQL for relational data
# - DocumentDB for document storage
# - ElastiCache Redis for caching and real-time data
# - MSK Kafka for event streaming
# - S3 buckets for various storage needs
# - Security groups and IAM roles
# - Monitoring and alerting
#
# The development environment is configured to run at approximately 25% of 
# the capacity of production, with some components running in single-AZ mode.
# =============================================================================

# -----------------------------------------------------------------------------
# Provider Configuration
# -----------------------------------------------------------------------------

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

provider "aws" {
  region  = var.aws_region
  profile = "freight-optimization-dev"
}

provider "aws" {
  alias   = "us-east-1"
  region  = "us-east-1"
  profile = "freight-optimization-dev"
}

provider "random" {}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# -----------------------------------------------------------------------------
# Local Values
# -----------------------------------------------------------------------------

locals {
  name_prefix = "${var.environment}-freight-optimization"
  common_tags = merge(var.tags, { Environment = var.environment })
}

# -----------------------------------------------------------------------------
# KMS Key for Encryption
# -----------------------------------------------------------------------------

resource "aws_kms_key" "main" {
  description             = "KMS key for encrypting sensitive data in the ${var.environment} environment"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags                    = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.main.key_id
}

# -----------------------------------------------------------------------------
# Network Module
# -----------------------------------------------------------------------------

module "vpc" {
  source = "../../modules/vpc"

  name              = "freight-optimization"
  environment       = var.environment
  vpc_cidr          = var.vpc_cidr
  availability_zones = var.availability_zones
  public_subnets    = var.public_subnets
  private_subnets   = var.private_subnets
  database_subnets  = var.database_subnets

  enable_nat_gateway   = true
  single_nat_gateway   = true  # Use single NAT for dev to save costs
  enable_vpn_gateway   = false
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  # Enable flow logs for network monitoring
  enable_flow_logs         = true
  flow_logs_destination_arn = module.s3_logs.aws_s3_bucket.main.arn
  
  # Enable S3 VPC endpoint for improved security and reduced costs
  enable_s3_endpoint = true

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# EKS Cluster
# -----------------------------------------------------------------------------

module "eks" {
  source = "../../modules/eks"

  cluster_name       = var.eks_cluster_name
  kubernetes_version = var.eks_cluster_version
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  node_groups        = var.eks_node_groups

  # Enable logging for all components
  cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  # Enable private access for better security
  endpoint_private_access = true
  endpoint_public_access  = true
  public_access_cidrs     = ["0.0.0.0/0"] # Restrict this in production

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# RDS PostgreSQL Database
# -----------------------------------------------------------------------------

# IAM role for RDS enhanced monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${local.name_prefix}-rds-monitoring"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

module "rds" {
  source = "../../modules/rds"
  
  name         = "freight-optimization"
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
  subnet_ids   = module.vpc.database_subnet_ids
  app_security_group_ids = [module.eks.cluster_security_group_id]
  
  # Instance configuration
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  db_name               = var.db_name
  db_username           = var.db_username
  
  # High availability - disabled in dev for cost savings
  multi_az = var.db_multi_az
  
  # Backups and maintenance
  backup_retention_period = var.db_backup_retention_period
  deletion_protection     = false
  skip_final_snapshot     = true  # Allow easy cleanup in dev
  
  # Security
  kms_key_id = aws_kms_key.main.arn
  
  # Monitoring
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  
  # Read replicas - disabled in dev for cost savings
  create_read_replica = false
  
  # Alerting
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

# -----------------------------------------------------------------------------
# DocumentDB Cluster
# -----------------------------------------------------------------------------

module "documentdb" {
  source = "../../modules/documentdb"
  
  name         = "freight-optimization"
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
  subnet_ids   = module.vpc.database_subnet_ids
  app_security_group_ids = [module.eks.cluster_security_group_id]
  
  # Instance configuration
  instance_class = var.documentdb_instance_class
  instance_count = var.documentdb_instance_count
  db_username    = var.db_username
  
  # Backups and maintenance
  backup_retention_period = var.db_backup_retention_period
  deletion_protection     = false
  skip_final_snapshot     = true  # Allow easy cleanup in dev
  
  # Security
  kms_key_id = aws_kms_key.main.arn
  enable_tls = true
  
  # Performance
  max_connections_threshold = 500
  
  # Alerting
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  
  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# ElastiCache Redis Cluster
# -----------------------------------------------------------------------------

module "elasticache" {
  source = "../../modules/elasticache"
  
  application = "freight-optimization"
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.private_subnet_ids
  allowed_security_group_ids = [module.eks.cluster_security_group_id]
  
  # Instance configuration
  node_type           = var.redis_node_type
  engine_version      = "7.0"
  num_cache_nodes     = var.redis_num_cache_nodes
  parameter_group_parameters = {
    "maxmemory-policy"      = "volatile-lru"
    "notify-keyspace-events" = "Ex"
  }
  
  # High availability
  automatic_failover_enabled = true
  multi_az_enabled           = true
  
  # Security
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  # Backups and maintenance
  snapshot_retention_limit   = 7
  snapshot_window            = "03:00-05:00"
  maintenance_window         = "sun:05:00-sun:07:00"
  apply_immediately          = true
  auto_minor_version_upgrade = true
  
  # Monitoring and alerting
  notification_topic_arn      = aws_sns_topic.alerts.arn
  create_cloudwatch_alarms    = true
  cpu_threshold_percent       = 75
  memory_threshold_percent    = 75
  connection_threshold        = 5000
  replication_lag_threshold   = 10
  
  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# MSK Kafka Cluster
# -----------------------------------------------------------------------------

resource "aws_security_group" "msk" {
  name        = "${local.name_prefix}-msk-sg"
  description = "Security group for MSK Kafka cluster"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port       = 9092
    to_port         = 9092
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
    description     = "Kafka plaintext from EKS"
  }
  
  ingress {
    from_port       = 9094
    to_port         = 9094
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
    description     = "Kafka TLS from EKS"
  }
  
  ingress {
    from_port       = 2181
    to_port         = 2181
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
    description     = "ZooKeeper from EKS"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = local.common_tags
}

module "msk" {
  source = "../../modules/msk"
  
  cluster_name          = "${local.name_prefix}-kafka"
  environment           = var.environment
  kafka_version         = "3.4.0"
  number_of_broker_nodes = var.msk_broker_count
  broker_instance_type  = var.msk_instance_type
  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.private_subnet_ids
  security_group_ids    = [aws_security_group.msk.id]
  ebs_volume_size       = var.msk_ebs_volume_size
  
  # Security
  encryption_at_rest_kms_key_arn = aws_kms_key.main.arn
  encryption_in_transit_client_broker = "TLS"
  encryption_in_transit_in_cluster = true
  
  # Monitoring
  enhanced_monitoring = "PER_BROKER"
  
  # Kafka configuration
  auto_create_topics_enable = true
  default_replication_factor = 2
  min_insync_replicas       = 1
  num_partitions            = 3
  log_retention_days        = 7
  s3_logs_retention_days    = 30
  
  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# S3 Buckets
# -----------------------------------------------------------------------------

# Application data bucket
module "s3_data" {
  source = "../../modules/s3"
  
  bucket_name       = "${var.s3_bucket_name}-data"
  environment       = var.environment
  region            = var.aws_region
  versioning_enabled = true
  enable_replication = false
  
  lifecycle_rules = [
    {
      id      = "documents"
      status  = "Enabled"
      prefix  = "documents/"
      
      transition = [
        {
          days          = 90
          storage_class = "STANDARD_IA"
        },
        {
          days          = 365
          storage_class = "GLACIER"
        }
      ]
      
      expiration = {
        days = 2555  # 7 years
      }
    },
    {
      id      = "temp"
      status  = "Enabled"
      prefix  = "temp/"
      
      expiration = {
        days = 7
      }
    }
  ]
  
  tags = local.common_tags
}

# Logs bucket
module "s3_logs" {
  source = "../../modules/s3"
  
  bucket_name       = "${var.s3_bucket_name}-logs"
  environment       = var.environment
  region            = var.aws_region
  versioning_enabled = false
  enable_replication = false
  
  lifecycle_rules = [
    {
      id      = "logs-lifecycle"
      status  = "Enabled"
      prefix  = ""
      
      transition = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        }
      ]
      
      expiration = {
        days = 90
      }
    }
  ]
  
  tags = local.common_tags
}

# Backups bucket
module "s3_backups" {
  source = "../../modules/s3"
  
  bucket_name       = "${var.s3_bucket_name}-backups"
  environment       = var.environment
  region            = var.aws_region
  versioning_enabled = true
  enable_replication = true
  replication_region = "us-east-1"
  
  lifecycle_rules = [
    {
      id      = "backups-lifecycle"
      status  = "Enabled"
      prefix  = ""
      
      transition = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        },
        {
          days          = 90
          storage_class = "GLACIER"
        }
      ]
      
      expiration = {
        days = 365
      }
    }
  ]
  
  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Monitoring and Alerting
# -----------------------------------------------------------------------------

resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "devops@example.com"
}

# -----------------------------------------------------------------------------
# Bastion Host
# -----------------------------------------------------------------------------

resource "aws_security_group" "bastion" {
  name        = "${local.name_prefix}-bastion-sg"
  description = "Security group for the bastion host"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
    description = "SSH access from allowed IPs"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = local.common_tags
}

resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.bastion_instance_type
  key_name               = var.bastion_key_name
  subnet_id              = module.vpc.public_subnet_ids[0]
  vpc_security_group_ids = [aws_security_group.bastion.id]
  associate_public_ip_address = true
  
  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
    kms_key_id  = aws_kms_key.main.arn
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bastion"
  })
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "The IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "The IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "database_subnet_ids" {
  description = "The IDs of the database subnets"
  value       = module.vpc.database_subnet_ids
}

output "eks_cluster_id" {
  description = "The ID of the EKS cluster"
  value       = module.eks.cluster_id
}

output "eks_cluster_endpoint" {
  description = "The endpoint for the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_security_group_id" {
  description = "The security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "rds_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = module.rds.endpoint
}

output "documentdb_endpoint" {
  description = "The endpoint of the DocumentDB cluster"
  value       = module.documentdb.cluster_endpoint
}

output "redis_endpoint" {
  description = "The endpoint of the ElastiCache Redis cluster"
  value       = module.elasticache.primary_endpoint
}

output "msk_bootstrap_brokers_tls" {
  description = "The TLS connection host:port pairs for the MSK Kafka brokers"
  value       = module.msk.bootstrap_brokers_tls
}

output "s3_data_bucket" {
  description = "The name of the S3 bucket for application data"
  value       = module.s3_data.aws_s3_bucket.main.id
}

output "s3_logs_bucket" {
  description = "The name of the S3 bucket for logs"
  value       = module.s3_logs.aws_s3_bucket.main.id
}

output "s3_backups_bucket" {
  description = "The name of the S3 bucket for backups"
  value       = module.s3_backups.aws_s3_bucket.main.id
}

output "kms_key_id" {
  description = "The ID of the KMS key"
  value       = aws_kms_key.main.key_id
}