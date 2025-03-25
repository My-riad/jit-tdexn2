# AWS Regions
variable "aws_region" {
  type        = string
  description = "AWS region where resources will be created"
  default     = "us-east-1"
}

variable "dr_region" {
  type        = string
  description = "AWS region for disaster recovery"
  default     = "us-west-2"
}

# Environment
variable "environment" {
  type        = string
  description = "Environment name used for tagging and naming resources"
  default     = "prod"
}

# VPC and Networking
variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.2.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones to use for the subnets in the VPC"
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnets" {
  type        = list(string)
  description = "List of CIDR blocks for the public subnets"
  default     = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
}

variable "private_subnets" {
  type        = list(string)
  description = "List of CIDR blocks for the private subnets"
  default     = ["10.2.4.0/24", "10.2.5.0/24", "10.2.6.0/24"]
}

variable "database_subnets" {
  type        = list(string)
  description = "List of CIDR blocks for the database subnets"
  default     = ["10.2.7.0/24", "10.2.8.0/24", "10.2.9.0/24"]
}

# EKS Configuration
variable "eks_cluster_name" {
  type        = string
  description = "Name of the EKS cluster"
  default     = "freight-optimization-prod"
}

variable "eks_cluster_version" {
  type        = string
  description = "Kubernetes version to use for the EKS cluster"
  default     = "1.28"
}

variable "eks_node_groups" {
  type = map(object({
    instance_types = list(string)
    desired_size   = number
    min_size       = number
    max_size       = number
    labels         = map(string)
    tags           = map(string)
  }))
  description = "Map of EKS node group configurations"
  default = {
    system = {
      instance_types = ["m6i.large"]
      desired_size   = 3
      min_size       = 3
      max_size       = 5
      labels         = { role = "system" }
      tags           = { NodeGroupType = "system" }
    }
    application = {
      instance_types = ["c6i.2xlarge"]
      desired_size   = 8
      min_size       = 4
      max_size       = 20
      labels         = { role = "application" }
      tags           = { NodeGroupType = "application" }
    }
    data = {
      instance_types = ["r6i.2xlarge"]
      desired_size   = 5
      min_size       = 2
      max_size       = 10
      labels         = { role = "data" }
      tags           = { NodeGroupType = "data" }
    }
    ml = {
      instance_types = ["g5.xlarge"]
      desired_size   = 2
      min_size       = 1
      max_size       = 5
      labels         = { role = "ml" }
      tags           = { NodeGroupType = "ml" }
    }
  }
}

# RDS PostgreSQL Database
variable "db_instance_class" {
  type        = string
  description = "Instance class for the RDS PostgreSQL database"
  default     = "db.r6i.2xlarge"
}

variable "db_allocated_storage" {
  type        = number
  description = "Allocated storage for the RDS instance in gigabytes"
  default     = 200
}

variable "db_max_allocated_storage" {
  type        = number
  description = "Maximum storage limit for RDS autoscaling in gigabytes"
  default     = 1000
}

variable "db_name" {
  type        = string
  description = "Name of the PostgreSQL database to create"
  default     = "freightoptimization"
}

variable "db_username" {
  type        = string
  description = "Username for the master database user"
  default     = "dbadmin"
}

variable "db_multi_az" {
  type        = bool
  description = "Whether to enable Multi-AZ deployment for the RDS instance"
  default     = true
}

variable "db_backup_retention_period" {
  type        = number
  description = "Number of days to retain database backups"
  default     = 30
}

# DocumentDB
variable "documentdb_instance_class" {
  type        = string
  description = "Instance class for the DocumentDB cluster"
  default     = "db.r5.2xlarge"
}

variable "documentdb_instance_count" {
  type        = number
  description = "Number of instances in the DocumentDB cluster"
  default     = 3
}

# ElastiCache Redis
variable "redis_node_type" {
  type        = string
  description = "Node type for the ElastiCache Redis cluster"
  default     = "cache.r6g.xlarge"
}

variable "redis_num_cache_nodes" {
  type        = number
  description = "Number of cache nodes in the ElastiCache Redis cluster"
  default     = 3
}

# MSK Kafka
variable "msk_instance_type" {
  type        = string
  description = "Instance type for the MSK Kafka brokers"
  default     = "kafka.m5.xlarge"
}

variable "msk_broker_count" {
  type        = number
  description = "Number of broker nodes in the MSK Kafka cluster"
  default     = 3
}

variable "msk_ebs_volume_size" {
  type        = number
  description = "Size in GiB of the EBS volume for the MSK broker"
  default     = 500
}

# S3 Storage
variable "s3_bucket_name" {
  type        = string
  description = "Name of the S3 bucket for object storage"
  default     = "freight-optimization-prod"
}

variable "s3_dr_bucket_name" {
  type        = string
  description = "Name of the S3 bucket in DR region for disaster recovery"
  default     = "freight-optimization-prod-dr"
}

variable "s3_static_bucket_name" {
  type        = string
  description = "Name of the S3 bucket for static assets"
  default     = "freight-optimization-prod-static"
}

# EC2 Bastion Host
variable "bastion_key_name" {
  type        = string
  description = "Name of the key pair to use for the bastion host"
  default     = "freight-optimization-prod"
}

variable "bastion_instance_type" {
  type        = string
  description = "Instance type for the bastion host"
  default     = "t3.medium"
}

variable "allowed_cidr_blocks" {
  type        = list(string)
  description = "List of CIDR blocks that are allowed to access the bastion host"
  default     = ["10.0.0.0/8"]
}

# DNS and CloudFront
variable "domain_name" {
  type        = string
  description = "Domain name for the application"
  default     = "freightoptimization.com"
}

variable "app_subdomain" {
  type        = string
  description = "Subdomain for the web application"
  default     = "app"
}

variable "api_subdomain" {
  type        = string
  description = "Subdomain for the API"
  default     = "api"
}

variable "cloudfront_price_class" {
  type        = string
  description = "Price class for the CloudFront distribution"
  default     = "PriceClass_All"
}

# Tags
variable "tags" {
  type        = map(string)
  description = "Common tags to apply to all resources"
  default = {
    Project     = "FreightOptimization"
    Environment = "prod"
    ManagedBy   = "Terraform"
  }
}