variable "cluster_name" {
  description = "Name of the MSK cluster"
  type        = string
}

variable "kafka_version" {
  description = "Version of Kafka to deploy"
  type        = string
  default     = "3.4.0"
}

variable "number_of_broker_nodes" {
  description = "Number of broker nodes in the cluster"
  type        = number
  default     = 3
}

variable "broker_instance_type" {
  description = "Instance type to use for the Kafka brokers"
  type        = string
  default     = "kafka.m5.large"
}

variable "vpc_id" {
  description = "ID of the VPC where the MSK cluster will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the MSK cluster, should be in different AZs for high availability"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs for the MSK cluster"
  type        = list(string)
  default     = []
}

variable "ebs_volume_size" {
  description = "Size in GiB of the EBS volume for the data drive on each broker node"
  type        = number
  default     = 1000
}

variable "encryption_at_rest_kms_key_arn" {
  description = "ARN of the KMS key used for encryption at rest. If not specified, a new KMS key will be created"
  type        = string
  default     = null
}

variable "encryption_in_transit_client_broker" {
  description = "Encryption setting for data in transit between clients and brokers. Valid values: TLS, TLS_PLAINTEXT, PLAINTEXT"
  type        = string
  default     = "TLS"
  
  validation {
    condition     = contains(["TLS", "TLS_PLAINTEXT", "PLAINTEXT"], var.encryption_in_transit_client_broker)
    error_message = "Valid values for encryption_in_transit_client_broker are: TLS, TLS_PLAINTEXT, PLAINTEXT"
  }
}

variable "encryption_in_transit_in_cluster" {
  description = "Whether data communication among broker nodes is encrypted"
  type        = bool
  default     = true
}

variable "enhanced_monitoring" {
  description = "Specify the desired enhanced MSK CloudWatch monitoring level. Valid values: DEFAULT, PER_BROKER, PER_TOPIC_PER_BROKER, PER_TOPIC_PER_PARTITION"
  type        = string
  default     = "PER_BROKER"
  
  validation {
    condition     = contains(["DEFAULT", "PER_BROKER", "PER_TOPIC_PER_BROKER", "PER_TOPIC_PER_PARTITION"], var.enhanced_monitoring)
    error_message = "Valid values for enhanced_monitoring are: DEFAULT, PER_BROKER, PER_TOPIC_PER_BROKER, PER_TOPIC_PER_PARTITION"
  }
}

variable "auto_create_topics_enable" {
  description = "Enables auto creation of topics on the server"
  type        = bool
  default     = true
}

variable "default_replication_factor" {
  description = "Default replication factor for automatically created topics"
  type        = number
  default     = 3
}

variable "min_insync_replicas" {
  description = "Minimum number of replicas that must acknowledge a write for the write to be considered successful"
  type        = number
  default     = 2
}

variable "num_partitions" {
  description = "Default number of partitions for automatically created topics"
  type        = number
  default     = 3
}

variable "log_retention_hours" {
  description = "The number of hours to keep a log file before deleting it"
  type        = number
  default     = 168 # 7 days
}

variable "log_retention_bytes" {
  description = "The maximum size of the log before deleting it"
  type        = number
  default     = 1073741824 # 1GB
}

variable "enable_cloudwatch_logs" {
  description = "Enable streaming broker logs to CloudWatch Logs"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain logs in CloudWatch"
  type        = number
  default     = 7
}

variable "enable_s3_logs" {
  description = "Enable streaming broker logs to S3"
  type        = bool
  default     = true
}

variable "s3_logs_bucket" {
  description = "Name of the S3 bucket for broker logs. If not specified, a new bucket will be created"
  type        = string
  default     = null
}

variable "s3_logs_prefix" {
  description = "Prefix to use for S3 logs"
  type        = string
  default     = "msk-logs"
}

variable "s3_logs_retention_days" {
  description = "Number of days to retain logs in S3"
  type        = number
  default     = 30
}

variable "jmx_exporter_enabled" {
  description = "Enable the JMX Exporter"
  type        = bool
  default     = true
}

variable "node_exporter_enabled" {
  description = "Enable the Node Exporter"
  type        = bool
  default     = true
}

variable "server_properties" {
  description = "Additional server properties for the MSK cluster in the format of key=value"
  type        = map(string)
  default     = {}
}

variable "client_authentication_unauthenticated_enabled" {
  description = "Enables unauthenticated access"
  type        = bool
  default     = true
}

variable "client_authentication_tls_certificate_authority_arns" {
  description = "List of ACM Certificate Authority Amazon Resource Names (ARNs) for TLS client authentication"
  type        = list(string)
  default     = []
}

variable "client_authentication_sasl_scram_enabled" {
  description = "Enables SCRAM client authentication"
  type        = bool
  default     = false
}

variable "client_authentication_sasl_iam_enabled" {
  description = "Enables IAM client authentication"
  type        = bool
  default     = false
}

variable "open_monitoring_prometheus_jmx_exporter" {
  description = "Indicates whether you want to enable or disable the JMX Exporter"
  type        = bool
  default     = true
}

variable "open_monitoring_prometheus_node_exporter" {
  description = "Indicates whether you want to enable or disable the Node Exporter"
  type        = bool
  default     = true
}

variable "broker_node_group_info_az_distribution" {
  description = "The distribution of broker nodes across availability zones. Valid values: DEFAULT, OPTIMIZED"
  type        = string
  default     = "DEFAULT"
  
  validation {
    condition     = contains(["DEFAULT", "OPTIMIZED"], var.broker_node_group_info_az_distribution)
    error_message = "Valid values for broker_node_group_info_az_distribution are: DEFAULT, OPTIMIZED"
  }
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "A map of tags to assign to the MSK cluster and related resources"
  type        = map(string)
  default     = {}
}