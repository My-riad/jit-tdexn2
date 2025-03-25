# Terraform State Management outputs
output "terraform_state_bucket_name" {
  description = "Name of the S3 bucket for storing Terraform state files"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_state_bucket_arn" {
  description = "ARN of the S3 bucket for storing Terraform state files"
  value       = aws_s3_bucket.terraform_state.arn
}

output "terraform_lock_table_name" {
  description = "Name of the DynamoDB table for Terraform state locking"
  value       = aws_dynamodb_table.terraform_locks.name
}

output "terraform_lock_table_arn" {
  description = "ARN of the DynamoDB table for Terraform state locking"
  value       = aws_dynamodb_table.terraform_locks.arn
}

output "terraform_state_kms_key_id" {
  description = "ID of the KMS key used for encrypting Terraform state"
  value       = aws_kms_key.terraform_state.key_id
}

output "terraform_state_kms_key_arn" {
  description = "ARN of the KMS key used for encrypting Terraform state"
  value       = aws_kms_key.terraform_state.arn
}

# CloudTrail KMS key outputs
output "cloudtrail_kms_key_id" {
  description = "ID of the KMS key used for encrypting CloudTrail logs"
  value       = aws_kms_key.cloudtrail.key_id
}

output "cloudtrail_kms_key_arn" {
  description = "ARN of the KMS key used for encrypting CloudTrail logs"
  value       = aws_kms_key.cloudtrail.arn
}

# ECR KMS key outputs
output "ecr_kms_key_id" {
  description = "ID of the KMS key used for encrypting ECR repositories"
  value       = aws_kms_key.ecr.key_id
}

output "ecr_kms_key_arn" {
  description = "ARN of the KMS key used for encrypting ECR repositories"
  value       = aws_kms_key.ecr.arn
}

# ECR repository outputs
output "ecr_repository_urls" {
  description = "Map of ECR repository names to their repository URLs"
  value       = {for name in var.ecr_repository_names : name => aws_ecr_repository[replace(name, "-", "_")].repository_url}
}

output "ecr_repository_arns" {
  description = "Map of ECR repository names to their ARNs"
  value       = {for name in var.ecr_repository_names : name => aws_ecr_repository[replace(name, "-", "_")].arn}
}

# Route53 outputs
output "primary_domain_name" {
  description = "Primary domain name for the application"
  value       = var.domain_name
}

output "primary_zone_id" {
  description = "Route53 hosted zone ID for the primary domain"
  value       = aws_route53_zone.primary.zone_id
}

output "primary_zone_name_servers" {
  description = "Name servers for the primary Route53 hosted zone"
  value       = aws_route53_zone.primary.name_servers
}

# GitHub Actions outputs
output "github_actions_role_arn" {
  description = "ARN of the IAM role for GitHub Actions"
  value       = aws_iam_role.github_actions.arn
}

output "github_actions_role_name" {
  description = "Name of the IAM role for GitHub Actions"
  value       = aws_iam_role.github_actions.name
}