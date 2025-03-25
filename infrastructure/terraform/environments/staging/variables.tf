# AWS Region Configuration
variable "aws_region" {
  type        = string
  description = "AWS region where resources will be created"
  default     = "us-west-2"
}

variable "environment" {
  type        = string
  description = "Environment name used for tagging and naming resources"
  default     = "staging"
}

# VPC Configuration
variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.1.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones to use for the subnets in the VPC"
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "public_subnets" {
  type        = list(string)
  description = "List of CIDR blocks for the public subnets"
  default     = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
}

variable "private_subnets" {
  type        = list(string)
  description = "List of CIDR blocks for the private subnets"
  default     = ["10.1.4.0/24", "10.1.5.0/24", "10.1.6.0/24"]
}

variable "database_subnets" {
  type        = list(string)
  description = "List of CIDR blocks for the database subnets"
  default     = ["10.1.7.0/24", "10.1.8.0/24", "10.1.9.0/24"]
}

# EKS Configuration
variable "eks_cluster_name" {
  type        = string
  description = "Name of the EKS cluster"
  default     = "freight-optimization-staging"
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
      min_size       = 2
      max_size       = 4
      labels         = { role = "system" }
      tags           = { NodeGroupType = "system" }
    }
    application = {
      instance_types = ["c6i.xlarge"]
      desired_size   = 4
      min_size       = 2
      max_size       = 10
      labels         = { role = "application" }
      tags           = { NodeGroupType = "application" }
    }
    data = {
      instance_types = ["r6i.xlarge"]
      desired_size   = 3
      min_size       = 1
      max_size       = 5
      labels         = { role = "data" }
      tags           = { NodeGroupType = "data" }
    }
    ml = {
      instance_types = ["g5.xlarge"]
      desired_size   = 1
      min_size       = 0
      max_size       = 3
      labels         = { role = "ml" }
      tags           = { NodeGroupType = "ml" }
    }
  }
}

# RDS Configuration
variable "db_instance_class" {
  type        = string
  description = "Instance class for the RDS PostgreSQL database"
  default     = "db.r6i.xlarge"
}

variable "db_allocated_storage" {
  type        = number
  description = "Allocated storage for the RDS instance in gigabytes"
  default     = 100
}

variable "db_max_allocated_storage" {
  type        = number
  description = "Maximum storage limit for RDS autoscaling in gigabytes"
  default     = 500
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
  default     = 14
}

# DocumentDB Configuration
variable "documentdb_instance_class" {
  type        = string
  description = "Instance class for the DocumentDB cluster"
  default     = "db.r5.large"
}

variable "documentdb_instance_count" {
  type        = number
  description = "Number of instances in the DocumentDB cluster"
  default     = 2
}

# ElastiCache Configuration
variable "redis_node_type" {
  type        = string
  description = "Node type for the ElastiCache Redis cluster"
  default     = "cache.r6g.large"
}

variable "redis_num_cache_nodes" {
  type        = number
  description = "Number of cache nodes in the ElastiCache Redis cluster"
  default     = 2
}

# MSK Configuration
variable "msk_instance_type" {
  type        = string
  description = "Instance type for the MSK Kafka brokers"
  default     = "kafka.m5.large"
}

variable "msk_broker_count" {
  type        = number
  description = "Number of broker nodes in the MSK Kafka cluster"
  default     = 2
}

variable "msk_ebs_volume_size" {
  type        = number
  description = "Size in GiB of the EBS volume for the MSK broker"
  default     = 250
}

# S3 Configuration
variable "s3_bucket_name" {
  type        = string
  description = "Name of the S3 bucket for object storage"
  default     = "freight-optimization-staging"
}

# Bastion Host Configuration
variable "bastion_key_name" {
  type        = string
  description = "Name of the key pair to use for the bastion host"
  default     = "freight-optimization-staging"
}

variable "bastion_instance_type" {
  type        = string
  description = "Instance type for the bastion host"
  default     = "t3.small"
}

variable "allowed_cidr_blocks" {
  type        = list(string)
  description = "List of CIDR blocks that are allowed to access the bastion host"
  default     = ["10.0.0.0/8"]
}

# DNS Configuration
variable "domain_name" {
  type        = string
  description = "Domain name for the application"
  default     = "staging.freightoptimization.com"
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

# CloudFront Configuration
variable "cloudfront_price_class" {
  type        = string
  description = "Price class for the CloudFront distribution"
  default     = "PriceClass_100"
}

# Tags
variable "tags" {
  type        = map(string)
  description = "Common tags to apply to all resources"
  default = {
    Project     = "FreightOptimization"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}