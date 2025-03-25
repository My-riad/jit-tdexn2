# S3 Module Variables
#
# This file defines variables for configuring S3 buckets for the AI-driven Freight Optimization Platform.
# It includes options for bucket naming, versioning, replication, lifecycle policies, and tagging.
#
# The configuration supports document storage, object lifecycle management, cross-region replication
# for disaster recovery, and encryption at rest for secure data storage.

variable "bucket_name" {
  description = "Name of the S3 bucket to be created (e.g., 'freight-optimization-documents')"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod, dr)"
  type        = string
}

variable "region" {
  description = "AWS region for the primary S3 bucket (e.g., 'us-west-2')"
  type        = string
  default     = "us-west-2"
}

variable "versioning_enabled" {
  description = "Flag to enable or disable versioning on the S3 bucket"
  type        = bool
  default     = true
}

variable "enable_replication" {
  description = "Flag to enable cross-region replication for disaster recovery"
  type        = bool
  default     = false
}

variable "replication_region" {
  description = "AWS region for the replication bucket when cross-region replication is enabled (e.g., 'us-east-1')"
  type        = string
  default     = "us-east-1"
}

variable "lifecycle_rules" {
  description = "Configuration for object lifecycle management including transitions to different storage classes and expiration"
  type = list(object({
    id      = string  # Unique identifier for the rule
    enabled = bool    # Set to true to enable the rule
    prefix  = string  # Object key prefix identifying objects to which the rule applies
    transition = list(object({
      days          = number  # Number of days after object creation when the transition should occur
      storage_class = string  # AWS storage class to transition to (e.g., STANDARD_IA, GLACIER)
    }))
    expiration = optional(object({
      days = number  # Number of days after object creation when the object should be deleted
    }))
  }))
  default = []
}

variable "tags" {
  description = "Resource tags to be applied to all created resources (e.g., {Project = 'Freight-Optimization', Environment = 'Production'})"
  type        = map(string)
  default     = {}
}