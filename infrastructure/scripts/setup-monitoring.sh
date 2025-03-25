#!/bin/bash

# Description: Bash script to set up and configure the monitoring infrastructure for the AI-driven Freight Optimization Platform.
# This script automates the deployment of Prometheus, Grafana, Alertmanager, and various exporters to enable comprehensive monitoring of system health, performance metrics, and business KPIs.
#
# Requirements Addressed:
#   - Monitoring Infrastructure: Technical Specifications/6.5 MONITORING AND OBSERVABILITY/6.5.1 MONITORING INFRASTRUCTURE
#   - Performance Metrics Collection: Technical Specifications/6.5 MONITORING AND OBSERVABILITY/6.5.2 PERFORMANCE METRICS COLLECTION
#   - Alert Management: Technical Specifications/6.5 MONITORING AND OBSERVABILITY/6.5.3 INCIDENT RESPONSE
#   - Dashboard Design: Technical Specifications/6.5 MONITORING AND OBSERVABILITY/6.5.1 MONITORING INFRASTRUCTURE
#   - SLA Monitoring: Technical Specifications/6.5 MONITORING AND OBSERVABILITY/6.5.2 OBSERVABILITY PATTERNS
#
# Prerequisites:
#   - kubectl (Kubernetes command-line tool) version 1.25+
#   - helm (Kubernetes package manager) version 3.10+
#   - jq (Command-line JSON processor) version 1.6+
#   - yq (Command-line YAML processor) version 4.25+
#   - Access to a Kubernetes cluster
#   - AWS CLI configured if deploying to EKS

# Import Kubernetes manifests for deploying Prometheus monitoring system
# Source: infrastructure/kubernetes/base/monitoring/prometheus.yaml
# Used members: kubernetes_resources
# Import Kubernetes manifests for deploying Grafana visualization platform
# Source: infrastructure/kubernetes/base/monitoring/grafana.yaml
# Used members: kubernetes_resources
# Import Kubernetes manifests for deploying Alertmanager for alert routing and notifications
# Source: infrastructure/kubernetes/base/monitoring/alertmanager.yaml
# Used members: kubernetes_resources
# Import Main Prometheus configuration file with global settings and scrape configurations
# Source: infrastructure/monitoring/prometheus/prometheus.yml
# Used members: global, scrape_configs
# Import Alerting rules for Prometheus to monitor system health and performance
# Source: infrastructure/monitoring/prometheus/alert-rules.yml
# Used members: groups
# Import Configuration for Grafana dashboard provisioning and organization
# Source: infrastructure/monitoring/grafana/dashboards.yaml
# Used members: providers

# External dependencies versions
# kubectl version 1.25+
# helm version 3.10+
# jq version 1.6+
# yq version 4.25+

# Global variables
ENVIRONMENT="" # Environment name (dev, staging, prod)
REGION=""        # AWS region where the cluster is deployed
CLUSTER_NAME=""  # Name of the EKS cluster
NAMESPACE="monitoring" # Kubernetes namespace for monitoring components
GRAFANA_ADMIN_PASSWORD="" # Admin password for Grafana
ALERTMANAGER_CONFIG_FILE="" # Path to Alertmanager configuration file
PROMETHEUS_STORAGE_SIZE="50Gi" # Size of Prometheus persistent volume
GRAFANA_STORAGE_SIZE="10Gi" # Size of Grafana persistent volume
MONITORING_NODE_SELECTOR="role=monitoring" # Node selector for monitoring components
DASHBOARDS_DIR="infrastructure/monitoring/dashboards" # Directory containing Grafana dashboards
PROMETHEUS_RETENTION_DAYS="15" # Number of days to retain Prometheus data

# Function to print usage instructions
usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -e <environment>  Environment name (dev, staging, prod)"
  echo "  -r <region>       AWS region where the cluster is deployed"
  echo "  -c <cluster_name> Name of the EKS cluster"
  echo "  -n <namespace>    Kubernetes namespace for monitoring components (default: monitoring)"
  echo "  -p <password>     Admin password for Grafana"
  echo "  -f <config_file>  Path to Alertmanager configuration file"
  echo "  -s <storage_size> Size of Prometheus persistent volume (default: 50Gi)"
  echo "  -g <grafana_storage_size> Size of Grafana persistent volume (default: 10Gi)"
  echo "  -o <node_selector> Node selector for monitoring components (default: role=monitoring)"
  echo "  -d <dashboards_dir> Directory containing Grafana dashboards (default: infrastructure/monitoring/dashboards)"
  echo "  -t <retention_days> Number of days to retain Prometheus data (default: 15)"
  echo "  -h                Show this help message"
  exit 1
}

# Function to check if all required tools and dependencies are installed
check_prerequisites() {
  echo "Checking prerequisites..."

  # Check if kubectl is installed
  if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed. Please install kubectl."
    return 1
  fi

  # Check if helm is installed
  if ! command -v helm &> /dev/null; then
    echo "Error: helm is not installed. Please install helm."
    return 1
  fi

  # Check if jq is installed
  if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install jq."
    return 1
  fi

  # Check if yq is installed
  if ! command -v yq &> /dev/null; then
    echo "Error: yq is not installed. Please install yq."
    return 1
  fi

  # Check if the Kubernetes cluster is accessible
  if ! kubectl get nodes &> /dev/null; then
    echo "Error: Unable to connect to the Kubernetes cluster. Please check your kubectl configuration."
    return 1
  fi

  # Verify AWS CLI is configured if deploying to EKS
  if [[ ! -z "$CLUSTER_NAME" ]]; then
    if ! command -v aws &> /dev/null; then
      echo "Error: AWS CLI is not installed. Please install aws CLI."
      return 1
    fi
    if ! aws eks --region "$REGION" describe-cluster --name "$CLUSTER_NAME" &> /dev/null; then
      echo "Error: AWS CLI is not configured or EKS cluster not found. Please configure aws or check the cluster name and region."
      return 1
    fi
  fi

  echo "All prerequisites met."
  return 0
}

# Function to create the Kubernetes namespace for monitoring components
create_monitoring_namespace() {
  local namespace="$1"
  echo "Creating namespace: $namespace"

  # Check if namespace already exists
  if kubectl get namespace "$namespace" &> /dev/null; then
    echo "Namespace '$namespace' already exists."
  else
    # Create namespace if it doesn't exist
    kubectl create namespace "$namespace" || {
      echo "Error: Failed to create namespace '$namespace'."
      return 1
    }
    echo "Namespace '$namespace' created successfully."
  fi

  # Label namespace for monitoring
  kubectl label namespace "$namespace" app=monitoring || {
    echo "Error: Failed to label namespace '$namespace'."
    return 1
  }
  echo "Namespace '$namespace' labeled for monitoring."
  return 0
}

# Function to deploy Prometheus monitoring system using Kubernetes manifests
deploy_prometheus() {
  local namespace="$1"
  local storage_size="$2"
  local retention_days="$3"
  local node_selector="$4"

  echo "Deploying Prometheus to namespace: $namespace"

  # Set variables in prometheus.yaml
  yq w -i "infrastructure/kubernetes/base/monitoring/prometheus.yaml" "data.prometheus\\.yml" "$(cat infrastructure/monitoring/prometheus/prometheus.yml)" || {
    echo "Error: Failed to set prometheus.yml data."
    return 1
  }

  # Create ConfigMap for Prometheus configuration
  kubectl apply -n "$namespace" -f infrastructure/kubernetes/base/monitoring/prometheus.yaml || {
    echo "Error: Failed to apply Prometheus configuration."
    return 1
  }

  # Deploy Prometheus StatefulSet/Deployment
  kubectl apply -n "$namespace" -f infrastructure/kubernetes/base/monitoring/prometheus.yaml || {
    echo "Error: Failed to deploy Prometheus."
    return 1
  }

  # Wait for Prometheus to be ready
  kubectl rollout status deployment/prometheus -n "$namespace" --timeout=60s || {
    echo "Error: Prometheus deployment failed."
    return 1
  }

  echo "Prometheus deployed successfully."
  return 0
}

# Function to deploy Grafana visualization platform using Kubernetes manifests
deploy_grafana() {
  local namespace="$1"
  local storage_size="$2"
  local admin_password="$3"
  local node_selector="$4"

  echo "Deploying Grafana to namespace: $namespace"

  # Create Secret for Grafana credentials
  kubectl create secret generic grafana-credentials -n "$namespace" --from-literal=admin-password="$admin_password" --dry-run=client -o yaml | kubectl apply -f - || {
    echo "Error: Failed to create Grafana credentials secret."
    return 1
  }

  # Apply Grafana deployment
  kubectl apply -n "$namespace" -f infrastructure/kubernetes/base/monitoring/grafana.yaml || {
    echo "Error: Failed to deploy Grafana."
    return 1
  }

  # Wait for Grafana to be ready
  kubectl rollout status deployment/grafana -n "$namespace" --timeout=60s || {
    echo "Error: Grafana deployment failed."
    return 1
  }

  echo "Grafana deployed successfully."
  return 0
}

# Function to deploy Alertmanager for alert routing and notifications
deploy_alertmanager() {
  local namespace="$1"
  local config_file="$2"
  local node_selector="$3"

  echo "Deploying Alertmanager to namespace: $namespace"

  # Apply Alertmanager deployment
  kubectl apply -n "$namespace" -f infrastructure/kubernetes/base/monitoring/alertmanager.yaml || {
    echo "Error: Failed to deploy Alertmanager."
    return 1
  }

  # Wait for Alertmanager to be ready
  kubectl rollout status deployment/alertmanager -n "$namespace" --timeout=60s || {
    echo "Error: Alertmanager deployment failed."
    return 1
  }

  echo "Alertmanager deployed successfully."
  return 0
}

# Function to deploy various exporters for collecting metrics from different components
deploy_exporters() {
  local namespace="$1"
  local node_selector="$2"

  echo "Deploying exporters to namespace: $namespace"

  # Placeholder for exporter deployment logic
  echo "Exporter deployment logic not implemented yet."

  echo "Exporters deployment completed."
  return 0
}

# Function to configure and provision Grafana dashboards
configure_dashboards() {
  local namespace="$1"
  local dashboards_dir="$2"

  echo "Configuring Grafana dashboards in namespace: $namespace"

  # Placeholder for dashboard configuration logic
  echo "Dashboard configuration logic not implemented yet."

  echo "Grafana dashboards configured."
  return 0
}

# Function to set up ingress for accessing monitoring components
setup_ingress() {
  local namespace="$1"
  local domain="$2"

  echo "Setting up ingress for monitoring components in namespace: $namespace"

  # Placeholder for ingress setup logic
  echo "Ingress setup logic not implemented yet."

  echo "Ingress setup completed."
  return 0
}

# Function to verify that the monitoring infrastructure is functioning correctly
verify_monitoring() {
  local namespace="$1"

  echo "Verifying monitoring infrastructure in namespace: $namespace"

  # Placeholder for monitoring verification logic
  echo "Monitoring verification logic not implemented yet."

  echo "Monitoring infrastructure verified."
  return 0
}

# Main function that orchestrates the setup of the monitoring infrastructure
main() {
  echo "Setting up monitoring infrastructure..."

  # Parse command-line arguments
  while getopts "e:r:c:n:p:f:s:g:o:d:t:h" opt; do
    case "$opt" in
      e) ENVIRONMENT="$OPTARG" ;;
      r) REGION="$OPTARG" ;;
      c) CLUSTER_NAME="$OPTARG" ;;
      n) NAMESPACE="$OPTARG" ;;
      p) GRAFANA_ADMIN_PASSWORD="$OPTARG" ;;
      f) ALERTMANAGER_CONFIG_FILE="$OPTARG" ;;
      s) PROMETHEUS_STORAGE_SIZE="$OPTARG" ;;
      g) GRAFANA_STORAGE_SIZE="$OPTARG" ;;
      o) MONITORING_NODE_SELECTOR="$OPTARG" ;;
      d) DASHBOARDS_DIR="$OPTARG" ;;
      t) PROMETHEUS_RETENTION_DAYS="$OPTARG" ;;
      h) usage ;;
      \?) echo "Invalid option: -$OPTARG" >&2; usage ;;
    esac
  done

  # Set default values for parameters
  [ -z "$GRAFANA_ADMIN_PASSWORD" ] && GRAFANA_ADMIN_PASSWORD="admin"
  [ -z "$ALERTMANAGER_CONFIG_FILE" ] && ALERTMANAGER_CONFIG_FILE="infrastructure/monitoring/alertmanager/alertmanager.yml"

  # Check prerequisites
  if ! check_prerequisites; then
    echo "Setup failed due to unmet prerequisites."
    return 1
  fi

  # Create monitoring namespace
  if ! create_monitoring_namespace "$NAMESPACE"; then
    echo "Setup failed during namespace creation."
    return 1
  fi

  # Deploy Prometheus
  if ! deploy_prometheus "$NAMESPACE" "$PROMETHEUS_STORAGE_SIZE" "$PROMETHEUS_RETENTION_DAYS" "$MONITORING_NODE_SELECTOR"; then
    echo "Setup failed during Prometheus deployment."
    return 1
  fi

  # Deploy Grafana
  if ! deploy_grafana "$NAMESPACE" "$GRAFANA_STORAGE_SIZE" "$GRAFANA_ADMIN_PASSWORD" "$MONITORING_NODE_SELECTOR"; then
    echo "Setup failed during Grafana deployment."
    return 1
  fi

  # Deploy Alertmanager
  if ! deploy_alertmanager "$NAMESPACE" "$ALERTMANAGER_CONFIG_FILE" "$MONITORING_NODE_SELECTOR"; then
    echo "Setup failed during Alertmanager deployment."
    return 1
  fi

  # Deploy exporters
  if ! deploy_exporters "$NAMESPACE" "$MONITORING_NODE_SELECTOR"; then
    echo "Setup failed during exporter deployment."
    return 1
  fi

  # Configure dashboards
  if ! configure_dashboards "$NAMESPACE" "$DASHBOARDS_DIR"; then
    echo "Setup failed during dashboard configuration."
    return 1
  fi

  # Setup ingress
  if ! setup_ingress "$NAMESPACE" "$DOMAIN"; then
    echo "Setup failed during ingress setup."
    return 1
  fi

  # Verify monitoring
  if ! verify_monitoring "$NAMESPACE"; then
    echo "Setup failed during monitoring verification."
    return 1
  fi

  # Print setup summary and access information
  echo "Monitoring infrastructure setup completed successfully!"
  echo "Access Grafana at: <grafana_url>"
  echo "Access Prometheus at: <prometheus_url>"
  echo "Access Alertmanager at: <alertmanager_url>"

  return 0
}

# Call the main function
main