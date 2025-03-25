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
  value       = aws_docdb_cluster.this.master_username
}

output "cluster_password" {
  description = "The master password for the DocumentDB cluster"
  value       = random_password.master_password.result
  sensitive   = true
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
  value       = "mongodb://${aws_docdb_cluster.this.master_username}:${urlencode(random_password.master_password.result)}@${aws_docdb_cluster.this.endpoint}:${aws_docdb_cluster.this.port}/?tls=${var.enable_tls ? "true" : "false"}&replicaSet=rs0&readPreference=secondaryPreferred"
  sensitive   = true
}

output "cloudwatch_alarm_arns" {
  description = "List of ARNs of the CloudWatch alarms created for the DocumentDB instances"
  value       = length(var.alarm_actions) > 0 ? [for i in range(var.instance_count) : aws_cloudwatch_metric_alarm.cpu_utilization_high[i].arn] : []
}