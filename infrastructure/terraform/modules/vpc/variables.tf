variable "name" {
  description = "Name to be used on all the resources as identifier"
  type        = string
  default     = "freight-optimization"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "A list of availability zones in the region"
  type        = list(string)

  validation {
    condition     = length(var.availability_zones) > 0
    error_message = "At least one availability zone must be specified."
  }
}

variable "public_subnets" {
  description = "A list of public subnet CIDR blocks"
  type        = list(string)
  default     = []
}

variable "private_subnets" {
  description = "A list of private subnet CIDR blocks"
  type        = list(string)
  default     = []
}

variable "database_subnets" {
  description = "A list of database subnet CIDR blocks"
  type        = list(string)
  default     = []
}

variable "enable_nat_gateway" {
  description = "Should be true if you want to provision NAT Gateways for each of your private networks"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Should be true if you want to provision a single shared NAT Gateway across all of your private networks"
  type        = bool
  default     = false
}

variable "enable_vpn_gateway" {
  description = "Should be true if you want to create a VPN Gateway for the VPC"
  type        = bool
  default     = false
}

variable "enable_dns_hostnames" {
  description = "Should be true to enable DNS hostnames in the VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Should be true to enable DNS support in the VPC"
  type        = bool
  default     = true
}

variable "enable_flow_logs" {
  description = "Whether or not to enable VPC Flow Logs"
  type        = bool
  default     = false
}

variable "flow_logs_destination_arn" {
  description = "The ARN of the S3 bucket where VPC Flow Logs will be stored"
  type        = string
  default     = ""

  validation {
    condition     = !var.enable_flow_logs || var.flow_logs_destination_arn != ""
    error_message = "flow_logs_destination_arn must be provided when enable_flow_logs is true."
  }
}

variable "enable_s3_endpoint" {
  description = "Should be true if you want to provision an S3 endpoint to the VPC"
  type        = bool
  default     = false
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
}