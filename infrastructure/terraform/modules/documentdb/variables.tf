variable "name" {
  description = "Name prefix for the DocumentDB cluster and related resources"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod) for resource naming and tagging"
  type        = string
  default     = "dev"
}

variable "vpc_id" {
  description = "ID of the VPC where DocumentDB resources will be created"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs where DocumentDB instances will be deployed"
  type        = list(string)
}

variable "app_security_group_ids" {
  description = "List of security group IDs that need access to the DocumentDB cluster"
  type        = list(string)
}

variable "instance_class" {
  description = "The instance type for DocumentDB instances"
  type        = string
  default     = "db.r5.large"
}

variable "instance_count" {
  description = "Number of instances to create in the DocumentDB cluster"
  type        = number
  default     = 2
}

variable "db_username" {
  description = "The master username for the DocumentDB cluster"
  type        = string
  default     = "docdbadmin"
}

variable "backup_retention_period" {
  description = "The number of days to retain automated backups"
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "Whether to enable deletion protection for the DocumentDB cluster"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Whether to skip the final snapshot when the cluster is deleted"
  type        = bool
  default     = false
}

variable "kms_key_id" {
  description = "The ARN of the KMS key for encrypting the DocumentDB cluster"
  type        = string
  default     = null
}

variable "enable_tls" {
  description = "Whether to enable TLS for connections to the DocumentDB cluster"
  type        = bool
  default     = true
}

variable "alarm_actions" {
  description = "List of ARNs to notify when an alarm transitions to the ALARM state"
  type        = list(string)
  default     = []
}

variable "ok_actions" {
  description = "List of ARNs to notify when an alarm transitions to the OK state"
  type        = list(string)
  default     = []
}

variable "max_connections_threshold" {
  description = "Threshold for the maximum number of connections alarm"
  type        = number
  default     = 500
}

variable "tags" {
  description = "Additional tags to apply to all resources created by this module"
  type        = map(string)
  default     = {}
}