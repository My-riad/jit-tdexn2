variable "name" {
  description = "Name prefix for the RDS resources"
  type        = string
  default     = "freight-optimization"
}

variable "environment" {
  description = "Environment name (dev, staging, prod) for resource naming and tagging"
  type        = string
  default     = "dev"
}

variable "vpc_id" {
  description = "ID of the VPC where RDS resources will be created"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs where RDS instances will be deployed"
  type        = list(string)
}

variable "app_security_group_ids" {
  description = "List of security group IDs that need access to the RDS instances"
  type        = list(string)
}

variable "instance_class" {
  description = "The instance type for the primary RDS instance"
  type        = string
  default     = "db.t3.large"
}

variable "allocated_storage" {
  description = "The amount of storage to allocate to the RDS instance in GB"
  type        = number
  default     = 50
}

variable "max_allocated_storage" {
  description = "The maximum storage limit for autoscaling in GB"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "The name of the database to create"
  type        = string
  default     = "freightoptimization"
}

variable "db_username" {
  description = "The master username for the RDS instance"
  type        = string
  default     = "dbadmin"
}

variable "multi_az" {
  description = "Whether to enable Multi-AZ deployment for high availability"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "The number of days to retain automated backups"
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "Whether to enable deletion protection for the RDS instance"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Whether to skip the final snapshot when the instance is deleted"
  type        = bool
  default     = false
}

variable "kms_key_id" {
  description = "The ARN of the KMS key for encrypting the RDS instance"
  type        = string
  default     = null
}

variable "monitoring_role_arn" {
  description = "The ARN of the IAM role for RDS enhanced monitoring"
  type        = string
  default     = null
}

variable "create_read_replica" {
  description = "Whether to create a read replica for the RDS instance"
  type        = bool
  default     = false
}

variable "replica_instance_class" {
  description = "The instance type for the read replica"
  type        = string
  default     = "db.t3.medium"
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