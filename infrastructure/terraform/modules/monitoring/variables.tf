# General configuration
variable "name" {
  description = "Name prefix for all monitoring resources"
  type        = string
  default     = "freight-optimization"
}

variable "environment" {
  description = "Environment name (dev, staging, prod) used for tagging and naming resources"
  type        = string
  default     = "dev"
}

# Resource IDs and Integration
variable "vpc_id" {
  description = "ID of the VPC where monitoring resources will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs where monitoring resources will be deployed"
  type        = list(string)
}

variable "eks_cluster_name" {
  description = "Name of the EKS cluster where monitoring components will be deployed"
  type        = string
}

# Component Enable/Disable Flags
variable "enable_prometheus" {
  description = "Whether to enable Prometheus for metrics collection"
  type        = bool
  default     = true
}

variable "enable_grafana" {
  description = "Whether to enable Grafana for metrics visualization"
  type        = bool
  default     = true
}

variable "enable_alertmanager" {
  description = "Whether to enable Alertmanager for alert management"
  type        = bool
  default     = true
}

variable "retention_in_days" {
  description = "Number of days to retain logs in CloudWatch Log Groups"
  type        = number
  default     = 30
}

variable "alarm_notification_email" {
  description = "Email address to receive monitoring alerts"
  type        = string
}

# Prometheus Configuration
variable "prometheus_retention_days" {
  description = "Number of days to retain metrics in Prometheus"
  type        = number
  default     = 15
}

variable "prometheus_storage_size" {
  description = "Size of the persistent volume for Prometheus storage"
  type        = string
  default     = "50Gi"
}

# Grafana Configuration
variable "grafana_admin_password" {
  description = "Admin password for Grafana dashboard access"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.grafana_admin_password) >= 8
    error_message = "Grafana admin password must be at least 8 characters long."
  }
}

variable "grafana_storage_size" {
  description = "Size of the persistent volume for Grafana storage"
  type        = string
  default     = "10Gi"
}

# Alertmanager Configuration
variable "alertmanager_storage_size" {
  description = "Size of the persistent volume for Alertmanager storage"
  type        = string
  default     = "10Gi"
}

# Alerting Thresholds
variable "cpu_utilization_threshold" {
  description = "Threshold percentage for CPU utilization alarms"
  type        = number
  default     = 80
  
  validation {
    condition     = var.cpu_utilization_threshold > 0 && var.cpu_utilization_threshold <= 100
    error_message = "CPU utilization threshold must be between 1 and 100."
  }
}

variable "memory_utilization_threshold" {
  description = "Threshold percentage for memory utilization alarms"
  type        = number
  default     = 80
  
  validation {
    condition     = var.memory_utilization_threshold > 0 && var.memory_utilization_threshold <= 100
    error_message = "Memory utilization threshold must be between 1 and 100."
  }
}

variable "disk_utilization_threshold" {
  description = "Threshold percentage for disk utilization alarms"
  type        = number
  default     = 85
  
  validation {
    condition     = var.disk_utilization_threshold > 0 && var.disk_utilization_threshold <= 100
    error_message = "Disk utilization threshold must be between 1 and 100."
  }
}

# Long-term storage configuration
variable "enable_thanos" {
  description = "Whether to enable Thanos for long-term metrics storage"
  type        = bool
  default     = false
}

variable "thanos_storage_bucket" {
  description = "S3 bucket name for Thanos metrics storage"
  type        = string
  default     = null
}

# Log Forwarding
variable "enable_log_forwarding" {
  description = "Whether to enable log forwarding to Elasticsearch"
  type        = bool
  default     = false
}

variable "elasticsearch_endpoint" {
  description = "Endpoint URL for Elasticsearch log storage"
  type        = string
  default     = null
}

# Security and Access Control
variable "create_dashboard_role" {
  description = "Whether to create an IAM role for dashboard access"
  type        = bool
  default     = true
}

variable "dashboard_role_name" {
  description = "Name of the IAM role for dashboard access"
  type        = string
  default     = "monitoring-dashboard-role"
}

# Tagging
variable "tags" {
  description = "Tags to apply to all monitoring resources"
  type        = map(string)
  default     = {}
}