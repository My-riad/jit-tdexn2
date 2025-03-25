# =============================================================================
# Development Environment Variables for AI-driven Freight Optimization Platform
# =============================================================================
#
# This file defines all the input parameters needed to configure infrastructure
# resources for the development environment at 25% of production scale.
# It includes configurations for networking, compute, databases, and other 
# AWS services required by the platform.
#
# =============================================================================

# -----------------------------------------------------------------------------
# General settings
# -----------------------------------------------------------------------------

variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name used for tagging and naming resources"
  type        = string
  default     = "dev"
}

# -----------------------------------------------------------------------------
# Networking configuration
# -----------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use for the subnets in the VPC"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "public_subnets" {
  description = "List of CIDR blocks for the public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnets" {
  description = "List of CIDR blocks for the private subnets"
  type        = list(string)
  default     = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
}

variable "database_subnets" {
  description = "List of CIDR blocks for the database subnets"
  type        = list(string)
  default     = ["10.0.7.0/24", "10.0.8.0/24", "10.0.9.0/24"]
}

# -----------------------------------------------------------------------------
# EKS cluster configuration
# -----------------------------------------------------------------------------

variable "eks_cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "freight-optimization-dev"
}

variable "eks_cluster_version" {
  description = "Kubernetes version to use for the EKS cluster"
  type        = string
  default     = "1.28"
}

variable "eks_node_groups" {
  description = "Map of EKS node group configurations"
  type        = map(object({
    instance_types = list(string)
    desired_size   = number
    min_size       = number
    max_size       = number
    labels         = map(string)
    tags           = map(string)
  }))
  default = {
    system = {
      instance_types = ["m6i.large"]
      desired_size   = 2
      min_size       = 2
      max_size       = 3
      labels         = { role = "system" }
      tags           = { NodeGroupType = "system" }
    }
    application = {
      instance_types = ["c6i.xlarge"]
      desired_size   = 2
      min_size       = 1
      max_size       = 4
      labels         = { role = "application" }
      tags           = { NodeGroupType = "application" }
    }
    data = {
      instance_types = ["r6i.large"]
      desired_size   = 1
      min_size       = 1
      max_size       = 2
      labels         = { role = "data" }
      tags           = { NodeGroupType = "data" }
    }
    ml = {
      instance_types = ["g5.xlarge"]
      desired_size   = 0
      min_size       = 0
      max_size       = 1
      labels         = { role = "ml" }
      tags           = { NodeGroupType = "ml" }
    }
  }
}

# -----------------------------------------------------------------------------
# RDS PostgreSQL configuration
# -----------------------------------------------------------------------------

variable "db_instance_class" {
  description = "Instance class for the RDS PostgreSQL database"
  type        = string
  default     = "db.t3.large"
}

variable "db_allocated_storage" {
  description = "Allocated storage for the RDS instance in gigabytes"
  type        = number
  default     = 50
}

variable "db_max_allocated_storage" {
  description = "Maximum storage limit for RDS autoscaling in gigabytes"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Name of the PostgreSQL database to create"
  type        = string
  default     = "freightoptimization"
}

variable "db_username" {
  description = "Username for the master database user"
  type        = string
  default     = "dbadmin"
}

variable "db_multi_az" {
  description = "Whether to enable Multi-AZ deployment for the RDS instance"
  type        = bool
  default     = false
}

variable "db_backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7
}

# -----------------------------------------------------------------------------
# DocumentDB configuration
# -----------------------------------------------------------------------------

variable "documentdb_instance_class" {
  description = "Instance class for the DocumentDB cluster"
  type        = string
  default     = "db.t3.medium"
}

variable "documentdb_instance_count" {
  description = "Number of instances in the DocumentDB cluster"
  type        = number
  default     = 1
}

# -----------------------------------------------------------------------------
# ElastiCache Redis configuration
# -----------------------------------------------------------------------------

variable "redis_node_type" {
  description = "Node type for the ElastiCache Redis cluster"
  type        = string
  default     = "cache.t3.small"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes in the ElastiCache Redis cluster"
  type        = number
  default     = 1
}

# -----------------------------------------------------------------------------
# MSK Kafka configuration
# -----------------------------------------------------------------------------

variable "msk_instance_type" {
  description = "Instance type for the MSK Kafka brokers"
  type        = string
  default     = "kafka.t3.small"
}

variable "msk_broker_count" {
  description = "Number of broker nodes in the MSK Kafka cluster"
  type        = number
  default     = 2
}

variable "msk_ebs_volume_size" {
  description = "Size in GiB of the EBS volume for the MSK broker"
  type        = number
  default     = 100
}

# -----------------------------------------------------------------------------
# S3 bucket configuration
# -----------------------------------------------------------------------------

variable "s3_bucket_name" {
  description = "Name of the S3 bucket for object storage"
  type        = string
  default     = "freight-optimization-dev"
}

# -----------------------------------------------------------------------------
# Bastion host configuration
# -----------------------------------------------------------------------------

variable "bastion_key_name" {
  description = "Name of the key pair to use for the bastion host"
  type        = string
  default     = "freight-optimization-dev"
}

variable "bastion_instance_type" {
  description = "Instance type for the bastion host"
  type        = string
  default     = "t3.micro"
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks that are allowed to access the bastion host"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

# -----------------------------------------------------------------------------
# Tagging configuration
# -----------------------------------------------------------------------------

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "FreightOptimization"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}