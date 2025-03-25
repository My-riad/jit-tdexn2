terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

locals {
  name_prefix = "${var.application}-${var.environment}"
  default_tags = {
    Environment = var.environment
    Application = var.application
    ManagedBy   = "Terraform"
  }
  all_tags = merge(var.tags, local.default_tags)
  parameter_group_name = var.parameter_group_name != "" ? var.parameter_group_name : aws_elasticache_parameter_group.this[0].name
  subnet_group_name    = var.subnet_group_name != "" ? var.subnet_group_name : aws_elasticache_subnet_group.this[0].name
}

resource "aws_elasticache_subnet_group" "this" {
  count = var.subnet_group_name == "" ? 1 : 0
  
  name        = "${local.name_prefix}-redis-subnet-group"
  subnet_ids  = var.subnet_ids
  description = "Subnet group for ${local.name_prefix} Redis cluster"
  tags        = local.all_tags
}

resource "aws_elasticache_parameter_group" "this" {
  count = var.parameter_group_name == "" ? 1 : 0
  
  name        = "${local.name_prefix}-redis-params"
  family      = "redis7"
  description = "Parameter group for ${local.name_prefix} Redis cluster"
  parameter   = [for key, value in var.parameter_group_parameters : { name = key, value = value }]
  tags        = local.all_tags
}

resource "aws_security_group" "this" {
  count = length(var.security_group_ids) == 0 ? 1 : 0
  
  name        = "${local.name_prefix}-redis-sg"
  description = "Security group for ${local.name_prefix} Redis cluster"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
    description     = "Redis access from allowed security groups"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = local.all_tags
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id       = "${local.name_prefix}-redis"
  description                = "Redis cluster for ${local.name_prefix}"
  node_type                  = var.node_type
  port                       = 6379
  parameter_group_name       = local.parameter_group_name
  subnet_group_name          = local.subnet_group_name
  security_group_ids         = length(var.security_group_ids) > 0 ? var.security_group_ids : [aws_security_group.this[0].id]
  engine_version             = var.engine_version
  num_cache_clusters         = var.num_cache_nodes
  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled           = var.multi_az_enabled
  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token                 = var.transit_encryption_enabled && var.auth_token != "" ? var.auth_token : null
  snapshot_retention_limit   = var.snapshot_retention_limit
  snapshot_window            = var.snapshot_window
  maintenance_window         = var.maintenance_window
  apply_immediately          = var.apply_immediately
  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  notification_topic_arn     = var.notification_topic_arn
  tags                       = local.all_tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_utilization_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0
  
  alarm_name          = "${local.name_prefix}-redis-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_threshold_percent
  alarm_description   = "Redis cluster CPU utilization is too high"
  alarm_actions       = [var.notification_topic_arn]
  ok_actions          = [var.notification_topic_arn]
  
  dimensions = {
    CacheClusterId = "${aws_elasticache_replication_group.this.id}-001"
  }
  
  tags = local.all_tags
}

resource "aws_cloudwatch_metric_alarm" "memory_utilization_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0
  
  alarm_name          = "${local.name_prefix}-redis-memory-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = var.memory_threshold_percent
  alarm_description   = "Redis cluster memory utilization is too high"
  alarm_actions       = [var.notification_topic_arn]
  ok_actions          = [var.notification_topic_arn]
  
  dimensions = {
    CacheClusterId = "${aws_elasticache_replication_group.this.id}-001"
  }
  
  tags = local.all_tags
}

resource "aws_cloudwatch_metric_alarm" "connections_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0
  
  alarm_name          = "${local.name_prefix}-redis-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CurrConnections"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = var.connection_threshold
  alarm_description   = "Redis cluster connection count is too high"
  alarm_actions       = [var.notification_topic_arn]
  ok_actions          = [var.notification_topic_arn]
  
  dimensions = {
    CacheClusterId = "${aws_elasticache_replication_group.this.id}-001"
  }
  
  tags = local.all_tags
}

resource "aws_cloudwatch_metric_alarm" "replication_lag" {
  count = var.create_cloudwatch_alarms && var.num_cache_nodes > 1 ? 1 : 0
  
  alarm_name          = "${local.name_prefix}-redis-replication-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ReplicationLag"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = var.replication_lag_threshold
  alarm_description   = "Redis cluster replication lag is too high"
  alarm_actions       = [var.notification_topic_arn]
  ok_actions          = [var.notification_topic_arn]
  
  dimensions = {
    CacheClusterId = "${aws_elasticache_replication_group.this.id}-002"
  }
  
  tags = local.all_tags
}