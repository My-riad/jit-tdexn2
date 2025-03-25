# =============================================================================
# Development Environment Outputs for AI-driven Freight Optimization Platform
# =============================================================================
#
# This file defines outputs that expose information about the provisioned
# infrastructure resources for the development environment. These outputs
# can be used by other Terraform modules or external systems to interact
# with the deployed resources.
#
# =============================================================================

# -----------------------------------------------------------------------------
# VPC Outputs
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "The IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "The IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "database_subnet_ids" {
  description = "The IDs of the database subnets"
  value       = module.vpc.database_subnet_ids
}

# -----------------------------------------------------------------------------
# EKS Cluster Outputs
# -----------------------------------------------------------------------------

output "eks_cluster_id" {
  description = "The ID of the EKS cluster"
  value       = module.eks.cluster_id
}

output "eks_cluster_endpoint" {
  description = "The endpoint for the EKS Kubernetes API"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_security_group_id" {
  description = "The security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "eks_cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
}

# -----------------------------------------------------------------------------
# RDS Database Outputs
# -----------------------------------------------------------------------------

output "rds_endpoint" {
  description = "The connection endpoint for the RDS PostgreSQL database"
  value       = module.rds.db_instance_endpoint
}

output "rds_port" {
  description = "The port on which the RDS database accepts connections"
  value       = module.rds.db_instance_port
}

output "rds_database_name" {
  description = "The name of the RDS database"
  value       = module.rds.db_instance_name
}

output "rds_username" {
  description = "The master username for the RDS database"
  value       = module.rds.db_instance_username
}

# -----------------------------------------------------------------------------
# DocumentDB Outputs
# -----------------------------------------------------------------------------

output "documentdb_endpoint" {
  description = "The connection endpoint for the DocumentDB cluster"
  value       = module.documentdb.cluster_endpoint
}

output "documentdb_reader_endpoint" {
  description = "The reader endpoint for the DocumentDB cluster"
  value       = module.documentdb.reader_endpoint
}

# -----------------------------------------------------------------------------
# ElastiCache Redis Outputs
# -----------------------------------------------------------------------------

output "redis_endpoint" {
  description = "The connection endpoint for the ElastiCache Redis cluster"
  value       = module.elasticache.primary_endpoint
}

# -----------------------------------------------------------------------------
# MSK Kafka Outputs
# -----------------------------------------------------------------------------

output "msk_bootstrap_brokers_tls" {
  description = "The TLS connection host:port pairs for the MSK Kafka brokers"
  value       = module.msk.bootstrap_brokers_tls
}

# -----------------------------------------------------------------------------
# S3 Bucket Outputs
# -----------------------------------------------------------------------------

output "s3_data_bucket" {
  description = "The name of the S3 bucket for application data"
  value       = module.s3_data.aws_s3_bucket.main.id
}

output "s3_logs_bucket" {
  description = "The name of the S3 bucket for logs"
  value       = module.s3_logs.aws_s3_bucket.main.id
}

output "s3_backups_bucket" {
  description = "The name of the S3 bucket for backups"
  value       = module.s3_backups.aws_s3_bucket.main.id
}

# -----------------------------------------------------------------------------
# Security Outputs
# -----------------------------------------------------------------------------

output "kms_key_id" {
  description = "The ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

# -----------------------------------------------------------------------------
# Bastion Host Outputs
# -----------------------------------------------------------------------------

output "bastion_public_ip" {
  description = "The public IP address of the bastion host"
  value       = aws_instance.bastion.public_ip
}

# -----------------------------------------------------------------------------
# Monitoring Outputs
# -----------------------------------------------------------------------------

output "sns_topic_arn" {
  description = "The ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

# -----------------------------------------------------------------------------
# Kubernetes Configuration
# -----------------------------------------------------------------------------

output "kubeconfig" {
  description = "Kubernetes configuration for connecting to the cluster"
  value       = module.eks.kubeconfig
  sensitive   = true
}