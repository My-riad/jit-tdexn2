# ---------------------------------------------------------------------------------------------------------------------
# Security Module Variables
# 
# This file defines all input parameters required to create and configure security resources such as:
# - KMS keys for data encryption
# - WAF configurations for API protection
# - Security Groups for network security
# - IAM configurations for access control
# - Other security-related resources
# ---------------------------------------------------------------------------------------------------------------------

# ---------------------------------------------------------------------------------------------------------------------
# General Variables
# ---------------------------------------------------------------------------------------------------------------------

variable "name" {
  type        = string
  description = "Name to be used on all resources as prefix"
}

variable "environment" {
  type        = string
  description = "Environment for the resources (e.g., dev, staging, prod)"
}

variable "vpc_id" {
  type        = string
  description = "ID of the VPC where security groups will be created"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "List of private subnet IDs"
  default     = []
}

variable "account_id" {
  type        = string
  description = "AWS account ID for KMS key policy"
  default     = null
}

# ---------------------------------------------------------------------------------------------------------------------
# KMS Key Variables - For Data Encryption
# ---------------------------------------------------------------------------------------------------------------------

variable "kms_key_deletion_window_in_days" {
  type        = number
  description = "Duration in days after which the KMS key is deleted after destruction"
  default     = 30
}

variable "kms_key_enable_rotation" {
  type        = bool
  description = "Specifies whether key rotation is enabled"
  default     = true
}

# ---------------------------------------------------------------------------------------------------------------------
# WAF and Shield Variables - For API Security
# ---------------------------------------------------------------------------------------------------------------------

variable "waf_rate_limit" {
  type        = number
  description = "Rate limit for WAF rate-based rules (requests per 5 minutes)"
  default     = 10000
}

variable "enable_shield_advanced" {
  type        = bool
  description = "Enable AWS Shield Advanced protection"
  default     = false
}

variable "api_gateway_arn" {
  type        = string
  description = "ARN of the API Gateway to protect with Shield Advanced"
  default     = ""
}

variable "enable_waf" {
  type        = bool
  description = "Enable WAF protection"
  default     = true
}

variable "additional_waf_rules" {
  type = list(object({
    name      = string
    priority  = number
    action    = map(any)
    statement = map(any)
  }))
  description = "List of additional WAF rules to add to the web ACL"
  default     = []
}

# ---------------------------------------------------------------------------------------------------------------------
# AWS Config Variables - For Compliance Monitoring
# ---------------------------------------------------------------------------------------------------------------------

variable "enable_config_rules" {
  type        = bool
  description = "Enable AWS Config rules for security compliance"
  default     = true
}

# ---------------------------------------------------------------------------------------------------------------------
# IAM Variables - For Access Control
# ---------------------------------------------------------------------------------------------------------------------

variable "password_policy" {
  type = object({
    minimum_length         = number
    require_lowercase      = bool
    require_uppercase      = bool
    require_numbers        = bool
    require_symbols        = bool
    password_reuse_prevention = number
    max_password_age       = number
  })
  description = "IAM account password policy settings"
  default = {
    minimum_length         = 14
    require_lowercase      = true
    require_uppercase      = true
    require_numbers        = true
    require_symbols        = true
    password_reuse_prevention = 24
    max_password_age       = 90
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# Security Group Variables - For Network Security
# ---------------------------------------------------------------------------------------------------------------------

variable "security_group_ingress_rules" {
  type = map(object({
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    description = string
  }))
  description = "Map of additional security group ingress rules"
  default     = {}
}

variable "security_group_egress_rules" {
  type = map(object({
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    description = string
  }))
  description = "Map of additional security group egress rules"
  default     = {}
}

# ---------------------------------------------------------------------------------------------------------------------
# Tagging Variables
# ---------------------------------------------------------------------------------------------------------------------

variable "tags" {
  type        = map(string)
  description = "A map of tags to add to all resources"
  default     = {}
}