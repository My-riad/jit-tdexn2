# AWS Region for global resources
variable "aws_region" {
  description = "AWS region where global resources will be created"
  type        = string
  default     = "us-west-2"
}

# Project name for resource naming and tagging
variable "project_name" {
  description = "Name of the project used for tagging and naming resources"
  type        = string
  default     = "freight-optimization"
}

# Terraform state management
variable "terraform_state_bucket_name" {
  description = "Name of the S3 bucket for storing Terraform state files"
  type        = string
  default     = "freight-optimization-terraform-state"
  
  validation {
    condition     = length(var.terraform_state_bucket_name) > 0
    error_message = "The terraform_state_bucket_name variable cannot be empty"
  }
}

variable "terraform_lock_table_name" {
  description = "Name of the DynamoDB table for Terraform state locking"
  type        = string
  default     = "freight-optimization-terraform-locks"
  
  validation {
    condition     = length(var.terraform_lock_table_name) > 0
    error_message = "The terraform_lock_table_name variable cannot be empty"
  }
}

# CloudTrail configuration
variable "cloudtrail_bucket_name" {
  description = "Name of the S3 bucket for CloudTrail logs"
  type        = string
  default     = "freight-optimization-cloudtrail-logs"
  
  validation {
    condition     = length(var.cloudtrail_bucket_name) > 0
    error_message = "The cloudtrail_bucket_name variable cannot be empty"
  }
}

# Container registry (ECR) configuration
variable "ecr_repository_names" {
  description = "List of ECR repository names to create for microservices"
  type        = list(string)
  default     = [
    "api-gateway",
    "auth-service",
    "driver-service",
    "load-service",
    "load-matching-service", 
    "optimization-engine",
    "tracking-service",
    "gamification-service",
    "market-intelligence-service",
    "notification-service",
    "integration-service",
    "event-bus",
    "cache-service",
    "data-service"
  ]
}

variable "ecr_image_tag_mutability" {
  description = "The tag mutability setting for the ECR repositories"
  type        = string
  default     = "IMMUTABLE"
  
  validation {
    condition     = var.ecr_image_tag_mutability == "MUTABLE" || var.ecr_image_tag_mutability == "IMMUTABLE"
    error_message = "The ecr_image_tag_mutability variable must be either MUTABLE or IMMUTABLE"
  }
}

variable "ecr_scan_on_push" {
  description = "Indicates whether images are scanned after being pushed to the ECR repositories"
  type        = bool
  default     = true
}

variable "ecr_lifecycle_count" {
  description = "Number of images to keep in each ECR repository"
  type        = number
  default     = 30
  
  validation {
    condition     = var.ecr_lifecycle_count > 0
    error_message = "The ecr_lifecycle_count variable must be greater than 0"
  }
}

# Domain configuration
variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = "freightoptimization.example.com"
}

# GitHub configuration for CI/CD
variable "github_organization" {
  description = "GitHub organization name for CI/CD integration"
  type        = string
  default     = "freight-optimization"
}

variable "github_repository" {
  description = "GitHub repository name for CI/CD integration"
  type        = string
  default     = "freight-optimization-platform"
}

# KMS configuration
variable "kms_key_deletion_window" {
  description = "Waiting period in days before KMS key deletion"
  type        = number
  default     = 30
  
  validation {
    condition     = var.kms_key_deletion_window >= 7 && var.kms_key_deletion_window <= 30
    error_message = "The kms_key_deletion_window variable must be between 7 and 30 days"
  }
}

variable "enable_key_rotation" {
  description = "Specifies whether key rotation is enabled for KMS keys"
  type        = bool
  default     = true
}

# CloudTrail configuration
variable "cloudtrail_is_multi_region" {
  description = "Specifies whether CloudTrail trail is created for all regions"
  type        = bool
  default     = true
}

variable "cloudtrail_include_global_service_events" {
  description = "Specifies whether CloudTrail includes global service events"
  type        = bool
  default     = true
}

# Resource tagging
variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {
    Project   = "FreightOptimization"
    ManagedBy = "Terraform"
  }
}