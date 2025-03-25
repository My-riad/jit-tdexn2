#!/bin/bash
#
# Service Deployment Script
# This script deploys the microservices of the AI-driven Freight Optimization Platform
# to Kubernetes clusters across different environments (dev, staging, production)

# Exit on error and handle pipeline failures
set -e
set -o pipefail

# Source the config function from init-eks.sh if it exists
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/init-eks.sh" ]; then
    source "${SCRIPT_DIR}/init-eks.sh"
fi

# Global variables with default values
ENVIRONMENT="dev"
NAMESPACE="freight-dev"
DEPLOYMENT_TIMEOUT=300
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=10
DRY_RUN=false
CANARY_DEPLOYMENT=false
CANARY_PERCENTAGE=10
ROLLBACK_ON_FAILURE=true
DEPLOYED_SERVICES=()

# Default list of all services
ALL_SERVICES=(
  "api-gateway"
  "auth-service"
  "cache-service"
  "driver-service"
  "event-bus"
  "gamification-service"
  "integration-service"
  "load-matching-service"
  "load-service"
  "market-intelligence-service"
  "notification-service"
  "optimization-engine"
  "tracking-service"
)

# Logging functions
function log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

function log_error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

function log_success() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1"
}

# Display usage information
function usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -e, --environment ENV       Deployment environment (dev, staging, prod)"
  echo "  -c, --cluster CLUSTER_NAME  EKS cluster name"
  echo "  -r, --region REGION         AWS region"
  echo "  -n, --namespace NAMESPACE   Kubernetes namespace"
  echo "  -i, --image-registry URL    Container image registry URL"
  echo "  -t, --image-tag TAG         Container image tag to deploy"
  echo "  -s, --services SVC1,SVC2    Comma-separated list of services to deploy (default: all)"
  echo "  --dry-run                   Perform a dry run without making changes"
  echo "  --canary                    Use canary deployment for production"
  echo "  --canary-percentage PCT     Percentage of traffic for canary (default: 10)"
  echo "  --no-rollback               Disable automatic rollback on failure"
  echo "  -h, --help                  Show this help message"
  exit 1
}

# Cleanup function for exit trap
function cleanup() {
  if [ $? -ne 0 ] && [ "${#DEPLOYED_SERVICES[@]}" -gt 0 ]; then
    log_error "Deployment failed. Performing cleanup..."
    cleanup_on_failure "$ENVIRONMENT" "${DEPLOYED_SERVICES[@]}"
  fi
}

# Set trap handlers
trap cleanup EXIT
trap 'log_error "Script interrupted."; exit 1' INT TERM

# Check prerequisites
function check_prerequisites() {
  log "Checking prerequisites..."
  
  # Check kubectl
  if ! command -v kubectl &> /dev/null; then
    log_error "kubectl is not installed. Please install kubectl v1.28+ and try again."
    return 1
  fi
  
  # Check kubectl version
  local kubectl_version
  kubectl_version=$(kubectl version --client -o json | jq -r '.clientVersion.major + "." + .clientVersion.minor' 2>/dev/null)
  if [[ -z "$kubectl_version" ]] || [[ $(echo "$kubectl_version" | cut -d. -f1) -lt 1 ]] || [[ $(echo "$kubectl_version" | cut -d. -f2) -lt 28 ]]; then
    log_error "kubectl version 1.28+ is required. Current version: $kubectl_version"
    return 1
  fi
  
  # Check kustomize
  if ! command -v kustomize &> /dev/null; then
    log_error "kustomize is not installed. Please install kustomize v4.5+ and try again."
    return 1
  fi
  
  # Check AWS CLI
  if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed. Please install AWS CLI v2.0+ and try again."
    return 1
  fi
  
  # Check jq
  if ! command -v jq &> /dev/null; then
    log_error "jq is not installed. Please install jq v1.6+ and try again."
    return 1
  fi
  
  # Check yq
  if ! command -v yq &> /dev/null; then
    log_error "yq is not installed. Please install yq v4.0+ and try again."
    return 1
  fi
  
  # Verify AWS CLI is configured
  if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS CLI is not properly configured. Please configure it with appropriate credentials."
    return 1
  fi
  
  log "All prerequisites are met."
  return 0
}

# Parse command line arguments
function parse_arguments() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -e|--environment)
        ENVIRONMENT="$2"
        shift 2
        ;;
      -c|--cluster)
        CLUSTER_NAME="$2"
        shift 2
        ;;
      -r|--region)
        REGION="$2"
        shift 2
        ;;
      -n|--namespace)
        NAMESPACE="$2"
        shift 2
        ;;
      -i|--image-registry)
        IMAGE_REGISTRY="$2"
        shift 2
        ;;
      -t|--image-tag)
        IMAGE_TAG="$2"
        shift 2
        ;;
      -s|--services)
        IFS=',' read -r -a SERVICES <<< "$2"
        shift 2
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --canary)
        CANARY_DEPLOYMENT=true
        shift
        ;;
      --canary-percentage)
        CANARY_PERCENTAGE="$2"
        shift 2
        ;;
      --no-rollback)
        ROLLBACK_ON_FAILURE=false
        shift
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
  if [ -z "$CLUSTER_NAME" ]; then
    log_error "Cluster name is required. Please provide it with -c or --cluster."
    usage
  fi
  
  if [ -z "$REGION" ]; then
    log_error "AWS region is required. Please provide it with -r or --region."
    usage
  fi
  
  if [ -z "$IMAGE_REGISTRY" ]; then
    log_error "Image registry URL is required. Please provide it with -i or --image-registry."
    usage
  fi
  
  if [ -z "$IMAGE_TAG" ]; then
    log_error "Image tag is required. Please provide it with -t or --image-tag."
    usage
  fi
  
  # Set environment-specific default namespace if not provided
  if [ -z "$NAMESPACE" ]; then
    case "$ENVIRONMENT" in
      dev)
        NAMESPACE="freight-dev"
        ;;
      staging)
        NAMESPACE="freight-staging"
        ;;
      prod)
        NAMESPACE="freight-prod"
        ;;
      *)
        NAMESPACE="freight-$ENVIRONMENT"
        ;;
    esac
  fi
  
  # Set KUBECONFIG path
  KUBE_CONFIG_PATH="${SCRIPT_DIR}/${CLUSTER_NAME}-kubeconfig"
  export KUBECONFIG="${KUBE_CONFIG_PATH}"
  
  # Log configuration
  log "Using the following configuration:"
  log "  Environment: ${ENVIRONMENT}"
  log "  Cluster Name: ${CLUSTER_NAME}"
  log "  Region: ${REGION}"
  log "  Namespace: ${NAMESPACE}"
  log "  Image Registry: ${IMAGE_REGISTRY}"
  log "  Image Tag: ${IMAGE_TAG}"
  if [ -n "$SERVICES" ]; then
    log "  Services: ${SERVICES[*]}"
  else
    log "  Services: All services"
  fi
  log "  Dry Run: $([ "$DRY_RUN" = true ] && echo "Yes" || echo "No")"
  log "  Canary Deployment: $([ "$CANARY_DEPLOYMENT" = true ] && echo "Yes (${CANARY_PERCENTAGE}%)" || echo "No")"
  log "  Automatic Rollback: $([ "$ROLLBACK_ON_FAILURE" = true ] && echo "Enabled" || echo "Disabled")"
}

# Configure kubectl context
function configure_kubectl_context() {
  local cluster_name="$1"
  local region="$2"
  
  log "Configuring kubectl to use EKS cluster ${cluster_name}..."
  
  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would update kubeconfig for cluster ${cluster_name} in region ${region}"
  else
    # Use the configure_kubectl function from init-eks.sh if available
    if declare -f configure_kubectl >/dev/null; then
      configure_kubectl "$cluster_name" "$region"
    else
      # Otherwise, use aws eks update-kubeconfig directly
      aws eks update-kubeconfig --name "$cluster_name" --region "$region" --kubeconfig "$KUBE_CONFIG_PATH"
      
      # Verify kubectl configuration
      if ! kubectl cluster-info; then
        log_error "Failed to configure kubectl for cluster ${cluster_name}"
        return 1
      fi
      
      log "Successfully configured kubectl to use EKS cluster ${cluster_name}"
    fi
  fi
  
  return 0
}

# Update image tags in Kustomize configuration
function update_image_tags() {
  local environment="$1"
  local registry="$2"
  local tag="$3"
  shift 3
  local services=("$@")
  
  log "Updating image tags in Kustomize configuration..."
  
  local kustomization_path="${KUSTOMIZE_DIR}/overlays/${environment}/kustomization.yaml"
  
  if [ ! -f "$kustomization_path" ]; then
    log_error "Kustomization file not found at ${kustomization_path}"
    return 1
  fi
  
  if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would update image tags in ${kustomization_path} for services: ${services[*]}"
  else
    # Create a backup of the kustomization file
    cp "$kustomization_path" "${kustomization_path}.bak"
    
    # Read the current images section if it exists
    local has_images
    has_images=$(yq e '.images' "$kustomization_path")
    
    if [[ "$has_images" == "null" ]]; then
      # If images section doesn't exist, create it
      yq e -i '.images = []' "$kustomization_path"
    fi
    
    # Update image tags for each service
    for service in "${services[@]}"; do
      # Check if the service image already exists in the images section
      local image_exists
      image_exists=$(yq e ".images[] | select(.name == \"${service}\")" "$kustomization_path")
      
      if [[ -n "$image_exists" ]]; then
        # Update existing image entry
        yq e -i "(.images[] | select(.name == \"${service}\")).newName = \"${registry}/${service}\"" "$kustomization_path"
        yq e -i "(.images[] | select(.name == \"${service}\")).newTag = \"${tag}\"" "$kustomization_path"
        log "Updated existing image for ${service} in kustomization"
      else
        # Add new image entry
        yq e -i ".images += [{\"name\": \"${service}\", \"newName\": \"${registry}/${service}\", \"newTag\": \"${tag}\"}]" "$kustomization_path"
        log "Added new image for ${service} in kustomization"
      fi
    done
    
    log "Image tags updated successfully in ${kustomization_path}"
  fi
  
  return 0
}

# Deploy services to the Kubernetes cluster
function deploy_services() {
  local environment="$1"
  shift
  local services=("$@")
  local dry_run="$DRY_RUN"
  
  log "Deploying services to ${environment} environment..."
  
  # Determine overlay directory
  local overlay_dir="${KUSTOMIZE_DIR}/overlays/${environment}"
  
  if [ ! -d "$overlay_dir" ]; then
    log_error "Overlay directory not found: ${overlay_dir}"
    return 1
  fi
  
  # Prepare dry-run flag if needed
  local dry_run_flag=""
  if [ "$dry_run" = true ]; then
    dry_run_flag="--dry-run=client"
  fi
  
  # Deploy each service
  for service in "${services[@]}"; do
    log "Deploying service: ${service}"
    
    # Check if service directory exists
    local service_dir="${overlay_dir}/${service}"
    if [ ! -d "$service_dir" ] && [ ! -f "${overlay_dir}/kustomization.yaml" ]; then
      log_error "Service directory or kustomization file not found for ${service}"
      continue
    fi
    
    # For production with canary deployment enabled
    if [ "$environment" = "prod" ] && [ "$CANARY_DEPLOYMENT" = true ] && [ "$dry_run" = false ]; then
      log "Performing canary deployment for ${service} with ${CANARY_PERCENTAGE}% traffic"
      
      if ! perform_canary_deployment "$service" "$CANARY_PERCENTAGE"; then
        log_error "Canary deployment failed for ${service}. Skipping full deployment."
        continue
      fi
    fi
    
    # Apply kustomize overlay
    if [ -d "$service_dir" ]; then
      # Service has its own directory
      if [ "$dry_run" = true ]; then
        log "DRY RUN: Would apply kustomize overlay for ${service}"
        kubectl kustomize "$service_dir" | kubectl apply -f - --dry-run=client
      else
        kubectl kustomize "$service_dir" | kubectl apply -f - $dry_run_flag
      fi
    else
      # Service is part of the main kustomization
      if [ "$dry_run" = true ]; then
        log "DRY RUN: Would apply kustomize overlay for ${service} from main kustomization"
        kubectl kustomize "$overlay_dir" | kubectl apply -f - --dry-run=client
      else
        kubectl kustomize "$overlay_dir" | kubectl apply -f - $dry_run_flag
      fi
    fi
    
    # If dry run, skip the rest
    if [ "$dry_run" = true ]; then
      log "DRY RUN: Would validate deployment for ${service}"
      continue
    fi
    
    # Wait for deployment to complete
    log "Waiting for deployment of ${service} to complete..."
    
    # Get all deployments for this service
    local deployments
    deployments=$(kubectl get deployments -n "$NAMESPACE" -l app="$service" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)
    
    if [ -z "$deployments" ]; then
      log_error "No deployments found for service ${service}"
      continue
    fi
    
    # Wait for each deployment to roll out
    for deployment in $deployments; do
      if ! wait_for_deployment "$NAMESPACE" "$deployment" "$DEPLOYMENT_TIMEOUT"; then
        log_error "Deployment timeout for ${deployment}"
        if [ "$ROLLBACK_ON_FAILURE" = true ]; then
          log "Rolling back deployment for ${deployment}"
          rollback_deployment "$NAMESPACE" "$deployment"
        fi
        continue
      fi
      
      # Verify deployment
      if ! verify_deployment "$NAMESPACE" "$deployment"; then
        log_error "Deployment verification failed for ${deployment}"
        if [ "$ROLLBACK_ON_FAILURE" = true ]; then
          log "Rolling back deployment for ${deployment}"
          rollback_deployment "$NAMESPACE" "$deployment"
        fi
        continue
      fi
    done
    
    # Add to deployed services for potential cleanup
    DEPLOYED_SERVICES+=("$service")
    log_success "Service ${service} deployed successfully"
  done
  
  return 0
}

# Wait for a deployment to complete
function wait_for_deployment() {
  local namespace="$1"
  local deployment_name="$2"
  local timeout="$3"
  
  log "Waiting for deployment ${deployment_name} to complete (timeout: ${timeout}s)..."
  
  local start_time=$(date +%s)
  local end_time=$((start_time + timeout))
  
  while [ $(date +%s) -lt $end_time ]; do
    if kubectl rollout status deployment/"$deployment_name" -n "$namespace" --timeout=10s &>/dev/null; then
      log "Deployment ${deployment_name} completed successfully"
      return 0
    fi
    
    local current_time=$(date +%s)
    local elapsed=$((current_time - start_time))
    local remaining=$((timeout - elapsed))
    
    if [ $remaining -le 0 ]; then
      log_error "Timeout waiting for deployment ${deployment_name} to complete"
      return 1
    fi
    
    log "Deployment in progress... (${elapsed}s elapsed, ${remaining}s remaining)"
    sleep 10
  done
  
  log_error "Timeout waiting for deployment ${deployment_name} to complete"
  return 1
}

# Verify deployment is running correctly
function verify_deployment() {
  local namespace="$1"
  local deployment_name="$2"
  
  log "Verifying deployment ${deployment_name}..."
  
  # Check if deployment has desired replicas
  local desired_replicas
  local available_replicas
  
  desired_replicas=$(kubectl get deployment "$deployment_name" -n "$namespace" -o jsonpath='{.spec.replicas}')
  available_replicas=$(kubectl get deployment "$deployment_name" -n "$namespace" -o jsonpath='{.status.availableReplicas}')
  
  if [ "$desired_replicas" != "$available_replicas" ]; then
    log_error "Deployment ${deployment_name} has ${available_replicas}/${desired_replicas} replicas available"
    return 1
  fi
  
  # Check if pods are Running and Ready
  local pods
  pods=$(kubectl get pods -n "$namespace" -l app="$deployment_name" -o jsonpath='{.items[*].metadata.name}')
  
  for pod in $pods; do
    local pod_status
    local is_ready
    
    pod_status=$(kubectl get pod "$pod" -n "$namespace" -o jsonpath='{.status.phase}')
    is_ready=$(kubectl get pod "$pod" -n "$namespace" -o jsonpath='{.status.containerStatuses[0].ready}')
    
    if [ "$pod_status" != "Running" ] || [ "$is_ready" != "true" ]; then
      log_error "Pod ${pod} is not running correctly (status: ${pod_status}, ready: ${is_ready})"
      return 1
    fi
  done
  
  # Check if service endpoints are available
  local services
  services=$(kubectl get service -n "$namespace" -l app="$deployment_name" -o jsonpath='{.items[*].metadata.name}')
  
  for service in $services; do
    local endpoints
    endpoints=$(kubectl get endpoints "$service" -n "$namespace" -o jsonpath='{.subsets[*].addresses}')
    
    if [ -z "$endpoints" ]; then
      log_error "Service ${service} has no endpoints"
      return 1
    fi
  done
  
  log "Deployment ${deployment_name} verification successful"
  return 0
}

# Perform canary deployment for production
function perform_canary_deployment() {
  local service_name="$1"
  local percentage="$2"
  
  log "Setting up canary deployment for ${service_name} with ${percentage}% traffic"
  
  # Create canary deployment
  local canary_name="${service_name}-canary"
  local stable_deployment="${service_name}"
  
  # Get the current deployment YAML and modify it for canary
  kubectl get deployment "$stable_deployment" -n "$NAMESPACE" -o yaml > /tmp/stable-deployment.yaml
  
  # Modify the deployment for canary
  cat /tmp/stable-deployment.yaml | \
    yq e ".metadata.name = \"${canary_name}\"" - | \
    yq e ".spec.selector.matchLabels.version = \"canary\"" - | \
    yq e ".spec.template.metadata.labels.version = \"canary\"" - | \
    yq e ".spec.replicas = 1" - > /tmp/canary-deployment.yaml
  
  # Apply canary deployment
  kubectl apply -f /tmp/canary-deployment.yaml -n "$NAMESPACE"
  
  # Wait for canary deployment to be ready
  if ! wait_for_deployment "$NAMESPACE" "$canary_name" "$DEPLOYMENT_TIMEOUT"; then
    log_error "Canary deployment failed to become ready"
    kubectl delete deployment "$canary_name" -n "$NAMESPACE"
    return 1
  fi
  
  # Configure traffic splitting
  log "Configuring traffic splitting: ${percentage}% to canary, $((100-percentage))% to stable"
  
  # Check if we have a service for this deployment
  local service_exists
  service_exists=$(kubectl get service "$service_name" -n "$NAMESPACE" --ignore-not-found)
  
  if [ -z "$service_exists" ]; then
    log_error "Service ${service_name} not found. Cannot configure traffic splitting."
    kubectl delete deployment "$canary_name" -n "$NAMESPACE"
    return 1
  fi
  
  # Create or update service to split traffic
  # This is a simplified example - in a real environment, you might use
  # a service mesh like Istio or an ingress controller for traffic splitting
  
  # For this script, we'll use labels and selector to distribute traffic
  # Save current service definition
  kubectl get service "$service_name" -n "$NAMESPACE" -o yaml > /tmp/service.yaml
  
  # Modify service to select both stable and canary pods with appropriate weights
  # Note: This is a simplified approximation - actual implementation would depend on your infrastructure
  yq e ".spec.selector = {\"app\": \"${service_name}\"}" /tmp/service.yaml > /tmp/updated-service.yaml
  
  # Apply updated service
  kubectl apply -f /tmp/updated-service.yaml -n "$NAMESPACE"
  
  # Monitor canary deployment for a period
  log "Monitoring canary deployment for ${service_name}..."
  local canary_health
  canary_health=$(monitor_deployment_metrics "$NAMESPACE" "$canary_name" 300)
  
  # Decision based on canary health
  if [[ "$canary_health" == *"healthy: true"* ]]; then
    log_success "Canary deployment for ${service_name} is healthy. Proceeding with full deployment."
    
    # Clean up canary
    kubectl delete deployment "$canary_name" -n "$NAMESPACE"
    
    # Update service back to stable only
    yq e ".spec.selector = {\"app\": \"${service_name}\", \"version\": \"stable\"}" /tmp/service.yaml > /tmp/stable-service.yaml
    kubectl apply -f /tmp/stable-service.yaml -n "$NAMESPACE"
    
    return 0
  else
    log_error "Canary deployment for ${service_name} is unhealthy. Rolling back."
    
    # Clean up canary
    kubectl delete deployment "$canary_name" -n "$NAMESPACE"
    
    # Revert service to original
    kubectl apply -f /tmp/service.yaml -n "$NAMESPACE"
    
    return 1
  fi
}

# Monitor deployment metrics to ensure it's healthy
function monitor_deployment_metrics() {
  local namespace="$1"
  local deployment_name="$2"
  local duration="$3"
  
  log "Monitoring deployment ${deployment_name} for ${duration} seconds..."
  
  # Initialize metrics
  local error_rate=0
  local response_time=0
  local cpu_usage=0
  local memory_usage=0
  local healthy=true
  
  # Monitor for specified duration
  local start_time=$(date +%s)
  local end_time=$((start_time + duration))
  
  while [ $(date +%s) -lt $end_time ]; do
    # Get pod metrics if available
    if kubectl top pods -n "$namespace" &>/dev/null; then
      # Get deployment pods
      local pods
      pods=$(kubectl get pods -n "$namespace" -l app="$deployment_name" -o jsonpath='{.items[*].metadata.name}')
      
      for pod in $pods; do
        # Get CPU and memory metrics
        local pod_metrics
        pod_metrics=$(kubectl top pod "$pod" -n "$namespace" --no-headers)
        
        if [ -n "$pod_metrics" ]; then
          local pod_cpu
          local pod_memory
          
          pod_cpu=$(echo "$pod_metrics" | awk '{print $2}' | sed 's/[^0-9]*//g')
          pod_memory=$(echo "$pod_metrics" | awk '{print $3}' | sed 's/[^0-9]*//g')
          
          # Check for excessive resource usage
          if [ -n "$pod_cpu" ] && [ "$pod_cpu" -gt 90 ]; then
            log_error "Pod ${pod} has high CPU usage: ${pod_cpu}%"
            healthy=false
          fi
          
          if [ -n "$pod_memory" ] && [ "$pod_memory" -gt 90 ]; then
            log_error "Pod ${pod} has high memory usage: ${pod_memory}%"
            healthy=false
          fi
        fi
      done
    fi
    
    # Check pod logs for errors
    for pod in $(kubectl get pods -n "$namespace" -l app="$deployment_name" -o jsonpath='{.items[*].metadata.name}'); do
      local log_errors
      log_errors=$(kubectl logs "$pod" -n "$namespace" --since=1m | grep -i "error\|exception\|fail" | wc -l)
      
      if [ "$log_errors" -gt 10 ]; then
        log_error "Pod ${pod} has ${log_errors} errors in logs"
        healthy=false
      fi
    done
    
    # Check if any pods are restarting
    for pod in $(kubectl get pods -n "$namespace" -l app="$deployment_name" -o jsonpath='{.items[*].metadata.name}'); do
      local restart_count
      restart_count=$(kubectl get pod "$pod" -n "$namespace" -o jsonpath='{.status.containerStatuses[0].restartCount}')
      
      if [ "$restart_count" -gt 2 ]; then
        log_error "Pod ${pod} has restarted ${restart_count} times"
        healthy=false
      fi
    done
    
    sleep 30
  done
  
  # Return health status and metrics
  echo "{\"healthy\": $healthy, \"error_rate\": $error_rate, \"response_time\": $response_time, \"cpu_usage\": $cpu_usage, \"memory_usage\": $memory_usage}"
  
  if [ "$healthy" = true ]; then
    return 0
  else
    return 1
  fi
}

# Roll back a deployment to the previous version
function rollback_deployment() {
  local namespace="$1"
  local deployment_name="$2"
  
  log "Rolling back deployment ${deployment_name}..."
  
  # Check if deployment exists
  if ! kubectl get deployment "$deployment_name" -n "$namespace" &>/dev/null; then
    log_error "Deployment ${deployment_name} not found"
    return 1
  fi
  
  # Perform rollback
  if ! kubectl rollout undo deployment/"$deployment_name" -n "$namespace"; then
    log_error "Failed to rollback deployment ${deployment_name}"
    return 1
  fi
  
  # Wait for rollback to complete
  if ! wait_for_deployment "$namespace" "$deployment_name" "$DEPLOYMENT_TIMEOUT"; then
    log_error "Rollback timeout for deployment ${deployment_name}"
    return 1
  fi
  
  # Verify rollback
  if ! verify_deployment "$namespace" "$deployment_name"; then
    log_error "Rollback verification failed for deployment ${deployment_name}"
    return 1
  fi
  
  log_success "Rollback successful for deployment ${deployment_name}"
  return 0
}

# Cleanup on failure
function cleanup_on_failure() {
  local environment="$1"
  shift
  local deployed_services=("$@")
  
  log "Performing cleanup after deployment failure..."
  
  if [ "$ROLLBACK_ON_FAILURE" = true ]; then
    for service in "${deployed_services[@]}"; do
      log "Rolling back service: ${service}"
      
      # Get all deployments for this service
      local deployments
      deployments=$(kubectl get deployments -n "$NAMESPACE" -l app="$service" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)
      
      if [ -n "$deployments" ]; then
        for deployment in $deployments; do
          rollback_deployment "$NAMESPACE" "$deployment"
        done
      fi
    done
  fi
  
  log "Cleanup completed"
}

# Main function
function main() {
  # Parse command line arguments
  parse_arguments "$@"
  
  # Check prerequisites
  check_prerequisites
  
  # Set script directory for relative paths
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  KUSTOMIZE_DIR="${SCRIPT_DIR}/../kubernetes"
  
  # Configure kubectl to use the correct cluster
  configure_kubectl_context "$CLUSTER_NAME" "$REGION"
  
  # Determine services to deploy
  if [ -z "$SERVICES" ]; then
    SERVICES=("${ALL_SERVICES[@]}")
  fi
  
  # Update image tags in kustomize configuration
  update_image_tags "$ENVIRONMENT" "$IMAGE_REGISTRY" "$IMAGE_TAG" "${SERVICES[@]}"
  
  # Deploy services
  deploy_services "$ENVIRONMENT" "${SERVICES[@]}"
  
  # Print summary
  log_success "Deployment completed successfully for environment: $ENVIRONMENT"
  log "Services deployed: ${SERVICES[*]}"
  
  return 0
}

# Main script execution
main "$@"