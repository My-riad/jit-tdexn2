#!/bin/bash

# Database Backup Script
# This script creates backups of various databases used in the AI-driven Freight Optimization Platform
# It handles PostgreSQL, TimescaleDB, MongoDB/DocumentDB, Redis, and Elasticsearch

# Exit on error and handle pipeline failures
set -e
set -o pipefail

# Global variables and default values
ENVIRONMENT="dev"
REGION="us-west-2"
BACKUP_BUCKET=""
BACKUP_PREFIX="database-backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
TEMP_DIR="/tmp/db-backups-$TIMESTAMP"
LOG_FILE="/var/log/database-backups/backup-$TIMESTAMP.log"
ERROR_COUNT=0
DRY_RUN=false
PARALLEL_BACKUPS=2
NOTIFICATION_TOPIC=""
KMS_KEY_ID=""

# Flags for which database types to back up
BACKUP_POSTGRES=false
BACKUP_MONGODB=false
BACKUP_REDIS=false
BACKUP_ELASTICSEARCH=false

# PostgreSQL/TimescaleDB databases to back up
PG_DATABASES=(
  "freight-postgres-${ENVIRONMENT}:freight_db"
  "freight-timescale-${ENVIRONMENT}:timeseries_db"
)

# MongoDB/DocumentDB databases to back up
MONGO_DATABASES=(
  "freight-docdb-${ENVIRONMENT}:driver_profiles"
  "freight-docdb-${ENVIRONMENT}:preferences"
  "freight-docdb-${ENVIRONMENT}:achievements"
)

# Redis instances to back up
REDIS_INSTANCES=(
  "freight-redis-${ENVIRONMENT}"
)

# Elasticsearch indices to back up
ES_INDICES=(
  "freight-es-${ENVIRONMENT}:loads"
  "freight-es-${ENVIRONMENT}:market_data"
)

# Helper functions for logging
function log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

function log_error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
}

function log_success() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" | tee -a "$LOG_FILE"
}

function usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -e, --environment ENV       Deployment environment (dev, staging, prod)"
  echo "  -r, --region REGION         AWS region"
  echo "  -b, --bucket BUCKET         S3 bucket for backups"
  echo "  -p, --prefix PREFIX         Prefix path in S3 bucket"
  echo "  --retention DAYS            Number of days to retain backups (default: 30)"
  echo "  --postgres                  Backup PostgreSQL/TimescaleDB databases"
  echo "  --mongodb                   Backup MongoDB/DocumentDB databases"
  echo "  --redis                     Backup Redis instances"
  echo "  --elasticsearch             Backup Elasticsearch indices"
  echo "  --all                       Backup all database types"
  echo "  --parallel N                Number of parallel backup operations (default: 2)"
  echo "  --dry-run                   Perform a dry run without making changes"
  echo "  --notify TOPIC_ARN          SNS topic ARN for notifications"
  echo "  -h, --help                  Show this help message"
  exit 1
}

# Cleanup function that runs on script exit
function cleanup() {
  if [ -d "$TEMP_DIR" ]; then
    log "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
  fi

  if [ $ERROR_COUNT -gt 0 ]; then
    log_error "Backup completed with $ERROR_COUNT errors. Check the log file for details: $LOG_FILE"
    send_notification "ERROR" "Backup completed with $ERROR_COUNT errors"
    exit 1
  else
    log_success "Backup completed successfully"
    send_notification "SUCCESS" "All database backups completed successfully"
  fi
}

# Set up trap handlers
trap cleanup EXIT
trap 'log_error "Script interrupted."; exit 1' INT TERM

# Import from init-eks.sh
function configure_kubectl() {
  local cluster_name="$1"
  local region="$2"
  
  log "Configuring kubectl to use EKS cluster ${cluster_name}..."
  
  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would configure kubectl with: aws eks update-kubeconfig --name ${cluster_name} --region ${region} --kubeconfig ${KUBECONFIG_PATH}"
  else
    aws eks update-kubeconfig --name "${cluster_name}" --region "${region}"
    
    # Verify kubectl configuration
    if ! kubectl cluster-info &>/dev/null; then
      log_error "Failed to configure kubectl for cluster ${cluster_name}"
      return 1
    fi
    
    # Verify connectivity to the cluster
    kubectl get nodes &>/dev/null
  fi
  
  log "kubectl has been configured to use EKS cluster ${cluster_name}."
  return 0
}

function parse_arguments() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -e|--environment)
        ENVIRONMENT="$2"
        shift 2
        ;;
      -r|--region)
        REGION="$2"
        shift 2
        ;;
      -b|--bucket)
        BACKUP_BUCKET="$2"
        shift 2
        ;;
      -p|--prefix)
        BACKUP_PREFIX="$2"
        shift 2
        ;;
      --retention)
        RETENTION_DAYS="$2"
        shift 2
        ;;
      --postgres)
        BACKUP_POSTGRES=true
        shift
        ;;
      --mongodb)
        BACKUP_MONGODB=true
        shift
        ;;
      --redis)
        BACKUP_REDIS=true
        shift
        ;;
      --elasticsearch)
        BACKUP_ELASTICSEARCH=true
        shift
        ;;
      --all)
        BACKUP_POSTGRES=true
        BACKUP_MONGODB=true
        BACKUP_REDIS=true
        BACKUP_ELASTICSEARCH=true
        shift
        ;;
      --parallel)
        PARALLEL_BACKUPS="$2"
        shift 2
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --notify)
        NOTIFICATION_TOPIC="$2"
        shift 2
        ;;
      --kms-key)
        KMS_KEY_ID="$2"
        shift 2
        ;;
      -h|--help)
        usage
        ;;
      *)
        log_error "Unknown argument: $1"
        usage
        ;;
    esac
  done
  
  # Validate required arguments
  if [ -z "$BACKUP_BUCKET" ]; then
    log_error "Backup bucket is required. Please provide it with -b or --bucket."
    usage
  fi
  
  # If no backup type is specified, back up all types
  if [ "$BACKUP_POSTGRES" = false ] && [ "$BACKUP_MONGODB" = false ] && [ "$BACKUP_REDIS" = false ] && [ "$BACKUP_ELASTICSEARCH" = false ]; then
    BACKUP_POSTGRES=true
    BACKUP_MONGODB=true
    BACKUP_REDIS=true
    BACKUP_ELASTICSEARCH=true
    log "No backup type specified, backing up all database types."
  fi
  
  # Update database lists with environment
  PG_DATABASES=(
    "freight-postgres-${ENVIRONMENT}:freight_db"
    "freight-timescale-${ENVIRONMENT}:timeseries_db"
  )
  
  MONGO_DATABASES=(
    "freight-docdb-${ENVIRONMENT}:driver_profiles"
    "freight-docdb-${ENVIRONMENT}:preferences"
    "freight-docdb-${ENVIRONMENT}:achievements"
  )
  
  REDIS_INSTANCES=(
    "freight-redis-${ENVIRONMENT}"
  )
  
  ES_INDICES=(
    "freight-es-${ENVIRONMENT}:loads"
    "freight-es-${ENVIRONMENT}:market_data"
  )
}

function check_prerequisites() {
  log "Checking if required tools and permissions are available"
  
  # Check AWS CLI
  if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed. Please install it and try again."
    return 1
  fi
  
  # Check AWS CLI version
  AWS_CLI_VERSION=$(aws --version | awk '{print $1}' | cut -d'/' -f2)
  if [[ $(echo "${AWS_CLI_VERSION}" | cut -d'.' -f1) -lt 2 ]]; then
    log_error "AWS CLI version 2.0 or higher is required. Current version: ${AWS_CLI_VERSION}"
    return 1
  fi
  
  # Check PostgreSQL client tools if needed
  if [ "$BACKUP_POSTGRES" = true ]; then
    if ! command -v pg_dump &> /dev/null; then
      log_error "pg_dump is not installed. Please install postgresql-client package and try again."
      return 1
    fi
  fi
  
  # Check MongoDB client tools if needed
  if [ "$BACKUP_MONGODB" = true ]; then
    if ! command -v mongodump &> /dev/null; then
      log_error "mongodump is not installed. Please install mongodb-tools package and try again."
      return 1
    fi
  fi
  
  # Check jq
  if ! command -v jq &> /dev/null; then
    log_error "jq is not installed. Please install it and try again."
    return 1
  fi
  
  # Verify AWS CLI is configured
  if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS CLI is not properly configured. Please configure it with appropriate credentials."
    return 1
  fi
  
  # Check if S3 bucket exists
  if ! aws s3 ls "s3://$BACKUP_BUCKET" &> /dev/null; then
    log_error "S3 bucket $BACKUP_BUCKET does not exist or is not accessible."
    return 1
  fi
  
  log "All prerequisites are met."
  return 0
}

function setup_backup_environment() {
  log "Preparing the environment for backup operations"
  
  # Create temp directory
  mkdir -p "$TEMP_DIR"
  
  # Ensure log directory exists
  mkdir -p "$(dirname "$LOG_FILE")"
  
  # Configure AWS CLI session
  export AWS_REGION="$REGION"
  
  # Verify AWS credentials have necessary permissions
  if ! aws s3 cp /dev/null "s3://$BACKUP_BUCKET/$BACKUP_PREFIX/.permissions_check" &> /dev/null; then
    log_error "AWS credentials don't have write access to s3://$BACKUP_BUCKET/$BACKUP_PREFIX/"
    return 1
  fi
  aws s3 rm "s3://$BACKUP_BUCKET/$BACKUP_PREFIX/.permissions_check" &> /dev/null
  
  # Check if AWS CLI can access required services
  if [ "$BACKUP_POSTGRES" = true ]; then
    if ! aws rds describe-db-instances --max-items 1 &> /dev/null; then
      log_error "AWS credentials don't have access to RDS service"
      return 1
    fi
  fi
  
  if [ "$BACKUP_MONGODB" = true ]; then
    if ! aws docdb describe-db-clusters --max-items 1 &> /dev/null; then
      log_error "AWS credentials don't have access to DocumentDB service"
      return 1
    fi
  fi
  
  if [ "$BACKUP_REDIS" = true ]; then
    if ! aws elasticache describe-cache-clusters --max-items 1 &> /dev/null; then
      log_error "AWS credentials don't have access to ElastiCache service"
      return 1
    fi
  fi
  
  if [ "$BACKUP_ELASTICSEARCH" = true ]; then
    if ! aws es list-domain-names &> /dev/null; then
      log_error "AWS credentials don't have access to Elasticsearch service"
      return 1
    fi
  fi
  
  log "Backup environment set up successfully."
  return 0
}

function backup_postgresql() {
  local database_identifier="$1"
  local database_name="$2"
  local output_path="$3"
  
  log "Starting backup of PostgreSQL database: $database_name from $database_identifier"
  
  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would back up PostgreSQL database $database_name from $database_identifier to $output_path"
    return 0
  fi
  
  # Get database connection details from AWS RDS
  local endpoint
  local port
  local username
  
  if [[ $database_identifier == *"timescale"* ]]; then
    # This is a TimescaleDB instance
    endpoint=$(aws rds describe-db-instances --db-instance-identifier "$database_identifier" --query "DBInstances[0].Endpoint.Address" --output text)
    port=$(aws rds describe-db-instances --db-instance-identifier "$database_identifier" --query "DBInstances[0].Endpoint.Port" --output text)
    username=$(aws rds describe-db-instances --db-instance-identifier "$database_identifier" --query "DBInstances[0].MasterUsername" --output text)
  else
    # This is a regular PostgreSQL instance
    endpoint=$(aws rds describe-db-instances --db-instance-identifier "$database_identifier" --query "DBInstances[0].Endpoint.Address" --output text)
    port=$(aws rds describe-db-instances --db-instance-identifier "$database_identifier" --query "DBInstances[0].Endpoint.Port" --output text)
    username=$(aws rds describe-db-instances --db-instance-identifier "$database_identifier" --query "DBInstances[0].MasterUsername" --output text)
  fi
  
  if [ -z "$endpoint" ] || [ -z "$port" ] || [ -z "$username" ]; then
    log_error "Failed to get connection details for database $database_identifier"
    return 1
  fi
  
  # Get password from Secrets Manager
  local password_secret_name="${database_identifier}-credentials"
  local password
  
  password=$(aws secretsmanager get-secret-value --secret-id "$password_secret_name" --query "SecretString" --output text | jq -r '.password')
  
  if [ -z "$password" ]; then
    log_error "Failed to get password for database $database_identifier"
    return 1
  fi
  
  # Set up environment variables for pg_dump
  export PGPASSWORD="$password"
  
  # Create backup
  log "Creating PostgreSQL backup for $database_name..."
  local start_time=$(date +%s)
  
  if ! pg_dump -h "$endpoint" -p "$port" -U "$username" -d "$database_name" -F c -Z 9 -f "${output_path%.gz}" ; then
    log_error "pg_dump failed for database $database_name"
    unset PGPASSWORD
    return 1
  fi
  
  # Verify backup file exists and has content
  if [ ! -s "${output_path%.gz}" ]; then
    log_error "Backup file is empty or does not exist for database $database_name"
    unset PGPASSWORD
    return 1
  fi
  
  # Compress the dump if not already compressed
  if [[ "${output_path}" == *.gz ]]; then
    gzip -f "${output_path%.gz}"
  fi
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  local backup_size=$(du -h "${output_path}" | cut -f1)
  
  log_success "PostgreSQL backup of $database_name completed in ${duration}s, size: ${backup_size}"
  unset PGPASSWORD
  
  # Log backup metrics
  log_backup_metrics "postgresql" "$database_name" "$backup_size" "$duration" "success"
  
  return 0
}

function backup_mongodb() {
  local cluster_identifier="$1"
  local database_name="$2"
  local output_path="$3"
  
  log "Starting backup of MongoDB database: $database_name from $cluster_identifier"
  
  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would back up MongoDB database $database_name from $cluster_identifier to $output_path"
    return 0
  fi
  
  # Get cluster connection details from AWS DocumentDB
  local endpoint
  local port
  local username
  
  endpoint=$(aws docdb describe-db-clusters --db-cluster-identifier "$cluster_identifier" --query "DBClusters[0].Endpoint" --output text)
  port=$(aws docdb describe-db-clusters --db-cluster-identifier "$cluster_identifier" --query "DBClusters[0].Port" --output text)
  username=$(aws docdb describe-db-clusters --db-cluster-identifier "$cluster_identifier" --query "DBClusters[0].MasterUsername" --output text)
  
  if [ -z "$endpoint" ] || [ -z "$port" ] || [ -z "$username" ]; then
    log_error "Failed to get connection details for cluster $cluster_identifier"
    return 1
  fi
  
  # Get password from Secrets Manager
  local password_secret_name="${cluster_identifier}-credentials"
  local password
  
  password=$(aws secretsmanager get-secret-value --secret-id "$password_secret_name" --query "SecretString" --output text | jq -r '.password')
  
  if [ -z "$password" ]; then
    log_error "Failed to get password for cluster $cluster_identifier"
    return 1
  fi
  
  # Create backup
  log "Creating MongoDB backup for $database_name..."
  local start_time=$(date +%s)
  
  # Create temp directory for mongodump output
  local dump_dir="${output_path}"
  mkdir -p "$dump_dir"
  
  # Run mongodump
  if ! mongodump --host "$endpoint" --port "$port" --username "$username" --password "$password" --db "$database_name" --out "$dump_dir" --ssl --tlsAllowInvalidCertificates ; then
    log_error "mongodump failed for database $database_name"
    return 1
  fi
  
  # Verify backup directory exists and has content
  if [ ! -d "$dump_dir/$database_name" ] || [ -z "$(ls -A "$dump_dir/$database_name")" ]; then
    log_error "Backup directory is empty or does not exist for database $database_name"
    return 1
  fi
  
  # Create tarball of the dump directory
  tar -czf "${output_path}.tar.gz" -C "$dump_dir" "$database_name"
  
  # Clean up dump directory
  rm -rf "$dump_dir"
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  local backup_size=$(du -h "${output_path}.tar.gz" | cut -f1)
  
  log_success "MongoDB backup of $database_name completed in ${duration}s, size: ${backup_size}"
  
  # Log backup metrics
  log_backup_metrics "mongodb" "$database_name" "$backup_size" "$duration" "success"
  
  return 0
}

function backup_redis() {
  local redis_identifier="$1"
  local output_path="$2"
  
  log "Starting backup of Redis instance: $redis_identifier"
  
  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would back up Redis instance $redis_identifier to $output_path"
    return 0
  fi
  
  # For Redis, we use AWS ElastiCache's backup feature
  local start_time=$(date +%s)
  
  # Create a snapshot
  local snapshot_name="${redis_identifier}-backup-${TIMESTAMP}"
  
  log "Creating Redis snapshot $snapshot_name..."
  
  if ! aws elasticache create-snapshot --cache-cluster-id "$redis_identifier" --snapshot-name "$snapshot_name" > /dev/null; then
    log_error "Failed to create snapshot for Redis instance $redis_identifier"
    return 1
  fi
  
  # Wait for snapshot to complete
  log "Waiting for Redis snapshot to complete..."
  
  if ! aws elasticache wait snapshot-complete --snapshot-name "$snapshot_name"; then
    log_error "Timed out waiting for Redis snapshot to complete"
    return 1
  fi
  
  # Get snapshot details
  aws elasticache describe-snapshots --snapshot-name "$snapshot_name" > "$output_path"
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  local backup_size=$(du -h "$output_path" | cut -f1)
  
  log_success "Redis backup of $redis_identifier completed in ${duration}s, snapshot: $snapshot_name"
  
  # Log backup metrics
  log_backup_metrics "redis" "$redis_identifier" "$backup_size" "$duration" "success"
  
  return 0
}

function backup_elasticsearch() {
  local domain_name="$1"
  local index_name="$2"
  local output_path="$3"
  
  log "Starting backup of Elasticsearch index: $index_name from $domain_name"
  
  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would back up Elasticsearch index $index_name from $domain_name to $output_path"
    return 0
  fi
  
  # Get domain endpoint from AWS Elasticsearch Service
  local endpoint
  
  endpoint=$(aws es describe-elasticsearch-domain --domain-name "$domain_name" --query "DomainStatus.Endpoint" --output text)
  
  if [ -z "$endpoint" ]; then
    log_error "Failed to get endpoint for Elasticsearch domain $domain_name"
    return 1
  fi
  
  # For Elasticsearch, we need to register a snapshot repository if it doesn't exist
  local repo_name="automated-backups"
  local snapshot_name="${domain_name}-${index_name}-${TIMESTAMP}"
  local start_time=$(date +%s)
  
  # Check if repository exists, create if it doesn't
  local repo_check
  repo_check=$(curl -s -X GET "https://${endpoint}/_snapshot/${repo_name}" -H 'Content-Type: application/json')
  
  if [[ "$repo_check" == *"repository_missing_exception"* ]]; then
    log "Creating Elasticsearch snapshot repository..."
    
    # Create the repository (this requires IAM role configuration)
    local repo_body='{
      "type": "s3",
      "settings": {
        "bucket": "'$BACKUP_BUCKET'",
        "base_path": "'$BACKUP_PREFIX'/elasticsearch"
      }
    }'
    
    if ! curl -s -X PUT "https://${endpoint}/_snapshot/${repo_name}" -H 'Content-Type: application/json' -d "$repo_body" > /dev/null; then
      log_error "Failed to create snapshot repository for Elasticsearch domain $domain_name"
      return 1
    fi
  fi
  
  # Create snapshot of the specified index
  log "Creating Elasticsearch snapshot for index $index_name..."
  
  local snapshot_body='{
    "indices": "'$index_name'",
    "ignore_unavailable": true,
    "include_global_state": false
  }'
  
  if ! curl -s -X PUT "https://${endpoint}/_snapshot/${repo_name}/${snapshot_name}" -H 'Content-Type: application/json' -d "$snapshot_body" > /dev/null; then
    log_error "Failed to create snapshot for Elasticsearch index $index_name"
    return 1
  fi
  
  # Wait for snapshot to complete
  log "Waiting for Elasticsearch snapshot to complete..."
  local snapshot_status
  local snapshot_complete=false
  local retry_count=0
  
  while [ "$snapshot_complete" = false ] && [ $retry_count -lt 60 ]; do
    snapshot_status=$(curl -s -X GET "https://${endpoint}/_snapshot/${repo_name}/${snapshot_name}/_status" -H 'Content-Type: application/json')
    
    if [[ "$snapshot_status" == *'"state":"SUCCESS"'* ]]; then
      snapshot_complete=true
    else
      sleep 10
      retry_count=$((retry_count + 1))
    fi
  done
  
  if [ "$snapshot_complete" = false ]; then
    log_error "Timed out waiting for Elasticsearch snapshot to complete"
    return 1
  fi
  
  # Save snapshot details to output file
  curl -s -X GET "https://${endpoint}/_snapshot/${repo_name}/${snapshot_name}" -H 'Content-Type: application/json' > "$output_path"
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  local backup_size="N/A" # Size is not directly available for ES snapshots
  
  log_success "Elasticsearch backup of $index_name completed in ${duration}s, snapshot: $snapshot_name"
  
  # Log backup metrics
  log_backup_metrics "elasticsearch" "$index_name" "$backup_size" "$duration" "success"
  
  return 0
}

function backup_k8s_database() {
  local database_type="$1"
  local namespace="$2"
  local pod_selector="$3"
  local database_name="$4"
  local output_path="$5"
  
  log "Starting backup of Kubernetes $database_type database: $database_name in namespace $namespace"
  
  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would back up Kubernetes $database_type database $database_name to $output_path"
    return 0
  fi
  
  # Find matching pod
  local pod_name
  pod_name=$(kubectl get pods -n "$namespace" -l "$pod_selector" -o jsonpath='{.items[0].metadata.name}')
  
  if [ -z "$pod_name" ]; then
    log_error "No pod found matching selector '$pod_selector' in namespace '$namespace'"
    return 1
  fi
  
  local start_time=$(date +%s)
  
  # Backup based on database type
  case "$database_type" in
    postgresql)
      # Backup PostgreSQL database running in Kubernetes
      if ! kubectl exec -n "$namespace" "$pod_name" -- pg_dump -U postgres -d "$database_name" -F c | gzip > "$output_path"; then
        log_error "Failed to back up PostgreSQL database '$database_name' from pod '$pod_name'"
        return 1
      fi
      ;;
      
    mongodb)
      # Create a temporary directory for MongoDB dump
      local dump_dir="${output_path%.tar.gz}"
      mkdir -p "$dump_dir"
      
      # Backup MongoDB database running in Kubernetes
      if ! kubectl exec -n "$namespace" "$pod_name" -- mongodump --db "$database_name" --archive | tar -xzf - -C "$dump_dir"; then
        log_error "Failed to back up MongoDB database '$database_name' from pod '$pod_name'"
        rm -rf "$dump_dir"
        return 1
      fi
      
      # Create tarball of the dump directory
      tar -czf "$output_path" -C "$dump_dir" .
      rm -rf "$dump_dir"
      ;;
      
    redis)
      # Backup Redis instance running in Kubernetes
      if ! kubectl exec -n "$namespace" "$pod_name" -- redis-cli SAVE && \
         kubectl exec -n "$namespace" "$pod_name" -- cat /data/dump.rdb > "${output_path%.gz}"; then
        log_error "Failed to back up Redis instance from pod '$pod_name'"
        return 1
      fi
      
      # Compress the dump
      gzip -f "${output_path%.gz}"
      ;;
      
    elasticsearch)
      # For Elasticsearch, we use the snapshot API via port-forwarding
      local temp_port=9200
      kubectl port-forward -n "$namespace" "$pod_name" "${temp_port}:9200" &
      local port_forward_pid=$!
      
      # Wait for port-forwarding to be established
      sleep 5
      
      # Create repository if it doesn't exist
      local repo_name="k8s-automated-backups"
      local snapshot_name="${namespace}-${database_name}-${TIMESTAMP}"
      
      # Check if repository exists
      local repo_check
      repo_check=$(curl -s -X GET "http://localhost:${temp_port}/_snapshot/${repo_name}")
      
      if [[ "$repo_check" == *"repository_missing_exception"* ]]; then
        # For K8s Elasticsearch, we use a shared filesystem repository type
        local repo_body='{
          "type": "fs",
          "settings": {
            "location": "/usr/share/elasticsearch/data/backup"
          }
        }'
        
        curl -s -X PUT "http://localhost:${temp_port}/_snapshot/${repo_name}" -H 'Content-Type: application/json' -d "$repo_body" > /dev/null
      fi
      
      # Create snapshot
      local snapshot_body='{
        "indices": "'$database_name'",
        "ignore_unavailable": true,
        "include_global_state": false
      }'
      
      curl -s -X PUT "http://localhost:${temp_port}/_snapshot/${repo_name}/${snapshot_name}" -H 'Content-Type: application/json' -d "$snapshot_body" > /dev/null
      
      # Wait for snapshot to complete
      local snapshot_complete=false
      local retry_count=0
      
      while [ "$snapshot_complete" = false ] && [ $retry_count -lt 60 ]; do
        local snapshot_status
        snapshot_status=$(curl -s -X GET "http://localhost:${temp_port}/_snapshot/${repo_name}/${snapshot_name}/_status")
        
        if [[ "$snapshot_status" == *'"state":"SUCCESS"'* ]]; then
          snapshot_complete=true
        else
          sleep 5
          retry_count=$((retry_count + 1))
        fi
      done
      
      # Save snapshot metadata
      curl -s -X GET "http://localhost:${temp_port}/_snapshot/${repo_name}/${snapshot_name}" > "$output_path"
      
      # Kill port-forwarding
      kill $port_forward_pid
      ;;
      
    *)
      log_error "Unsupported database type for Kubernetes backup: $database_type"
      return 1
      ;;
  esac
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  local backup_size=$(du -h "$output_path" | cut -f1)
  
  log_success "Kubernetes $database_type backup of $database_name completed in ${duration}s, size: ${backup_size}"
  
  # Log backup metrics
  log_backup_metrics "k8s-$database_type" "$database_name" "$backup_size" "$duration" "success"
  
  return 0
}

function upload_to_s3() {
  local source_path="$1"
  local database_type="$2"
  local database_name="$3"
  
  log "Uploading backup to S3: $source_path"
  
  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would upload $source_path to S3://$BACKUP_BUCKET/$BACKUP_PREFIX/$database_type/$database_name/"
    return 0
  fi
  
  # Construct S3 destination path
  local s3_path="s3://$BACKUP_BUCKET/$BACKUP_PREFIX/$database_type/$database_name/$(basename "$source_path")"
  local s3_args=""
  
  # Add encryption if KMS key is provided
  if [ -n "$KMS_KEY_ID" ]; then
    s3_args="--sse aws:kms --sse-kms-key-id $KMS_KEY_ID"
  else
    s3_args="--sse AES256"
  fi
  
  # Upload to S3
  if ! aws s3 cp "$source_path" "$s3_path" $s3_args; then
    log_error "Failed to upload backup to S3: $s3_path"
    return 1
  fi
  
  log_success "Backup uploaded to S3: $s3_path"
  return 0
}

function cleanup_old_backups() {
  local database_type="$1"
  local retention_days="$2"
  
  log "Cleaning up old backups for database type: $database_type (retention: $retention_days days)"
  
  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would delete backups older than $retention_days days for database type $database_type"
    return 0
  fi
  
  # Calculate cutoff date (current date minus retention days)
  local cutoff_date
  cutoff_date=$(date -d "-$retention_days days" +"%Y-%m-%d")
  
  # List all backups for the database type
  local backup_list
  backup_list=$(aws s3 ls "s3://$BACKUP_BUCKET/$BACKUP_PREFIX/$database_type/" --recursive)
  
  # Process each backup
  while IFS= read -r line; do
    # Skip empty lines
    if [ -z "$line" ]; then
      continue
    fi
    
    # Extract date and path from ls output
    local backup_date
    local backup_path
    
    backup_date=$(echo "$line" | awk '{print $1}')
    backup_path=$(echo "$line" | awk '{print $4}')
    
    # Skip if not a file
    if [ -z "$backup_path" ]; then
      continue
    fi
    
    # Compare dates
    if [[ "$backup_date" < "$cutoff_date" ]]; then
      log "Deleting old backup: s3://$BACKUP_BUCKET/$backup_path (date: $backup_date)"
      
      if ! aws s3 rm "s3://$BACKUP_BUCKET/$backup_path"; then
        log_error "Failed to delete old backup: s3://$BACKUP_BUCKET/$backup_path"
      fi
    fi
  done <<< "$backup_list"
  
  log "Cleanup of old backups completed for database type: $database_type"
  return 0
}

function cleanup_temp_files() {
  log "Removing temporary files created during backup process"
  
  if [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
  fi
  
  log "Temporary files cleaned up."
}

function send_notification() {
  local status="$1"
  local message="$2"
  
  if [ -z "$NOTIFICATION_TOPIC" ]; then
    log "Notification topic not configured, skipping notification."
    return 0
  fi
  
  log "Sending notification: $status - $message"
  
  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would send notification to SNS topic $NOTIFICATION_TOPIC"
    return 0
  fi
  
  local subject="Database Backup $status - $ENVIRONMENT"
  local body="{\"environment\":\"$ENVIRONMENT\",\"status\":\"$status\",\"message\":\"$message\",\"timestamp\":\"$(date -u +'%Y-%m-%dT%H:%M:%SZ')\"}"
  
  if ! aws sns publish --topic-arn "$NOTIFICATION_TOPIC" --subject "$subject" --message "$body"; then
    log_error "Failed to send notification to SNS topic $NOTIFICATION_TOPIC"
    return 1
  fi
  
  log "Notification sent successfully."
  return 0
}

function log_backup_metrics() {
  local database_type="$1"
  local database_name="$2"
  local backup_size="$3"
  local duration="$4"
  local status="$5"
  
  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would log backup metrics to CloudWatch"
    return 0
  fi
  
  # Convert backup size to bytes if it's not "N/A"
  local size_bytes=0
  if [ "$backup_size" != "N/A" ]; then
    # Strip the unit (K, M, G) and convert to bytes
    local size_value
    local size_unit
    
    size_value=$(echo "$backup_size" | sed 's/[A-Za-z]//g')
    size_unit=$(echo "$backup_size" | sed 's/[0-9.]//g')
    
    case "$size_unit" in
      K)
        size_bytes=$(echo "$size_value * 1024" | bc)
        ;;
      M)
        size_bytes=$(echo "$size_value * 1024 * 1024" | bc)
        ;;
      G)
        size_bytes=$(echo "$size_value * 1024 * 1024 * 1024" | bc)
        ;;
      *)
        size_bytes=$size_value
        ;;
    esac
  fi
  
  # Create metric data
  local metric_data="[
    {
      \"MetricName\": \"BackupDuration\",
      \"Dimensions\": [
        {\"Name\": \"Environment\", \"Value\": \"$ENVIRONMENT\"},
        {\"Name\": \"DatabaseType\", \"Value\": \"$database_type\"},
        {\"Name\": \"DatabaseName\", \"Value\": \"$database_name\"}
      ],
      \"Value\": $duration,
      \"Unit\": \"Seconds\"
    },
    {
      \"MetricName\": \"BackupSize\",
      \"Dimensions\": [
        {\"Name\": \"Environment\", \"Value\": \"$ENVIRONMENT\"},
        {\"Name\": \"DatabaseType\", \"Value\": \"$database_type\"},
        {\"Name\": \"DatabaseName\", \"Value\": \"$database_name\"}
      ],
      \"Value\": $size_bytes,
      \"Unit\": \"Bytes\"
    },
    {
      \"MetricName\": \"BackupStatus\",
      \"Dimensions\": [
        {\"Name\": \"Environment\", \"Value\": \"$ENVIRONMENT\"},
        {\"Name\": \"DatabaseType\", \"Value\": \"$database_type\"},
        {\"Name\": \"DatabaseName\", \"Value\": \"$database_name\"}
      ],
      \"Value\": $([ "$status" = "success" ] && echo "1" || echo "0"),
      \"Unit\": \"Count\"
    }
  ]"
  
  # Publish metrics to CloudWatch
  if ! aws cloudwatch put-metric-data --namespace "FreightOptimization/DatabaseBackups" --metric-data "$metric_data"; then
    log_error "Failed to publish backup metrics to CloudWatch"
    return 1
  fi
  
  log "Backup metrics published to CloudWatch."
  return 0
}

function handle_error() {
  local error_message="$1"
  local database_type="$2"
  local database_name="$3"
  
  log_error "$error_message"
  ERROR_COUNT=$((ERROR_COUNT + 1))
  
  # Send error notification if configured
  if [ -n "$NOTIFICATION_TOPIC" ]; then
    send_notification "ERROR" "Error backing up $database_type database $database_name: $error_message"
  fi
}

function main() {
  parse_arguments "$@"
  check_prerequisites
  setup_backup_environment
  
  # Create backup directory structure
  mkdir -p "$TEMP_DIR"
  
  # Ensure log directory exists
  mkdir -p "$(dirname "$LOG_FILE")"
  
  log "Starting database backup for environment: $ENVIRONMENT"
  log "Backup will be stored in S3 bucket: $BACKUP_BUCKET/$BACKUP_PREFIX"
  log "Retention period: $RETENTION_DAYS days"
  
  # Back up PostgreSQL/TimescaleDB databases
  if [ "$BACKUP_POSTGRES" = true ]; then
    log "Starting PostgreSQL/TimescaleDB backups..."
    for db_config in "${PG_DATABASES[@]}"; do
      IFS=':' read -r db_identifier db_name <<< "$db_config"
      log "Backing up PostgreSQL database: $db_name from $db_identifier"
      if ! backup_postgresql "$db_identifier" "$db_name" "$TEMP_DIR/$db_identifier-$db_name-$TIMESTAMP.sql.gz"; then
        handle_error "Failed to back up PostgreSQL database: $db_name" "postgresql" "$db_name"
      else
        upload_to_s3 "$TEMP_DIR/$db_identifier-$db_name-$TIMESTAMP.sql.gz" "postgresql" "$db_name"
      fi
    done
    cleanup_old_backups "postgresql" "$RETENTION_DAYS"
  fi
  
  # Back up MongoDB/DocumentDB databases
  if [ "$BACKUP_MONGODB" = true ]; then
    log "Starting MongoDB/DocumentDB backups..."
    for db_config in "${MONGO_DATABASES[@]}"; do
      IFS=':' read -r cluster_identifier db_name <<< "$db_config"
      log "Backing up MongoDB database: $db_name from $cluster_identifier"
      if ! backup_mongodb "$cluster_identifier" "$db_name" "$TEMP_DIR/$cluster_identifier-$db_name-$TIMESTAMP"; then
        handle_error "Failed to back up MongoDB database: $db_name" "mongodb" "$db_name"
      else
        upload_to_s3 "$TEMP_DIR/$cluster_identifier-$db_name-$TIMESTAMP.tar.gz" "mongodb" "$db_name"
      fi
    done
    cleanup_old_backups "mongodb" "$RETENTION_DAYS"
  fi
  
  # Back up Redis instances
  if [ "$BACKUP_REDIS" = true ]; then
    log "Starting Redis backups..."
    for redis_id in "${REDIS_INSTANCES[@]}"; do
      log "Backing up Redis instance: $redis_id"
      if ! backup_redis "$redis_id" "$TEMP_DIR/$redis_id-$TIMESTAMP.json"; then
        handle_error "Failed to back up Redis instance: $redis_id" "redis" "$redis_id"
      else
        upload_to_s3 "$TEMP_DIR/$redis_id-$TIMESTAMP.json" "redis" "$redis_id"
      fi
    done
    cleanup_old_backups "redis" "$RETENTION_DAYS"
  fi
  
  # Back up Elasticsearch indices
  if [ "$BACKUP_ELASTICSEARCH" = true ]; then
    log "Starting Elasticsearch backups..."
    for es_config in "${ES_INDICES[@]}"; do
      IFS=':' read -r domain_name index_name <<< "$es_config"
      log "Backing up Elasticsearch index: $index_name from $domain_name"
      if ! backup_elasticsearch "$domain_name" "$index_name" "$TEMP_DIR/$domain_name-$index_name-$TIMESTAMP.json"; then
        handle_error "Failed to back up Elasticsearch index: $index_name" "elasticsearch" "$index_name"
      else
        upload_to_s3 "$TEMP_DIR/$domain_name-$index_name-$TIMESTAMP.json" "elasticsearch" "$index_name"
      fi
    done
    cleanup_old_backups "elasticsearch" "$RETENTION_DAYS"
  fi
  
  # Clean up temporary files
  cleanup_temp_files
  
  log "Backup process completed"
  exit 0
}

# Main script execution
main "$@"