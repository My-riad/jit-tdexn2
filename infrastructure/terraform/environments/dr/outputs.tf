# VPC Outputs
output "vpc_id" {
  description = "The ID of the VPC in the DR region"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC in the DR region"
  value       = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "The IDs of the public subnets in the DR region"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "The IDs of the private subnets in the DR region"
  value       = module.vpc.private_subnet_ids
}

output "database_subnet_ids" {
  description = "The IDs of the database subnets in the DR region"
  value       = module.vpc.database_subnet_ids
}

output "database_subnet_group_name" {
  description = "Name of the database subnet group in the DR region"
  value       = module.vpc.database_subnet_group_name
}

# EKS Cluster Outputs
output "eks_cluster_id" {
  description = "The ID of the EKS cluster in the DR region"
  value       = module.eks.cluster_id
}

output "eks_cluster_arn" {
  description = "The ARN of the EKS cluster in the DR region"
  value       = module.eks.cluster_arn
}

output "eks_cluster_endpoint" {
  description = "The endpoint for the EKS Kubernetes API in the DR region"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the DR cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "eks_cluster_security_group_id" {
  description = "The security group ID attached to the EKS cluster in the DR region"
  value       = module.eks.cluster_security_group_id
}

output "eks_node_group_arns" {
  description = "The ARNs of the EKS node groups in the DR region"
  value       = module.eks.node_group_arns
}

# RDS Replica Outputs
output "rds_replica_endpoint" {
  description = "The connection endpoint for the RDS read replica in the DR region"
  value       = aws_db_instance.rds_replica.endpoint
}

output "rds_replica_arn" {
  description = "The ARN of the RDS read replica in the DR region"
  value       = aws_db_instance.rds_replica.arn
}

# DocumentDB Outputs
output "documentdb_endpoint" {
  description = "The connection endpoint for the DocumentDB cluster in the DR region"
  value       = module.documentdb_replica.cluster_endpoint
}

output "documentdb_reader_endpoint" {
  description = "The reader endpoint for the DocumentDB cluster in the DR region"
  value       = module.documentdb_replica.reader_endpoint
}

output "documentdb_cluster_arn" {
  description = "The ARN of the DocumentDB cluster in the DR region"
  value       = module.documentdb_replica.cluster_arn
}

# S3 Backup Bucket Outputs
output "s3_backup_bucket" {
  description = "The name of the S3 bucket for backups in the DR region"
  value       = aws_s3_bucket.backup.id
}

output "s3_backup_bucket_arn" {
  description = "The ARN of the S3 bucket for backups in the DR region"
  value       = aws_s3_bucket.backup.arn
}

# KMS Key Outputs
output "kms_key_id" {
  description = "The ID of the KMS key used for encryption in the DR region"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key used for encryption in the DR region"
  value       = aws_kms_key.main.arn
}

# Bastion Host Outputs
output "bastion_public_ip" {
  description = "The public IP address of the bastion host in the DR region"
  value       = aws_instance.bastion.public_ip
}

# Monitoring Outputs
output "monitoring_sns_topic_arn" {
  description = "The ARN of the SNS topic for monitoring alerts in the DR region"
  value       = aws_sns_topic.monitoring_alerts.arn
}

output "cloudwatch_log_group_name" {
  description = "The name of the CloudWatch Log Group for centralized logging in the DR region"
  value       = aws_cloudwatch_log_group.monitoring_logs.name
}

# Backup Outputs
output "backup_vault_arn" {
  description = "The ARN of the AWS Backup vault in the DR region"
  value       = aws_backup_vault.main.arn
}

# Kubernetes Configuration Output (sensitive)
output "kubeconfig" {
  description = "Kubernetes configuration for connecting to the DR cluster"
  value       = module.eks.kubeconfig
  sensitive   = true
}