output "cloudwatch_dashboard_arns" {
  description = "List of ARNs for all CloudWatch dashboards created by the monitoring module"
  value       = aws_cloudwatch_dashboard.*.dashboard_arn
}

output "cloudwatch_alarm_arns" {
  description = "List of ARNs for all CloudWatch alarms created by the monitoring module"
  value       = aws_cloudwatch_alarm.*.arn
}

output "prometheus_endpoint" {
  description = "Endpoint URL for the Prometheus server for metrics collection"
  value       = aws_route53_record.prometheus.fqdn
}

output "grafana_endpoint" {
  description = "Endpoint URL for the Grafana dashboard for visualization"
  value       = aws_route53_record.grafana.fqdn
}

output "alertmanager_endpoint" {
  description = "Endpoint URL for the AlertManager service for alert handling"
  value       = aws_route53_record.alertmanager.fqdn
}

output "log_group_names" {
  description = "Names of CloudWatch Log Groups created for application logging"
  value       = aws_cloudwatch_log_group.*.name
}

output "metric_namespace" {
  description = "CloudWatch namespace used for custom metrics from the application"
  value       = var.metric_namespace
}

output "monitoring_security_group_id" {
  description = "ID of the security group created for monitoring services"
  value       = aws_security_group.monitoring.id
}

output "monitoring_iam_role_arn" {
  description = "ARN of the IAM role created for monitoring services with necessary permissions"
  value       = aws_iam_role.monitoring.arn
}

output "thanos_query_endpoint" {
  description = "Endpoint URL for the Thanos Query service for long-term metrics storage and global query view"
  value       = aws_route53_record.thanos_query.fqdn
}