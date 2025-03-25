locals {
  name_prefix = var.name != null ? var.name : "freight-optimization-docdb-${var.environment}"
  default_tags = {
    Name        = local.name_prefix
    Environment = var.environment
    ManagedBy   = "Terraform"
    Module      = "documentdb"
  }
}

# Generate a random password for the DocumentDB master user
resource "random_password" "master_password" {
  length      = 16
  special     = false
  min_upper   = 1
  min_lower   = 1
  min_numeric = 1
}

# Security group for DocumentDB cluster to control access
resource "aws_security_group" "docdb" {
  name        = "${local.name_prefix}-sg"
  description = "Security group for DocumentDB cluster"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = var.app_security_group_ids
    description     = "Allow DocumentDB access from application security groups"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.default_tags, var.tags)
}

# Subnet group for DocumentDB cluster defining where instances can be created
resource "aws_docdb_subnet_group" "this" {
  name        = "${local.name_prefix}-subnet-group"
  subnet_ids  = var.subnet_ids
  description = "Subnet group for DocumentDB cluster"
  tags        = merge(local.default_tags, var.tags)
}

# Parameter group for DocumentDB cluster to configure database settings
resource "aws_docdb_cluster_parameter_group" "this" {
  family      = "docdb4.0"
  name        = "${local.name_prefix}-parameter-group"
  description = "Parameter group for DocumentDB cluster"
  
  parameter {
    name  = "tls"
    value = var.enable_tls ? "enabled" : "disabled"
  }
  
  parameter {
    name  = "ttl_monitor"
    value = "enabled"
  }

  tags = merge(local.default_tags, var.tags)
}

# DocumentDB cluster for storing document-oriented data
resource "aws_docdb_cluster" "this" {
  cluster_identifier              = local.name_prefix
  engine                          = "docdb"
  master_username                 = var.db_username
  master_password                 = random_password.master_password.result
  db_subnet_group_name            = aws_docdb_subnet_group.this.name
  vpc_security_group_ids          = [aws_security_group.docdb.id]
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.this.name
  backup_retention_period         = var.backup_retention_period
  preferred_backup_window         = "02:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:07:00"
  skip_final_snapshot             = var.skip_final_snapshot
  final_snapshot_identifier       = var.skip_final_snapshot ? null : "${local.name_prefix}-final-snapshot"
  deletion_protection             = var.deletion_protection
  storage_encrypted               = true
  kms_key_id                      = var.kms_key_id
  enabled_cloudwatch_logs_exports = ["audit", "profiler"]
  
  tags = merge(local.default_tags, var.tags)
}

# DocumentDB cluster instances that serve the database workload
resource "aws_docdb_cluster_instance" "instances" {
  count                      = var.instance_count
  identifier                 = "${local.name_prefix}-${count.index}"
  cluster_identifier         = aws_docdb_cluster.this.id
  instance_class             = var.instance_class
  preferred_maintenance_window = "sun:05:00-sun:08:00"
  auto_minor_version_upgrade = true
  
  tags = merge(local.default_tags, var.tags)
}

# CloudWatch alarm for high CPU utilization on DocumentDB instances
resource "aws_cloudwatch_metric_alarm" "cpu_utilization_high" {
  count               = length(var.alarm_actions) > 0 ? var.instance_count : 0
  alarm_name          = "${local.name_prefix}-${count.index}-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/DocDB"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors DocumentDB CPU utilization"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  dimensions = {
    DBInstanceIdentifier = aws_docdb_cluster_instance.instances[count.index].identifier
  }
  
  tags = merge(local.default_tags, var.tags)
}

# CloudWatch alarm for low freeable memory on DocumentDB instances
resource "aws_cloudwatch_metric_alarm" "memory_freeable_low" {
  count               = length(var.alarm_actions) > 0 ? var.instance_count : 0
  alarm_name          = "${local.name_prefix}-${count.index}-memory-freeable-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FreeableMemory"
  namespace           = "AWS/DocDB"
  period              = 300
  statistic           = "Average"
  threshold           = 1073741824  # 1GB in bytes
  alarm_description   = "This metric monitors DocumentDB freeable memory"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  dimensions = {
    DBInstanceIdentifier = aws_docdb_cluster_instance.instances[count.index].identifier
  }
  
  tags = merge(local.default_tags, var.tags)
}

# CloudWatch alarm for high number of connections to DocumentDB instances
resource "aws_cloudwatch_metric_alarm" "connections_high" {
  count               = length(var.alarm_actions) > 0 ? var.instance_count : 0
  alarm_name          = "${local.name_prefix}-${count.index}-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/DocDB"
  period              = 300
  statistic           = "Average"
  threshold           = var.max_connections_threshold
  alarm_description   = "This metric monitors DocumentDB connections"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  dimensions = {
    DBInstanceIdentifier = aws_docdb_cluster_instance.instances[count.index].identifier
  }
  
  tags = merge(local.default_tags, var.tags)
}

output "cluster_endpoint" {
  description = "The connection endpoint for the DocumentDB cluster"
  value       = aws_docdb_cluster.this.endpoint
}

output "cluster_reader_endpoint" {
  description = "The reader endpoint for the DocumentDB cluster for read operations"
  value       = aws_docdb_cluster.this.reader_endpoint
}

output "cluster_port" {
  description = "The port on which the DocumentDB cluster accepts connections"
  value       = aws_docdb_cluster.this.port
}

output "cluster_name" {
  description = "The identifier of the DocumentDB cluster"
  value       = aws_docdb_cluster.this.cluster_identifier
}

output "cluster_resource_id" {
  description = "The resource ID of the DocumentDB cluster"
  value       = aws_docdb_cluster.this.cluster_resource_id
}

output "cluster_username" {
  description = "The master username for the DocumentDB cluster"
  value       = var.db_username
}

output "cluster_password" {
  description = "The master password for the DocumentDB cluster"
  value       = random_password.master_password.result
}

output "security_group_id" {
  description = "The ID of the security group created for the DocumentDB cluster"
  value       = aws_security_group.docdb.id
}

output "subnet_group_id" {
  description = "The ID of the subnet group where the DocumentDB cluster is deployed"
  value       = aws_docdb_subnet_group.this.id
}

output "parameter_group_id" {
  description = "The ID of the parameter group used by the DocumentDB cluster"
  value       = aws_docdb_cluster_parameter_group.this.id
}

output "instance_ids" {
  description = "List of instance identifiers that are part of the DocumentDB cluster"
  value       = aws_docdb_cluster_instance.instances[*].identifier
}

output "connection_string" {
  description = "MongoDB connection string to connect to the DocumentDB cluster"
  value       = "mongodb://${var.db_username}:${random_password.master_password.result}@${aws_docdb_cluster.this.endpoint}:${aws_docdb_cluster.this.port}/?tls=${var.enable_tls}&replicaSet=rs0&readPreference=secondaryPreferred"
}