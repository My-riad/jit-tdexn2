#!/bin/bash
#
# EKS Cluster Initialization Script
# This script initializes and configures an Amazon EKS cluster for the AI-driven Freight Optimization Platform
# It sets up the Kubernetes environment, installs essential components, and prepares the cluster for application deployment
#
# Dependencies:
#   - kubectl v1.28+
#   - aws-cli v2.0+
#   - eksctl v0.142+
#   - helm v3.12+
#   - jq v1.6+

# Exit on error and handle pipeline failures
set -e
set -o pipefail

# Global variables and default values
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}/../terraform"
KUBERNETES_VERSION="1.28"
ENVIRONMENT="dev"
ENABLE_CLUSTER_AUTOSCALER=true
ENABLE_METRICS_SERVER=true
ENABLE_AWS_LB_CONTROLLER=true
ENABLE_EBS_CSI_DRIVER=true
ENABLE_EFS_CSI_DRIVER=false
ENABLE_EXTERNAL_DNS=false
ENABLE_CERT_MANAGER=false
DRY_RUN=false

# Node group definitions
declare -A SYSTEM_NODE_GROUP=([instance_types]="m6i.large" [desired_size]=3 [min_size]=3 [max_size]=5 [labels]="role=system")
declare -A APP_NODE_GROUP=([instance_types]="c6i.2xlarge" [desired_size]=4 [min_size]=4 [max_size]=20 [labels]="role=application")
declare -A DATA_NODE_GROUP=([instance_types]="r6i.2xlarge" [desired_size]=2 [min_size]=2 [max_size]=10 [labels]="role=data-processing")
declare -A ML_NODE_GROUP=([instance_types]="g5.xlarge" [desired_size]=1 [min_size]=1 [max_size]=5 [labels]="role=ml-inference")

# Helper functions
function log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] - INFO: $1"
}

function log_error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] - ERROR: $1" >&2
}

function log_success() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] - SUCCESS: $1"
}

function usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Initialize and configure an EKS cluster for the Freight Optimization Platform"
    echo
    echo "Options:"
    echo "  --environment ENV             Deployment environment (dev, staging, prod) (default: dev)"
    echo "  --cluster-name NAME           Name of the EKS cluster (required)"
    echo "  --region REGION               AWS region (default: us-west-2)"
    echo "  --k8s-version VERSION         Kubernetes version (default: 1.28)"
    echo "  --vpc-id VPC_ID               ID of the VPC to use (required)"
    echo "  --subnet-ids ID1,ID2,ID3      Comma-separated list of subnet IDs (required)"
    echo "  --domain-filter DOMAIN        Domain filter for ExternalDNS (required if --enable-external-dns is set)"
    echo "  --disable-cluster-autoscaler   Disable Cluster Autoscaler installation (enabled by default)"
    echo "  --disable-metrics-server       Disable Metrics Server installation (enabled by default)"
    echo "  --disable-aws-lb-controller    Disable AWS Load Balancer Controller installation (enabled by default)"
    echo "  --disable-ebs-csi-driver       Disable EBS CSI Driver installation (enabled by default)"
    echo "  --enable-efs-csi-driver        Enable EFS CSI Driver installation (disabled by default)"
    echo "  --enable-external-dns          Enable ExternalDNS installation (disabled by default)"
    echo "  --enable-cert-manager          Enable cert-manager installation (disabled by default)"
    echo "  --dry-run                      Print commands without executing them"
    echo "  --help                         Display this help message and exit"
}

# Cleanup function
function cleanup() {
    if [ $? -ne 0 ]; then
        log_error "An error occurred during execution."
        if [ -n "$CLUSTER_NAME" ] && [ -n "$REGION" ]; then
            log "Performing cleanup..."
            cleanup_on_failure "$CLUSTER_NAME" "$REGION"
        fi
    fi
}

# Set up trap for cleanup
trap cleanup EXIT
trap 'log_error "Script interrupted."; exit 1' INT TERM

# Function to check prerequisites
function check_prerequisites() {
    log "Checking prerequisites..."
    
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
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install it and try again."
        return 1
    fi
    
    # Check eksctl
    if ! command -v eksctl &> /dev/null; then
        log_error "eksctl is not installed. Please install it and try again."
        return 1
    fi
    
    # Check helm
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed. Please install it and try again."
        return 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed. Please install it and try again."
        return 1
    }
    
    # Verify AWS CLI is configured
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI is not properly configured. Please configure it with appropriate credentials."
        return 1
    fi
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
    log "Using AWS account: ${AWS_ACCOUNT_ID}"
    
    log "All prerequisites are met."
    return 0
}

# Function to parse arguments
function parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --cluster-name)
                CLUSTER_NAME="$2"
                shift 2
                ;;
            --region)
                REGION="$2"
                shift 2
                ;;
            --k8s-version)
                KUBERNETES_VERSION="$2"
                shift 2
                ;;
            --vpc-id)
                VPC_ID="$2"
                shift 2
                ;;
            --subnet-ids)
                SUBNET_IDS="$2"
                shift 2
                ;;
            --domain-filter)
                DOMAIN_FILTER="$2"
                shift 2
                ;;
            --disable-cluster-autoscaler)
                ENABLE_CLUSTER_AUTOSCALER=false
                shift
                ;;
            --disable-metrics-server)
                ENABLE_METRICS_SERVER=false
                shift
                ;;
            --disable-aws-lb-controller)
                ENABLE_AWS_LB_CONTROLLER=false
                shift
                ;;
            --disable-ebs-csi-driver)
                ENABLE_EBS_CSI_DRIVER=false
                shift
                ;;
            --enable-efs-csi-driver)
                ENABLE_EFS_CSI_DRIVER=true
                shift
                ;;
            --enable-external-dns)
                ENABLE_EXTERNAL_DNS=true
                shift
                ;;
            --enable-cert-manager)
                ENABLE_CERT_MANAGER=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown argument: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    # Validate required arguments
    if [ -z "$CLUSTER_NAME" ]; then
        log_error "Cluster name is required. Please provide it with --cluster-name."
        usage
        exit 1
    fi
    
    if [ -z "$REGION" ]; then
        REGION="us-west-2"
        log "Region not specified, using default: ${REGION}"
    fi
    
    if [ -z "$VPC_ID" ]; then
        log_error "VPC ID is required. Please provide it with --vpc-id."
        usage
        exit 1
    fi
    
    if [ -z "$SUBNET_IDS" ]; then
        log_error "Subnet IDs are required. Please provide them with --subnet-ids."
        usage
        exit 1
    fi
    
    if [ "$ENABLE_EXTERNAL_DNS" = true ] && [ -z "$DOMAIN_FILTER" ]; then
        log_error "Domain filter is required when ExternalDNS is enabled. Please provide it with --domain-filter."
        usage
        exit 1
    fi
    
    # Set KUBECONFIG path
    KUBECONFIG_PATH="${SCRIPT_DIR}/${CLUSTER_NAME}-kubeconfig"
    
    # Export variables for child processes
    export KUBECONFIG="${KUBECONFIG_PATH}"
    export AWS_REGION="${REGION}"
    
    # Log configuration
    log "Using the following configuration:"
    log "  Environment: ${ENVIRONMENT}"
    log "  Cluster Name: ${CLUSTER_NAME}"
    log "  Region: ${REGION}"
    log "  Kubernetes Version: ${KUBERNETES_VERSION}"
    log "  VPC ID: ${VPC_ID}"
    log "  Subnet IDs: ${SUBNET_IDS}"
    if [ "$ENABLE_EXTERNAL_DNS" = true ]; then
        log "  Domain Filter: ${DOMAIN_FILTER}"
    fi
    log "  Cluster Autoscaler: $([ "$ENABLE_CLUSTER_AUTOSCALER" = true ] && echo "Enabled" || echo "Disabled")"
    log "  Metrics Server: $([ "$ENABLE_METRICS_SERVER" = true ] && echo "Enabled" || echo "Disabled")"
    log "  AWS Load Balancer Controller: $([ "$ENABLE_AWS_LB_CONTROLLER" = true ] && echo "Enabled" || echo "Disabled")"
    log "  EBS CSI Driver: $([ "$ENABLE_EBS_CSI_DRIVER" = true ] && echo "Enabled" || echo "Disabled")"
    log "  EFS CSI Driver: $([ "$ENABLE_EFS_CSI_DRIVER" = true ] && echo "Enabled" || echo "Disabled")"
    log "  ExternalDNS: $([ "$ENABLE_EXTERNAL_DNS" = true ] && echo "Enabled" || echo "Disabled")"
    log "  cert-manager: $([ "$ENABLE_CERT_MANAGER" = true ] && echo "Enabled" || echo "Disabled")"
    log "  Dry Run: $([ "$DRY_RUN" = true ] && echo "Yes" || echo "No")"
}

# Function to create EKS cluster
function create_eks_cluster() {
    local cluster_name="$1"
    local region="$2"
    local kubernetes_version="$3"
    local vpc_id="$4"
    local subnet_ids="$5"
    local node_groups="$6"
    
    log "Creating/updating EKS cluster ${cluster_name} in region ${region}..."
    
    # Check if cluster already exists
    if aws eks describe-cluster --name "${cluster_name}" --region "${region}" &> /dev/null; then
        log "Cluster ${cluster_name} already exists. Updating configuration..."
        local cluster_exists=true
    else
        log "Cluster ${cluster_name} does not exist. Creating new cluster..."
        local cluster_exists=false
    fi
    
    # Convert subnet IDs to array
    IFS=',' read -r -a subnet_ids_array <<< "${subnet_ids}"
    
    # Create cluster using eksctl
    local config_file="${SCRIPT_DIR}/${cluster_name}-eksctl-config.yaml"
    
    cat > "${config_file}" << EOF
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: ${cluster_name}
  region: ${region}
  version: "${kubernetes_version}"
  tags:
    environment: ${ENVIRONMENT}
    managed-by: eksctl
    project: freight-optimization-platform

vpc:
  id: "${vpc_id}"
  subnets:
    private:
EOF

    # Add subnet IDs to the config file
    for subnet_id in "${subnet_ids_array[@]}"; do
        echo "      ${subnet_id}: { id: ${subnet_id} }" >> "${config_file}"
    done
    
    # Add node groups to the config file
    cat >> "${config_file}" << EOF
nodeGroups:
  - name: system
    instanceTypes: ["${SYSTEM_NODE_GROUP[instance_types]}"]
    desiredCapacity: ${SYSTEM_NODE_GROUP[desired_size]}
    minSize: ${SYSTEM_NODE_GROUP[min_size]}
    maxSize: ${SYSTEM_NODE_GROUP[max_size]}
    labels:
      ${SYSTEM_NODE_GROUP[labels]}
    tags:
      k8s.io/cluster-autoscaler/enabled: "true"
      k8s.io/cluster-autoscaler/${cluster_name}: "owned"
    iam:
      withAddonPolicies:
        autoScaler: true
        albIngress: true
        cloudWatch: true
        ebs: true
    privateNetworking: true
    
  - name: application
    instanceTypes: ["${APP_NODE_GROUP[instance_types]}"]
    desiredCapacity: ${APP_NODE_GROUP[desired_size]}
    minSize: ${APP_NODE_GROUP[min_size]}
    maxSize: ${APP_NODE_GROUP[max_size]}
    labels:
      ${APP_NODE_GROUP[labels]}
    tags:
      k8s.io/cluster-autoscaler/enabled: "true"
      k8s.io/cluster-autoscaler/${cluster_name}: "owned"
    iam:
      withAddonPolicies:
        autoScaler: true
        albIngress: true
        cloudWatch: true
        ebs: true
    privateNetworking: true
    
  - name: data-processing
    instanceTypes: ["${DATA_NODE_GROUP[instance_types]}"]
    desiredCapacity: ${DATA_NODE_GROUP[desired_size]}
    minSize: ${DATA_NODE_GROUP[min_size]}
    maxSize: ${DATA_NODE_GROUP[max_size]}
    labels:
      ${DATA_NODE_GROUP[labels]}
    tags:
      k8s.io/cluster-autoscaler/enabled: "true"
      k8s.io/cluster-autoscaler/${cluster_name}: "owned"
    iam:
      withAddonPolicies:
        autoScaler: true
        cloudWatch: true
        ebs: true
    privateNetworking: true
    
  - name: ml-inference
    instanceTypes: ["${ML_NODE_GROUP[instance_types]}"]
    desiredCapacity: ${ML_NODE_GROUP[desired_size]}
    minSize: ${ML_NODE_GROUP[min_size]}
    maxSize: ${ML_NODE_GROUP[max_size]}
    labels:
      ${ML_NODE_GROUP[labels]}
    tags:
      k8s.io/cluster-autoscaler/enabled: "true"
      k8s.io/cluster-autoscaler/${cluster_name}: "owned"
    iam:
      withAddonPolicies:
        autoScaler: true
        cloudWatch: true
        ebs: true
    privateNetworking: true

iam:
  withOIDC: true
  serviceAccounts:
  - metadata:
      name: aws-load-balancer-controller
      namespace: kube-system
    wellKnownPolicies:
      awsLoadBalancerController: true
  - metadata:
      name: ebs-csi-controller-sa
      namespace: kube-system
    wellKnownPolicies:
      ebsCSIController: true
  - metadata:
      name: cluster-autoscaler
      namespace: kube-system
    wellKnownPolicies:
      autoScaler: true
  - metadata:
      name: external-dns
      namespace: kube-system
    wellKnownPolicies:
      externalDNS: true

addons:
- name: vpc-cni
  version: latest
- name: coredns
  version: latest
- name: kube-proxy
  version: latest
EOF

    # Create or update the cluster
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would create/update EKS cluster using config: ${config_file}"
        cat "${config_file}"
    else
        if [ "$cluster_exists" = true ]; then
            eksctl upgrade cluster --name="${cluster_name}" --region="${region}" --approve
            eksctl update cluster --config-file="${config_file}"
        else
            eksctl create cluster --config-file="${config_file}"
        fi
    fi
    
    log "EKS cluster ${cluster_name} has been configured successfully."
    return 0
}

# Function to configure kubectl
function configure_kubectl() {
    local cluster_name="$1"
    local region="$2"
    
    log "Configuring kubectl to use EKS cluster ${cluster_name}..."
    
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would configure kubectl with: aws eks update-kubeconfig --name ${cluster_name} --region ${region} --kubeconfig ${KUBECONFIG_PATH}"
    else
        aws eks update-kubeconfig --name "${cluster_name}" --region "${region}" --kubeconfig "${KUBECONFIG_PATH}"
        
        # Verify kubectl configuration
        kubectl cluster-info
        
        # Verify connectivity to the cluster
        kubectl get nodes
    fi
    
    log "kubectl has been configured to use EKS cluster ${cluster_name}."
    return 0
}

# Function to install Cluster Autoscaler
function install_cluster_autoscaler() {
    local cluster_name="$1"
    local region="$2"
    
    log "Installing Cluster Autoscaler..."
    
    # Add Helm repository
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would add Helm repository: helm repo add autoscaler https://kubernetes.github.io/autoscaler"
    else
        helm repo add autoscaler https://kubernetes.github.io/autoscaler
        helm repo update
    fi
    
    # Prepare values for Cluster Autoscaler
    local values_file="${SCRIPT_DIR}/${cluster_name}-cluster-autoscaler-values.yaml"
    
    cat > "${values_file}" << EOF
autoDiscovery:
  clusterName: ${cluster_name}

awsRegion: ${region}

rbac:
  create: true
  serviceAccount:
    create: true
    name: cluster-autoscaler
    annotations:
      eks.amazonaws.com/role-arn: arn:aws:iam::${AWS_ACCOUNT_ID}:role/${cluster_name}-cluster-autoscaler

extraArgs:
  scale-down-delay-after-add: 5m
  scale-down-unneeded-time: 5m
  scan-interval: 10s
  v: 4
EOF

    # Install Cluster Autoscaler
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would install Cluster Autoscaler using values: ${values_file}"
        cat "${values_file}"
    else
        helm upgrade --install cluster-autoscaler autoscaler/cluster-autoscaler \
            --namespace kube-system \
            --values "${values_file}" \
            --version 9.29.0
        
        # Verify Cluster Autoscaler is running
        kubectl wait --for=condition=available --timeout=300s deployment/cluster-autoscaler -n kube-system
    fi
    
    log "Cluster Autoscaler has been installed successfully."
    return 0
}

# Function to install Metrics Server
function install_metrics_server() {
    log "Installing Metrics Server..."
    
    # Add Helm repository
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would add Helm repository: helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/"
    else
        helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
        helm repo update
    fi
    
    # Prepare values for Metrics Server
    local values_file="${SCRIPT_DIR}/metrics-server-values.yaml"
    
    cat > "${values_file}" << EOF
args:
  - --kubelet-preferred-address-types=InternalIP
  - --kubelet-use-node-status-port
  - --metric-resolution=15s
EOF

    # Install Metrics Server
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would install Metrics Server using values: ${values_file}"
        cat "${values_file}"
    else
        helm upgrade --install metrics-server metrics-server/metrics-server \
            --namespace kube-system \
            --values "${values_file}" \
            --version 3.10.0
        
        # Verify Metrics Server is running
        kubectl wait --for=condition=available --timeout=300s deployment/metrics-server -n kube-system
    fi
    
    log "Metrics Server has been installed successfully."
    return 0
}

# Function to install AWS Load Balancer Controller
function install_aws_lb_controller() {
    local cluster_name="$1"
    local region="$2"
    local vpc_id="$3"
    
    log "Installing AWS Load Balancer Controller..."
    
    # Create IAM policy if it doesn't exist
    local policy_name="${cluster_name}-AWSLoadBalancerControllerIAMPolicy"
    local policy_arn=""
    
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would create IAM policy for AWS Load Balancer Controller"
        policy_arn="arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${policy_name}"
    else
        # Check if policy already exists
        if aws iam get-policy --policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${policy_name}" 2>/dev/null; then
            log "IAM policy ${policy_name} already exists."
            policy_arn="arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${policy_name}"
        else
            # Download the policy document
            curl -o "${SCRIPT_DIR}/iam-policy.json" https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.5.4/docs/install/iam_policy.json
            
            # Create the policy
            policy_arn=$(aws iam create-policy \
                --policy-name "${policy_name}" \
                --policy-document file://"${SCRIPT_DIR}/iam-policy.json" \
                --query 'Policy.Arn' --output text)
                
            log "Created IAM policy: ${policy_arn}"
        fi
    fi
    
    # Create service account
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would create service account for AWS Load Balancer Controller"
    else
        eksctl create iamserviceaccount \
            --cluster="${cluster_name}" \
            --namespace=kube-system \
            --name=aws-load-balancer-controller \
            --attach-policy-arn="${policy_arn}" \
            --override-existing-serviceaccounts \
            --approve
    fi
    
    # Add Helm repository
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would add Helm repository: helm repo add eks https://aws.github.io/eks-charts"
    else
        helm repo add eks https://aws.github.io/eks-charts
        helm repo update
    fi
    
    # Prepare values for AWS Load Balancer Controller
    local values_file="${SCRIPT_DIR}/${cluster_name}-aws-lb-controller-values.yaml"
    
    cat > "${values_file}" << EOF
clusterName: ${cluster_name}
region: ${region}
vpcId: ${vpc_id}

serviceAccount:
  create: false
  name: aws-load-balancer-controller

podLabels:
  app: aws-load-balancer-controller

resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi
EOF

    # Install AWS Load Balancer Controller
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would install AWS Load Balancer Controller using values: ${values_file}"
        cat "${values_file}"
    else
        helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
            --namespace kube-system \
            --values "${values_file}" \
            --version 1.5.3
        
        # Verify AWS Load Balancer Controller is running
        kubectl wait --for=condition=available --timeout=300s deployment/aws-load-balancer-controller -n kube-system
    fi
    
    log "AWS Load Balancer Controller has been installed successfully."
    return 0
}

# Function to install EBS CSI Driver
function install_ebs_csi_driver() {
    local cluster_name="$1"
    local region="$2"
    
    log "Installing EBS CSI Driver..."
    
    # Create service account
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would create service account for EBS CSI Driver"
    else
        eksctl create iamserviceaccount \
            --cluster="${cluster_name}" \
            --namespace=kube-system \
            --name=ebs-csi-controller-sa \
            --attach-policy-arn=arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
            --override-existing-serviceaccounts \
            --approve
    fi
    
    # Add Helm repository
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would add Helm repository: helm repo add aws-ebs-csi-driver https://kubernetes-sigs.github.io/aws-ebs-csi-driver"
    else
        helm repo add aws-ebs-csi-driver https://kubernetes-sigs.github.io/aws-ebs-csi-driver
        helm repo update
    fi
    
    # Prepare values for EBS CSI Driver
    local values_file="${SCRIPT_DIR}/${cluster_name}-ebs-csi-driver-values.yaml"
    
    cat > "${values_file}" << EOF
controller:
  region: ${region}
  serviceAccount:
    create: false
    name: ebs-csi-controller-sa

storageClasses:
  - name: ebs-sc
    annotations:
      storageclass.kubernetes.io/is-default-class: "true"
    allowVolumeExpansion: true
    volumeBindingMode: WaitForFirstConsumer
    reclaimPolicy: Delete
    parameters:
      type: gp3
      encrypted: "true"
      fsType: ext4
EOF

    # Install EBS CSI Driver
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would install EBS CSI Driver using values: ${values_file}"
        cat "${values_file}"
    else
        helm upgrade --install aws-ebs-csi-driver aws-ebs-csi-driver/aws-ebs-csi-driver \
            --namespace kube-system \
            --values "${values_file}" \
            --version 2.23.0
        
        # Verify EBS CSI Driver is running
        kubectl wait --for=condition=available --timeout=300s deployment/ebs-csi-controller -n kube-system
    fi
    
    log "EBS CSI Driver has been installed successfully."
    return 0
}

# Function to install EFS CSI Driver
function install_efs_csi_driver() {
    local cluster_name="$1"
    local region="$2"
    
    log "Installing EFS CSI Driver..."
    
    # Create IAM policy for EFS CSI Driver
    local policy_name="${cluster_name}-AmazonEFSCSIDriverPolicy"
    local policy_arn=""
    
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would create IAM policy for EFS CSI Driver"
        policy_arn="arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${policy_name}"
    else
        # Check if policy already exists
        if aws iam get-policy --policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${policy_name}" 2>/dev/null; then
            log "IAM policy ${policy_name} already exists."
            policy_arn="arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${policy_name}"
        else
            # Create policy document
            cat > "${SCRIPT_DIR}/efs-policy.json" << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticfilesystem:DescribeAccessPoints",
        "elasticfilesystem:DescribeFileSystems",
        "elasticfilesystem:DescribeMountTargets",
        "elasticfilesystem:CreateAccessPoint",
        "elasticfilesystem:DeleteAccessPoint",
        "elasticfilesystem:TagResource"
      ],
      "Resource": "*"
    }
  ]
}
EOF
            
            # Create the policy
            policy_arn=$(aws iam create-policy \
                --policy-name "${policy_name}" \
                --policy-document file://"${SCRIPT_DIR}/efs-policy.json" \
                --query 'Policy.Arn' --output text)
                
            log "Created IAM policy: ${policy_arn}"
        fi
    fi
    
    # Create service account
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would create service account for EFS CSI Driver"
    else
        eksctl create iamserviceaccount \
            --cluster="${cluster_name}" \
            --namespace=kube-system \
            --name=efs-csi-controller-sa \
            --attach-policy-arn="${policy_arn}" \
            --override-existing-serviceaccounts \
            --approve
    fi
    
    # Add Helm repository
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would add Helm repository: helm repo add aws-efs-csi-driver https://kubernetes-sigs.github.io/aws-efs-csi-driver/"
    else
        helm repo add aws-efs-csi-driver https://kubernetes-sigs.github.io/aws-efs-csi-driver/
        helm repo update
    fi
    
    # Prepare values for EFS CSI Driver
    local values_file="${SCRIPT_DIR}/${cluster_name}-efs-csi-driver-values.yaml"
    
    cat > "${values_file}" << EOF
controller:
  serviceAccount:
    create: false
    name: efs-csi-controller-sa

storageClasses:
  - name: efs-sc
    parameters:
      provisioningMode: efs-ap
      fileSystemId: REPLACE_WITH_EFS_ID
      directoryPerms: "700"
EOF

    # Install EFS CSI Driver
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would install EFS CSI Driver using values: ${values_file}"
        cat "${values_file}"
        log "NOTE: Before using EFS storage, you need to create an EFS file system and update the fileSystemId in the storage class."
    else
        helm upgrade --install aws-efs-csi-driver aws-efs-csi-driver/aws-efs-csi-driver \
            --namespace kube-system \
            --values "${values_file}" \
            --version 2.4.8
        
        # Verify EFS CSI Driver is running
        kubectl wait --for=condition=available --timeout=300s deployment/efs-csi-controller -n kube-system
        
        log "NOTE: Before using EFS storage, you need to create an EFS file system and update the fileSystemId in the storage class."
    fi
    
    log "EFS CSI Driver has been installed successfully."
    return 0
}

# Function to install ExternalDNS
function install_external_dns() {
    local cluster_name="$1"
    local region="$2"
    local domain_filter="$3"
    
    log "Installing ExternalDNS..."
    
    # Create IAM policy for ExternalDNS
    local policy_name="${cluster_name}-ExternalDNSPolicy"
    local policy_arn=""
    
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would create IAM policy for ExternalDNS"
        policy_arn="arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${policy_name}"
    else
        # Check if policy already exists
        if aws iam get-policy --policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${policy_name}" 2>/dev/null; then
            log "IAM policy ${policy_name} already exists."
            policy_arn="arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${policy_name}"
        else
            # Create policy document
            cat > "${SCRIPT_DIR}/external-dns-policy.json" << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "route53:ChangeResourceRecordSets"
      ],
      "Resource": [
        "arn:aws:route53:::hostedzone/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:ListHostedZones",
        "route53:ListResourceRecordSets"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}
EOF
            
            # Create the policy
            policy_arn=$(aws iam create-policy \
                --policy-name "${policy_name}" \
                --policy-document file://"${SCRIPT_DIR}/external-dns-policy.json" \
                --query 'Policy.Arn' --output text)
                
            log "Created IAM policy: ${policy_arn}"
        fi
    fi
    
    # Create service account
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would create service account for ExternalDNS"
    else
        eksctl create iamserviceaccount \
            --cluster="${cluster_name}" \
            --namespace=kube-system \
            --name=external-dns \
            --attach-policy-arn="${policy_arn}" \
            --override-existing-serviceaccounts \
            --approve
    fi
    
    # Add Helm repository
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would add Helm repository: helm repo add external-dns https://kubernetes-sigs.github.io/external-dns/"
    else
        helm repo add external-dns https://kubernetes-sigs.github.io/external-dns/
        helm repo update
    fi
    
    # Prepare values for ExternalDNS
    local values_file="${SCRIPT_DIR}/${cluster_name}-external-dns-values.yaml"
    
    cat > "${values_file}" << EOF
provider: aws
aws:
  region: ${region}
domainFilters:
  - ${domain_filter}
policy: sync
serviceAccount:
  create: false
  name: external-dns
txtOwnerId: ${cluster_name}
EOF

    # Install ExternalDNS
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would install ExternalDNS using values: ${values_file}"
        cat "${values_file}"
    else
        helm upgrade --install external-dns external-dns/external-dns \
            --namespace kube-system \
            --values "${values_file}" \
            --version 1.13.0
        
        # Verify ExternalDNS is running
        kubectl wait --for=condition=available --timeout=300s deployment/external-dns -n kube-system
    fi
    
    log "ExternalDNS has been installed successfully."
    return 0
}

# Function to install cert-manager
function install_cert_manager() {
    local cluster_name="$1"
    local region="$2"
    
    log "Installing cert-manager..."
    
    # Add Helm repository
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would add Helm repository: helm repo add jetstack https://charts.jetstack.io"
    else
        helm repo add jetstack https://charts.jetstack.io
        helm repo update
    fi
    
    # Prepare values for cert-manager
    local values_file="${SCRIPT_DIR}/${cluster_name}-cert-manager-values.yaml"
    
    cat > "${values_file}" << EOF
installCRDs: true
global:
  leaderElection:
    namespace: kube-system
prometheus:
  enabled: false
EOF

    # Install cert-manager
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would install cert-manager using values: ${values_file}"
        cat "${values_file}"
    else
        helm upgrade --install cert-manager jetstack/cert-manager \
            --namespace kube-system \
            --values "${values_file}" \
            --version v1.12.3
        
        # Wait for cert-manager to be ready
        kubectl wait --for=condition=available --timeout=300s deployment/cert-manager -n kube-system
        kubectl wait --for=condition=available --timeout=300s deployment/cert-manager-webhook -n kube-system
        
        # Create ClusterIssuer for Let's Encrypt
        cat > "${SCRIPT_DIR}/letsencrypt-issuer.yaml" << EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@${domain_filter:-example.com}
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: alb
EOF

        kubectl apply -f "${SCRIPT_DIR}/letsencrypt-issuer.yaml"
    fi
    
    log "cert-manager has been installed successfully."
    return 0
}

# Function to create namespaces
function create_namespaces() {
    log "Creating namespaces..."
    
    # Define namespaces
    local namespaces=(
        "freight-system"
        "freight-monitoring"
        "freight-logging"
    )
    
    for ns in "${namespaces[@]}"; do
        if [ "$DRY_RUN" = true ]; then
            log "DRY RUN: Would create namespace: ${ns}"
        else
            # Check if namespace exists
            if ! kubectl get namespace "${ns}" &> /dev/null; then
                kubectl create namespace "${ns}"
                log "Created namespace: ${ns}"
            else
                log "Namespace ${ns} already exists."
            fi
            
            # Label namespace
            kubectl label namespace "${ns}" environment=${ENVIRONMENT} --overwrite
        fi
    done
    
    # Create resource quotas for namespaces
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would create resource quotas for namespaces"
    else
        for ns in "${namespaces[@]}"; do
            cat > "${SCRIPT_DIR}/${ns}-quota.yaml" << EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ${ns}-quota
  namespace: ${ns}
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 40Gi
    limits.cpu: "40"
    limits.memory: 80Gi
    pods: "100"
    services: "50"
    persistentvolumeclaims: "50"
EOF

            kubectl apply -f "${SCRIPT_DIR}/${ns}-quota.yaml"
            log "Created resource quota for namespace: ${ns}"
        done
    fi
    
    log "Namespaces have been created and configured successfully."
    return 0
}

# Function to configure RBAC
function configure_rbac() {
    log "Configuring RBAC..."
    
    # Create ClusterRoles
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would create ClusterRoles for different access levels"
    else
        # Admin Role
        cat > "${SCRIPT_DIR}/admin-role.yaml" << EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: freight-admin
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
EOF

        # Developer Role
        cat > "${SCRIPT_DIR}/developer-role.yaml" << EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: freight-developer
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets", "persistentvolumeclaims"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets", "daemonsets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["batch"]
  resources: ["jobs", "cronjobs"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["nodes", "namespaces"]
  verbs: ["get", "list", "watch"]
EOF

        # Viewer Role
        cat > "${SCRIPT_DIR}/viewer-role.yaml" << EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: freight-viewer
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "persistentvolumeclaims"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets", "daemonsets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["batch"]
  resources: ["jobs", "cronjobs"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses"]
  verbs: ["get", "list", "watch"]
EOF

        # Apply RBAC configurations
        kubectl apply -f "${SCRIPT_DIR}/admin-role.yaml"
        kubectl apply -f "${SCRIPT_DIR}/developer-role.yaml"
        kubectl apply -f "${SCRIPT_DIR}/viewer-role.yaml"
        
        log "Created RBAC ClusterRoles: freight-admin, freight-developer, freight-viewer"
    fi
    
    # Create default service account for CI/CD
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would create service account for CI/CD"
    else
        cat > "${SCRIPT_DIR}/cicd-service-account.yaml" << EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: freight-cicd
  namespace: freight-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: freight-cicd-admin
subjects:
- kind: ServiceAccount
  name: freight-cicd
  namespace: freight-system
roleRef:
  kind: ClusterRole
  name: freight-admin
  apiGroup: rbac.authorization.k8s.io
EOF

        kubectl apply -f "${SCRIPT_DIR}/cicd-service-account.yaml"
        log "Created CI/CD service account and role binding"
    fi
    
    log "RBAC has been configured successfully."
    return 0
}

# Function to configure networking
function configure_networking() {
    log "Configuring networking components..."
    
    # Configure CoreDNS settings if needed
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would configure CoreDNS settings"
    else
        # No additional CoreDNS configuration needed at this time
        log "Using default CoreDNS configuration."
    fi
    
    # Configure default network policies
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would configure default network policies"
    else
        # Default deny policy for system namespace
        cat > "${SCRIPT_DIR}/default-network-policy.yaml" << EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: freight-system
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-same-namespace
  namespace: freight-system
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector: {}
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-egress-dns
  namespace: freight-system
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
EOF

        kubectl apply -f "${SCRIPT_DIR}/default-network-policy.yaml"
        log "Applied default network policies"
    fi
    
    log "Networking components have been configured successfully."
    return 0
}

# Function to configure logging
function configure_logging() {
    log "Configuring cluster logging..."
    
    # Enable control plane logging
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would enable control plane logging"
    else
        aws eks update-cluster-config \
            --region "${REGION}" \
            --name "${CLUSTER_NAME}" \
            --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'
            
        log "Enabled control plane logging for the EKS cluster"
    fi
    
    log "Logging has been configured successfully."
    return 0
}

# Function to verify cluster
function verify_cluster() {
    log "Verifying cluster configuration..."
    
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would verify cluster configuration"
    else
        # Check node status
        log "Checking node status..."
        kubectl get nodes
        
        # Check core components
        log "Checking core components..."
        kubectl get pods -n kube-system
        
        # Check storage classes
        log "Checking storage classes..."
        kubectl get storageclass
        
        # Check installed services
        log "Checking installed services..."
        helm list --all-namespaces
        
        # Check basic connectivity
        log "Testing basic connectivity..."
        kubectl run test-nginx --image=nginx --restart=Never
        kubectl wait --for=condition=ready pod/test-nginx --timeout=60s
        kubectl delete pod test-nginx
    fi
    
    log "Cluster verification completed successfully."
    return 0
}

# Function to perform cleanup on failure
function cleanup_on_failure() {
    local cluster_name="$1"
    local region="$2"
    
    log "Performing cleanup after failure..."
    
    # This function would implement cleanup steps based on what was created before failure
    # For now, we'll just log that cleanup would happen
    log "Cleanup would remove created resources if needed."
    
    # In a real implementation, you might want to:
    # 1. Remove Helm releases
    # 2. Remove IAM roles and policies
    # 3. Optionally delete the EKS cluster
    
    log "Cleanup completed."
}

# Main function
function main() {
    # Parse arguments
    parse_arguments "$@"
    
    # Check prerequisites
    check_prerequisites
    
    # Create or update EKS cluster
    create_eks_cluster "$CLUSTER_NAME" "$REGION" "$KUBERNETES_VERSION" "$VPC_ID" "$SUBNET_IDS" "$NODE_GROUPS"
    
    # Configure kubectl
    configure_kubectl "$CLUSTER_NAME" "$REGION"
    
    # Install cluster components based on flags
    if [ "$ENABLE_CLUSTER_AUTOSCALER" = true ]; then
        install_cluster_autoscaler "$CLUSTER_NAME" "$REGION"
    fi
    
    if [ "$ENABLE_METRICS_SERVER" = true ]; then
        install_metrics_server
    fi
    
    if [ "$ENABLE_AWS_LB_CONTROLLER" = true ]; then
        install_aws_lb_controller "$CLUSTER_NAME" "$REGION" "$VPC_ID"
    fi
    
    if [ "$ENABLE_EBS_CSI_DRIVER" = true ]; then
        install_ebs_csi_driver "$CLUSTER_NAME" "$REGION"
    fi
    
    if [ "$ENABLE_EFS_CSI_DRIVER" = true ]; then
        install_efs_csi_driver "$CLUSTER_NAME" "$REGION"
    fi
    
    if [ "$ENABLE_EXTERNAL_DNS" = true ]; then
        install_external_dns "$CLUSTER_NAME" "$REGION" "$DOMAIN_FILTER"
    fi
    
    if [ "$ENABLE_CERT_MANAGER" = true ]; then
        install_cert_manager "$CLUSTER_NAME" "$REGION"
    fi
    
    # Create and configure namespaces
    create_namespaces
    
    # Configure RBAC
    configure_rbac
    
    # Configure networking
    configure_networking
    
    # Configure logging
    configure_logging
    
    # Verify cluster setup
    verify_cluster
    
    # Print success message
    log_success "EKS cluster '${CLUSTER_NAME}' has been successfully initialized and configured."
    log "To use this cluster, run: export KUBECONFIG=${KUBECONFIG_PATH}"
    
    return 0
}

# Main script execution
main "$@"