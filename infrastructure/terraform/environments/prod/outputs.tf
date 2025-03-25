# VPC Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
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

output "database_subnet_group_name" {
  description = "Name of the database subnet group"
  value       = module.vpc.database_subnet_group_name
}

# EKS Outputs
output "eks_cluster_id" {
  description = "The ID of the EKS cluster"
  value       = module.eks.cluster_id
}

output "eks_cluster_arn" {
  description = "The ARN of the EKS cluster"
  value       = module.eks.cluster_arn
}

output "eks_cluster_endpoint" {
  description = "The endpoint for the EKS Kubernetes API"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "eks_cluster_security_group_id" {
  description = "The security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "eks_node_group_arns" {
  description = "The ARNs of the EKS node groups"
  value       = module.eks.node_group_arns
}

# RDS Outputs
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

output "rds_read_replica_endpoint" {
  description = "The connection endpoint for the RDS read replica"
  value       = module.rds.read_replica_endpoint
}

# DocumentDB Outputs
output "documentdb_endpoint" {
  description = "The connection endpoint for the DocumentDB cluster"
  value       = module.documentdb_cluster.cluster_endpoint
}

output "documentdb_reader_endpoint" {
  description = "The reader endpoint for the DocumentDB cluster"
  value       = module.documentdb_cluster.reader_endpoint
}

# ElastiCache Outputs
output "redis_endpoint" {
  description = "The connection endpoint for the ElastiCache Redis cluster"
  value       = module.elasticache.primary_endpoint
}

output "redis_reader_endpoint" {
  description = "The reader endpoint for the ElastiCache Redis cluster"
  value       = module.elasticache.reader_endpoint
}

# MSK Outputs
output "msk_bootstrap_brokers_tls" {
  description = "The TLS connection host:port pairs for the MSK Kafka brokers"
  value       = module.msk_cluster.bootstrap_brokers_tls
}

# S3 Outputs
output "s3_main_bucket" {
  description = "The name of the S3 bucket for application data"
  value       = aws_s3_bucket.main.id
}

output "s3_dr_bucket" {
  description = "The name of the S3 bucket in DR region for disaster recovery"
  value       = aws_s3_bucket.dr_bucket.id
}

output "s3_static_bucket" {
  description = "The name of the S3 bucket for static assets"
  value       = aws_s3_bucket.static.id
}

output "s3_flow_logs_bucket" {
  description = "The name of the S3 bucket for flow logs"
  value       = aws_s3_bucket.flow_logs.id
}

# KMS Outputs
output "kms_key_ids" {
  description = "The IDs of the KMS keys"
  value = {
    rds        = aws_kms_key.rds.key_id
    documentdb = aws_kms_key.documentdb.key_id
    elasticache = aws_kms_key.elasticache.key_id
    msk        = aws_kms_key.msk.key_id
    s3         = aws_kms_key.s3.key_id
    s3_dr      = aws_kms_key.s3_dr.key_id
    ecr        = aws_kms_key.ecr.key_id
  }
}

# Bastion Outputs
output "bastion_public_ip" {
  description = "The public IP address of the bastion host"
  value       = aws_instance.bastion.public_ip
}

# Monitoring Outputs
output "monitoring_sns_topic_arn" {
  description = "The ARN of the SNS topic for monitoring alerts"
  value       = aws_sns_topic.monitoring_alerts.arn
}

output "cloudwatch_log_group_name" {
  description = "The name of the CloudWatch Log Group for centralized logging"
  value       = aws_cloudwatch_log_group.monitoring_logs.name
}

# Backup Outputs
output "backup_vault_arns" {
  description = "The ARNs of the AWS Backup vaults"
  value = {
    main = aws_backup_vault.main.arn
    dr   = aws_backup_vault.dr.arn
  }
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "The canonical hosted zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

# API Gateway Outputs
output "api_gateway_id" {
  description = "The ID of the API Gateway HTTP API"
  value       = aws_apigatewayv2_api.main.id
}

output "api_gateway_endpoint" {
  description = "The endpoint URL of the API Gateway HTTP API"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_distribution_domain_name" {
  description = "The domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

# Route53 Outputs
output "route53_zone_id" {
  description = "The ID of the Route53 hosted zone"
  value       = aws_route53_zone.main.zone_id
}

output "route53_zone_name_servers" {
  description = "The name servers of the Route53 hosted zone"
  value       = aws_route53_zone.main.name_servers
}

# ECR Repository Outputs
output "ecr_repository_urls" {
  description = "The URLs of the ECR repositories"
  value = {
    api_gateway              = aws_ecr_repository.api_gateway.repository_url
    auth_service             = aws_ecr_repository.auth_service.repository_url
    driver_service           = aws_ecr_repository.driver_service.repository_url
    load_service             = aws_ecr_repository.load_service.repository_url
    load_matching_service    = aws_ecr_repository.load_matching_service.repository_url
    optimization_engine      = aws_ecr_repository.optimization_engine.repository_url
    tracking_service         = aws_ecr_repository.tracking_service.repository_url
    gamification_service     = aws_ecr_repository.gamification_service.repository_url
    market_intelligence_service = aws_ecr_repository.market_intelligence_service.repository_url
    notification_service     = aws_ecr_repository.notification_service.repository_url
    integration_service      = aws_ecr_repository.integration_service.repository_url
  }
}

# Sensitive Outputs
output "kubeconfig" {
  description = "Kubernetes configuration for connecting to the cluster"
  value       = module.eks.kubeconfig
  sensitive   = true
}

output "rds_password" {
  description = "The master password for the RDS database"
  value       = module.rds.db_instance_password
  sensitive   = true
}