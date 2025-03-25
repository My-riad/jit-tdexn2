# Outputs for the ElastiCache Redis module

output "redis_replication_group_id" {
  description = "The ID of the ElastiCache replication group"
  value       = aws_elasticache_replication_group.this.id
}

output "redis_primary_endpoint_address" {
  description = "The address of the primary endpoint for the ElastiCache replication group"
  value       = aws_elasticache_replication_group.this.primary_endpoint_address
}

output "redis_reader_endpoint_address" {
  description = "The address of the reader endpoint for the ElastiCache replication group"
  value       = aws_elasticache_replication_group.this.reader_endpoint_address
}

output "redis_port" {
  description = "The port number on which the ElastiCache replication group accepts connections"
  value       = aws_elasticache_replication_group.this.port
}

output "redis_security_group_id" {
  description = "The ID of the security group created for the ElastiCache cluster"
  value       = length(var.security_group_ids) > 0 ? var.security_group_ids[0] : aws_security_group.this[0].id
}

output "redis_subnet_group_name" {
  description = "The name of the ElastiCache subnet group"
  value       = local.subnet_group_name
}

output "redis_parameter_group_name" {
  description = "The name of the ElastiCache parameter group"
  value       = local.parameter_group_name
}

output "redis_auth_token" {
  description = "The authentication token (password) for the ElastiCache replication group"
  value       = var.auth_token
  sensitive   = true
}

output "cloudwatch_alarm_arns" {
  description = "List of ARNs of the CloudWatch alarms created for the ElastiCache cluster"
  value       = var.create_cloudwatch_alarms ? [
    aws_cloudwatch_metric_alarm.cpu_utilization_high[0].arn,
    aws_cloudwatch_metric_alarm.memory_utilization_high[0].arn,
    aws_cloudwatch_metric_alarm.connections_high[0].arn,
    var.num_cache_nodes > 1 ? aws_cloudwatch_metric_alarm.replication_lag[0].arn : ""
  ] : []
}