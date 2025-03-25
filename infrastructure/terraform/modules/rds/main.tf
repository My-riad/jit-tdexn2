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

locals {
  db_subnet_group_name      = "${var.name}-${var.environment}"
  parameter_group_name      = "${var.name}-${var.environment}"
  option_group_name         = "${var.name}-${var.environment}"
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.name}-${var.environment}-final-snapshot-${formatdate("YYYYMMDDhhmmss", timestamp())}"
}

resource "random_password" "master_password" {
  length      = 16
  special     = false
  min_upper   = 2
  min_lower   = 2
  min_numeric = 2
}

resource "aws_security_group" "rds" {
  name        = "${var.name}-rds-${var.environment}"
  description = "Allow access to PostgreSQL RDS instances"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.app_security_group_ids
    description     = "PostgreSQL access from application security groups"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.name}-rds-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "this" {
  name       = local.db_subnet_group_name
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.name}-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_db_parameter_group" "this" {
  name        = local.parameter_group_name
  family      = "postgres15"
  description = "Custom parameter group for ${var.name} PostgreSQL instances"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,auto_explain,pg_hint_plan,pgaudit,postgis"
  }

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "max_connections"
    value = "200"
  }

  parameter {
    name  = "work_mem"
    value = "4096"
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "128000"
  }

  parameter {
    name  = "random_page_cost"
    value = "1.1"
  }

  parameter {
    name  = "effective_cache_size"
    value = "4194304"
  }

  tags = {
    Name        = "${var.name}-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_db_instance" "this" {
  identifier                          = "${var.name}-${var.environment}"
  engine                              = "postgres"
  engine_version                      = "15.3"
  instance_class                      = var.instance_class
  allocated_storage                   = var.allocated_storage
  max_allocated_storage               = var.max_allocated_storage
  storage_type                        = "gp3"
  storage_encrypted                   = true
  kms_key_id                          = var.kms_key_id
  db_name                             = var.db_name
  username                            = var.db_username
  password                            = random_password.master_password.result
  port                                = 5432
  multi_az                            = var.multi_az
  publicly_accessible                 = false
  vpc_security_group_ids              = [aws_security_group.rds.id]
  db_subnet_group_name                = aws_db_subnet_group.this.name
  parameter_group_name                = aws_db_parameter_group.this.name
  backup_retention_period             = var.backup_retention_period
  backup_window                       = "03:00-05:00"
  maintenance_window                  = "sun:05:00-sun:07:00"
  auto_minor_version_upgrade          = true
  deletion_protection                 = var.deletion_protection
  skip_final_snapshot                 = var.skip_final_snapshot
  final_snapshot_identifier           = local.final_snapshot_identifier
  copy_tags_to_snapshot               = true
  performance_insights_enabled        = true
  performance_insights_retention_period = 7
  monitoring_interval                 = 60
  monitoring_role_arn                 = var.monitoring_role_arn
  enabled_cloudwatch_logs_exports     = ["postgresql", "upgrade"]

  tags = {
    Name        = "${var.name}-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_db_instance" "read_replica" {
  count                               = var.create_read_replica ? 1 : 0
  identifier                          = "${var.name}-replica-${var.environment}"
  replicate_source_db                 = aws_db_instance.this.identifier
  instance_class                      = var.replica_instance_class
  storage_encrypted                   = true
  kms_key_id                          = var.kms_key_id
  port                                = 5432
  publicly_accessible                 = false
  vpc_security_group_ids              = [aws_security_group.rds.id]
  parameter_group_name                = aws_db_parameter_group.this.name
  backup_retention_period             = 0
  auto_minor_version_upgrade          = true
  copy_tags_to_snapshot               = true
  performance_insights_enabled        = true
  performance_insights_retention_period = 7
  monitoring_interval                 = 60
  monitoring_role_arn                 = var.monitoring_role_arn
  enabled_cloudwatch_logs_exports     = ["postgresql", "upgrade"]

  tags = {
    Name        = "${var.name}-replica-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_utilization_high" {
  alarm_name          = "${var.name}-${var.environment}-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.this.id
  }
  tags = {
    Name        = "${var.name}-${var.environment}-cpu-utilization-high"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "free_storage_space_low" {
  alarm_name          = "${var.name}-${var.environment}-free-storage-space-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 10737418240  # 10GB threshold
  alarm_description   = "This metric monitors RDS free storage space (10GB threshold)"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.this.id
  }
  tags = {
    Name        = "${var.name}-${var.environment}-free-storage-space-low"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "database_connections_high" {
  alarm_name          = "${var.name}-${var.environment}-database-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 180  # 90% of max connections (200)
  alarm_description   = "This metric monitors the number of database connections (90% of max)"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.this.id
  }
  tags = {
    Name        = "${var.name}-${var.environment}-database-connections-high"
    Environment = var.environment
  }
}

# Outputs
output "db_instance_id" {
  description = "The ID of the RDS instance"
  value       = aws_db_instance.this.id
}

output "db_instance_address" {
  description = "The address of the RDS instance"
  value       = aws_db_instance.this.address
}

output "db_instance_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.this.endpoint
}

output "db_instance_arn" {
  description = "The ARN of the RDS instance"
  value       = aws_db_instance.this.arn
}

output "db_instance_name" {
  description = "The database name"
  value       = aws_db_instance.this.db_name
}

output "master_username" {
  description = "The master username for the database"
  value       = aws_db_instance.this.username
}

output "master_password" {
  description = "The master password for the database"
  value       = random_password.master_password.result
  sensitive   = true
}

output "read_replica_endpoint" {
  description = "The connection endpoint for the read replica"
  value       = var.create_read_replica ? aws_db_instance.read_replica[0].endpoint : null
}

output "security_group_id" {
  description = "The ID of the security group created for RDS"
  value       = aws_security_group.rds.id
}