# This file defines the output variables for the MSK (Managed Streaming for Kafka) Terraform module.

output "cluster_arn" {
  description = "The Amazon Resource Name (ARN) of the MSK cluster"
  value       = aws_msk_cluster.main.arn
}

output "cluster_name" {
  description = "The name of the MSK cluster"
  value       = aws_msk_cluster.main.cluster_name
}

output "bootstrap_brokers" {
  description = "A comma separated list of one or more hostname:port pairs of Kafka brokers suitable to bootstrap connectivity to the Kafka cluster (PLAINTEXT)"
  value       = aws_msk_cluster.main.bootstrap_brokers
}

output "bootstrap_brokers_tls" {
  description = "A comma separated list of one or more hostname:port pairs of Kafka brokers suitable to bootstrap connectivity to the Kafka cluster (TLS)"
  value       = aws_msk_cluster.main.bootstrap_brokers_tls
}

output "bootstrap_brokers_sasl_scram" {
  description = "A comma separated list of one or more hostname:port pairs of Kafka brokers suitable to bootstrap connectivity to the Kafka cluster (SASL/SCRAM)"
  value       = aws_msk_cluster.main.bootstrap_brokers_sasl_scram
}

output "bootstrap_brokers_sasl_iam" {
  description = "A comma separated list of one or more hostname:port pairs of Kafka brokers suitable to bootstrap connectivity to the Kafka cluster (SASL/IAM)"
  value       = aws_msk_cluster.main.bootstrap_brokers_sasl_iam
}

output "zookeeper_connect_string" {
  description = "A comma separated list of one or more hostname:port pairs to connect to the Apache ZooKeeper cluster"
  value       = aws_msk_cluster.main.zookeeper_connect_string
}

output "zookeeper_connect_string_tls" {
  description = "A comma separated list of one or more hostname:port pairs to connect securely to the Apache ZooKeeper cluster"
  value       = aws_msk_cluster.main.zookeeper_connect_string_tls
}

output "security_group_id" {
  description = "The ID of the security group created for the MSK cluster"
  value       = length(var.security_group_ids) > 0 ? var.security_group_ids[0] : aws_security_group.msk[0].id
}

output "encryption_at_rest_kms_key_arn" {
  description = "The ARN of the KMS key used for encryption at rest of the broker data volumes"
  value       = var.encryption_at_rest_kms_key_arn != null ? var.encryption_at_rest_kms_key_arn : aws_kms_key.msk[0].arn
}

output "configuration_arn" {
  description = "The Amazon Resource Name (ARN) of the MSK configuration"
  value       = aws_msk_configuration.main.arn
}

output "configuration_revision" {
  description = "The revision of the MSK configuration"
  value       = aws_msk_configuration.main.latest_revision
}

output "log_group_name" {
  description = "The name of the CloudWatch log group created for MSK broker logs"
  value       = aws_cloudwatch_log_group.msk_log_group.name
}

output "s3_logs_bucket" {
  description = "The name of the S3 bucket created for MSK logs"
  value       = aws_s3_bucket.msk_logs.id
}