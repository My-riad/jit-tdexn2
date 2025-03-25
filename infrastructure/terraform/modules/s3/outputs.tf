output "bucket_id" {
  description = "The ID of the main S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "bucket_arn" {
  description = "The ARN of the main S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "bucket_domain_name" {
  description = "The domain name of the main S3 bucket"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "The regional domain name of the main S3 bucket"
  value       = aws_s3_bucket.main.bucket_regional_domain_name
}

output "replication_bucket_id" {
  description = "The ID of the replication S3 bucket (if created)"
  value       = var.enable_replication ? aws_s3_bucket.replication[0].id : null
}

output "replication_bucket_arn" {
  description = "The ARN of the replication S3 bucket (if created)"
  value       = var.enable_replication ? aws_s3_bucket.replication[0].arn : null
}

output "replication_role_arn" {
  description = "The ARN of the IAM role used for S3 replication (if created)"
  value       = var.enable_replication ? aws_iam_role.replication[0].arn : null
}