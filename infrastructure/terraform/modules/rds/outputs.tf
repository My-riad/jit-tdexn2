# RDS module outputs

output "db_instance_id" {
  description = "The ID of the RDS instance"
  value       = aws_db_instance.this.id
}

output "db_instance_address" {
  description = "The hostname of the RDS instance"
  value       = aws_db_instance.this.address
}

output "db_instance_endpoint" {
  description = "The connection endpoint of the RDS instance"
  value       = aws_db_instance.this.endpoint
}

output "db_instance_port" {
  description = "The database port"
  value       = aws_db_instance.this.port
}

output "db_instance_name" {
  description = "The database name"
  value       = aws_db_instance.this.db_name
}

output "db_instance_username" {
  description = "The master username for the database"
  value       = aws_db_instance.this.username
}

output "db_instance_password" {
  description = "The master password for the database"
  value       = random_password.master_password.result
  sensitive   = true
}

output "db_subnet_group_id" {
  description = "The ID of the DB subnet group"
  value       = aws_db_subnet_group.this.id
}

output "db_parameter_group_id" {
  description = "The ID of the DB parameter group"
  value       = aws_db_parameter_group.this.id
}

output "db_security_group_id" {
  description = "The ID of the security group created for the RDS instance"
  value       = aws_security_group.rds.id
}

output "read_replica_id" {
  description = "The ID of the RDS read replica (if created)"
  value       = length(aws_db_instance.read_replica) > 0 ? aws_db_instance.read_replica[0].id : null
}

output "read_replica_endpoint" {
  description = "The connection endpoint of the read replica (if created)"
  value       = length(aws_db_instance.read_replica) > 0 ? aws_db_instance.read_replica[0].endpoint : null
}

output "cloudwatch_alarm_arns" {
  description = "List of ARNs of the CloudWatch alarms created for the RDS instance"
  value       = [
    aws_cloudwatch_metric_alarm.cpu_utilization_high.arn,
    aws_cloudwatch_metric_alarm.free_storage_space_low.arn, 
    aws_cloudwatch_metric_alarm.database_connections_high.arn
  ]
}