# ---------------------------------------------------------------------------------------------------------------------
# Security Module Outputs
# 
# This file defines outputs for security resources that can be used by other modules.
# Exposes KMS keys, IAM roles, security groups, WAF configurations, and Secrets Manager resources.
# ---------------------------------------------------------------------------------------------------------------------

# ---------------------------------------------------------------------------------------------------------------------
# KMS Key Outputs
# ---------------------------------------------------------------------------------------------------------------------

output "kms_key_arn" {
  description = "ARN of the KMS key created for data encryption"
  value       = aws_kms_key.main.arn
}

output "kms_key_id" {
  description = "ID of the KMS key created for data encryption"
  value       = aws_kms_key.main.key_id
}

# ---------------------------------------------------------------------------------------------------------------------
# IAM Role Outputs
# ---------------------------------------------------------------------------------------------------------------------

output "eks_cluster_role_arn" {
  description = "ARN of the IAM role created for the EKS cluster"
  value       = aws_iam_role.eks_cluster.arn
}

output "eks_node_group_role_arn" {
  description = "ARN of the IAM role created for EKS node groups"
  value       = aws_iam_role.eks_node_group.arn
}

output "lambda_execution_role_arn" {
  description = "ARN of the IAM role created for Lambda function execution"
  value       = aws_iam_role.lambda_execution.arn
}

# ---------------------------------------------------------------------------------------------------------------------
# Security Group Outputs
# ---------------------------------------------------------------------------------------------------------------------

output "api_gateway_security_group_id" {
  description = "ID of the security group created for API Gateway"
  value       = aws_security_group.api_gateway.id
}

output "application_security_group_id" {
  description = "ID of the security group created for application services"
  value       = aws_security_group.application.id
}

output "database_security_group_id" {
  description = "ID of the security group created for database services"
  value       = aws_security_group.database.id
}

output "kafka_security_group_id" {
  description = "ID of the security group created for Kafka cluster"
  value       = aws_security_group.kafka.id
}

# Consolidated map of all security group IDs
output "security_group_ids" {
  description = "Map of all security group IDs created by the module"
  value = {
    api_gateway = aws_security_group.api_gateway.id
    application = aws_security_group.application.id
    database    = aws_security_group.database.id
    kafka       = aws_security_group.kafka.id
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# WAF Outputs
# ---------------------------------------------------------------------------------------------------------------------

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL created for API protection"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : ""
}

# ---------------------------------------------------------------------------------------------------------------------
# Secrets Manager Outputs
# ---------------------------------------------------------------------------------------------------------------------

output "database_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret for database credentials"
  value       = aws_secretsmanager_secret.database_credentials.arn
}

output "api_keys_secret_arn" {
  description = "ARN of the Secrets Manager secret for API keys"
  value       = aws_secretsmanager_secret.api_keys.arn
}