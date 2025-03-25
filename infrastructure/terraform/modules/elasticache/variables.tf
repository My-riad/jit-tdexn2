variable "application" {
  type        = string
  description = "Name of the application that the ElastiCache cluster is supporting"
  default     = "freight-optimization"
}

variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, staging, prod)"
  default     = "dev"
}

variable "vpc_id" {
  type        = string
  description = "ID of the VPC where ElastiCache will be deployed"
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs where ElastiCache nodes will be deployed"
  default     = []
}

variable "subnet_group_name" {
  type        = string
  description = "Name of an existing ElastiCache subnet group to use. If not provided, a new one will be created"
  default     = ""
}

variable "security_group_ids" {
  type        = list(string)
  description = "List of security group IDs to associate with the ElastiCache cluster"
  default     = []
}

variable "allowed_security_group_ids" {
  type        = list(string)
  description = "List of security group IDs that are allowed to access the ElastiCache cluster"
  default     = []
}

variable "node_type" {
  type        = string
  description = "ElastiCache instance type to use for the nodes"
  default     = "cache.t3.medium"
}

variable "engine_version" {
  type        = string
  description = "Version number of the Redis engine to use"
  default     = "7.0"
}

variable "num_cache_nodes" {
  type        = number
  description = "Number of cache nodes in the ElastiCache cluster"
  default     = 2
}

variable "parameter_group_name" {
  type        = string
  description = "Name of an existing parameter group to use. If not provided, a new one will be created"
  default     = ""
}

variable "parameter_group_parameters" {
  type        = map(string)
  description = "Map of parameter name to parameter value for the ElastiCache parameter group"
  default     = {}
}

variable "automatic_failover_enabled" {
  type        = bool
  description = "Whether to enable automatic failover for the Redis replication group"
  default     = true
}

variable "multi_az_enabled" {
  type        = bool
  description = "Whether to enable Multi-AZ deployment for the Redis replication group"
  default     = true
}

variable "at_rest_encryption_enabled" {
  type        = bool
  description = "Whether to enable encryption at rest for the Redis replication group"
  default     = true
}

variable "transit_encryption_enabled" {
  type        = bool
  description = "Whether to enable encryption in transit for the Redis replication group"
  default     = true
}

variable "auth_token" {
  type        = string
  description = "Password used to access a password protected server. Only applicable when transit_encryption_enabled is true"
  default     = ""
  sensitive   = true
}

variable "snapshot_retention_limit" {
  type        = number
  description = "Number of days for which ElastiCache will retain automatic snapshots"
  default     = 7
}

variable "snapshot_window" {
  type        = string
  description = "Daily time range during which automated backups are created"
  default     = "03:00-05:00"
}

variable "maintenance_window" {
  type        = string
  description = "Weekly time range during which system maintenance can occur"
  default     = "sun:05:00-sun:07:00"
}

variable "apply_immediately" {
  type        = bool
  description = "Whether changes should be applied immediately or during the next maintenance window"
  default     = false
}

variable "auto_minor_version_upgrade" {
  type        = bool
  description = "Whether to automatically upgrade to new minor versions during the maintenance window"
  default     = true
}

variable "notification_topic_arn" {
  type        = string
  description = "ARN of an SNS topic to send ElastiCache notifications to"
  default     = ""
}

variable "create_cloudwatch_alarms" {
  type        = bool
  description = "Whether to create CloudWatch alarms for the ElastiCache cluster"
  default     = true
}

variable "cpu_threshold_percent" {
  type        = number
  description = "CPU utilization threshold for CloudWatch alarm"
  default     = 75
}

variable "memory_threshold_percent" {
  type        = number
  description = "Memory utilization threshold for CloudWatch alarm"
  default     = 75
}

variable "connection_threshold" {
  type        = number
  description = "Connection count threshold for CloudWatch alarm"
  default     = 5000
}

variable "replication_lag_threshold" {
  type        = number
  description = "Replication lag threshold in seconds for CloudWatch alarm"
  default     = 10
}

variable "tags" {
  type        = map(string)
  description = "Map of tags to assign to the ElastiCache resources"
  default     = {}
}