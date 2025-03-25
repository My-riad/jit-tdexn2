variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  validation {
    condition     = length(var.cluster_name) > 0 && length(var.cluster_name) <= 100
    error_message = "The cluster_name must be between 1 and 100 characters in length."
  }
}

variable "kubernetes_version" {
  description = "Kubernetes version to use for the EKS cluster"
  type        = string
  default     = "1.28"
}

variable "vpc_id" {
  description = "ID of the VPC where the EKS cluster will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs where the EKS cluster and nodes will be deployed. Must be in at least two different availability zones."
  type        = list(string)
  validation {
    condition     = length(var.subnet_ids) >= 2
    error_message = "At least two subnet IDs are required for high availability."
  }
}

variable "node_groups" {
  description = "Map of node group configurations for different workload types (system, application, data processing, ML inference)"
  type = map(object({
    instance_types = list(string)
    desired_size   = number
    min_size       = number
    max_size       = number
    labels         = map(string)
    tags           = map(string)
  }))
  default = {}
}

variable "cluster_log_types" {
  description = "List of the desired control plane logging to enable: api, audit, authenticator, controllerManager, scheduler"
  type        = list(string)
  default     = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
}

variable "endpoint_private_access" {
  description = "Whether the Amazon EKS private API server endpoint is enabled"
  type        = bool
  default     = true
}

variable "endpoint_public_access" {
  description = "Whether the Amazon EKS public API server endpoint is enabled"
  type        = bool
  default     = false
}

variable "public_access_cidrs" {
  description = "List of CIDR blocks that can access the Amazon EKS public API server endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
}

variable "cluster_encryption_config" {
  description = "Configuration for EKS cluster encryption"
  type = object({
    provider_key_arn = string
    resources        = list(string)
  })
  default = {
    provider_key_arn = ""
    resources        = ["secrets"]
  }
}

variable "cluster_enabled_log_types" {
  description = "A list of the desired control plane logs to enable"
  type        = list(string)
  default     = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
}

variable "cluster_log_retention_in_days" {
  description = "Number of days to retain log events in CloudWatch"
  type        = number
  default     = 30
}

variable "cluster_security_group_additional_rules" {
  description = "Additional security group rules to add to the cluster security group"
  type        = map(any)
  default     = {}
}

variable "node_security_group_additional_rules" {
  description = "Additional security group rules to add to the node security group"
  type        = map(any)
  default     = {}
}

variable "aws_auth_roles" {
  description = "List of IAM roles to add to the aws-auth configmap"
  type = list(object({
    rolearn  = string
    username = string
    groups   = list(string)
  }))
  default = []
}

variable "aws_auth_users" {
  description = "List of IAM users to add to the aws-auth configmap"
  type = list(object({
    userarn  = string
    username = string
    groups   = list(string)
  }))
  default = []
}

variable "node_group_defaults" {
  description = "Default configurations for node groups"
  type        = any
  default = {
    ami_type       = "AL2_x86_64"
    disk_size      = 50
    instance_types = ["m5.large"]
    capacity_type  = "ON_DEMAND"
  }
}