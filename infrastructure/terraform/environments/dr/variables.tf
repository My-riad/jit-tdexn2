#############################
# General Settings
#############################

variable "aws_region" {
  description = "AWS region where DR resources will be created"
  type        = string
  default     = "us-west-2"
}

variable "primary_region" {
  description = "AWS region of the primary production environment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name used for tagging and naming resources"
  type        = string
  default     = "dr"
}

variable "tags" {
  description = "Common tags to apply to all resources in DR region"
  type        = map(string)
  default = {
    Project     = "FreightOptimization"
    Environment = "dr"
    ManagedBy   = "Terraform"
  }
}

#############################
# Networking Configuration
#############################

variable "vpc_cidr" {
  description = "CIDR block for the VPC in DR region"
  type        = string
  default     = "10.3.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use for the subnets in the DR VPC"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "public_subnets" {
  description = "List of CIDR blocks for the public subnets in DR region"
  type        = list(string)
  default     = ["10.3.1.0/24", "10.3.2.0/24", "10.3.3.0/24"]
}

variable "private_subnets" {
  description = "List of CIDR blocks for the private subnets in DR region"
  type        = list(string)
  default     = ["10.3.4.0/24", "10.3.5.0/24", "10.3.6.0/24"]
}

variable "database_subnets" {
  description = "List of CIDR blocks for the database subnets in DR region"
  type        = list(string)
  default     = ["10.3.7.0/24", "10.3.8.0/24", "10.3.9.0/24"]
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks that are allowed to access the bastion host in DR region"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

#############################
# EKS Cluster Configuration
#############################

variable "eks_cluster_name" {
  description = "Name of the EKS cluster in DR region"
  type        = string
  default     = "freight-optimization-dr"
}

variable "eks_cluster_version" {
  description = "Kubernetes version to use for the EKS cluster in DR region"
  type        = string
  default     = "1.28"
}

variable "eks_node_groups" {
  description = "Map of EKS node group configurations for DR environment"
  type = map(object({
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
      min_size       = 1
      max_size       = 3
      labels         = { role = "system" }
      tags           = { NodeGroupType = "system" }
    }
    application = {
      instance_types = ["c6i.xlarge"]
      desired_size   = 2
      min_size       = 1
      max_size       = 6
      labels         = { role = "application" }
      tags           = { NodeGroupType = "application" }
    }
    data = {
      instance_types = ["r6i.xlarge"]
      desired_size   = 1
      min_size       = 0
      max_size       = 3
      labels         = { role = "data" }
      tags           = { NodeGroupType = "data" }
    }
  }
}

#############################
# Database Configuration
#############################

variable "db_instance_class" {
  description = "Instance class for the RDS read replica in DR region"
  type        = string
  default     = "db.r6i.xlarge"
}

variable "documentdb_instance_class" {
  description = "Instance class for the DocumentDB cluster in DR region"
  type        = string
  default     = "db.r5.large"
}

variable "documentdb_instance_count" {
  description = "Number of instances in the DocumentDB cluster in DR region"
  type        = number
  default     = 2
}

#############################
# Backup Configuration
#############################

variable "s3_backup_bucket_name" {
  description = "Name of the S3 bucket for backups in DR region"
  type        = string
  default     = "freight-optimization-dr-backups"
}

variable "backup_retention_days" {
  description = "Number of days to retain backups in DR region"
  type        = number
  default     = 30
}

variable "backup_cold_storage_days" {
  description = "Number of days before transitioning backups to cold storage"
  type        = number
  default     = 90
}

#############################
# Bastion Host Configuration
#############################

variable "bastion_key_name" {
  description = "Name of the key pair to use for the bastion host in DR region"
  type        = string
  default     = "freight-optimization-dr"
}

variable "bastion_instance_type" {
  description = "Instance type for the bastion host in DR region"
  type        = string
  default     = "t3.small"
}