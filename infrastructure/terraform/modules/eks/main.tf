# EKS Cluster Module for AI-driven Freight Optimization Platform
# hashicorp/aws ~> 4.0

# Get current AWS region and account information
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# Define IAM policy document for EKS cluster role
data "aws_iam_policy_document" "cluster_assume_role_policy" {
  statement {
    effect = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

# Define IAM policy document for EKS node group role
data "aws_iam_policy_document" "node_assume_role_policy" {
  statement {
    effect = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

# Define local variables
locals {
  common_tags = merge(
    var.tags,
    {
      "kubernetes.io/cluster/${var.cluster_name}" = "owned"
    }
  )
}

# Create IAM role for EKS cluster
resource "aws_iam_role" "cluster_role" {
  name                 = "${var.cluster_name}-cluster-role"
  assume_role_policy   = data.aws_iam_policy_document.cluster_assume_role_policy.json
  tags                 = local.common_tags
}

# Attach required policies to the cluster role
resource "aws_iam_role_policy_attachment" "cluster_policy" {
  role       = aws_iam_role.cluster_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_role_policy_attachment" "vpc_resource_controller" {
  role       = aws_iam_role.cluster_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
}

# Create security group for EKS cluster
resource "aws_security_group" "cluster_sg" {
  name        = "${var.cluster_name}-cluster-sg"
  description = "Security group for the EKS cluster"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = local.common_tags
}

# Allow nodes to communicate with each other
resource "aws_security_group_rule" "cluster_ingress_self" {
  security_group_id = aws_security_group.cluster_sg.id
  type              = "ingress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  self              = true
  description       = "Allow nodes to communicate with each other"
}

# Create CloudWatch log group for EKS cluster logs
resource "aws_cloudwatch_log_group" "cluster_logs" {
  name              = "/aws/eks/${var.cluster_name}/cluster"
  retention_in_days = 30
  tags              = local.common_tags
}

# Create the EKS cluster
resource "aws_eks_cluster" "this" {
  name     = var.cluster_name
  role_arn = aws_iam_role.cluster_role.arn
  version  = var.kubernetes_version

  enabled_cluster_log_types = var.cluster_log_types

  vpc_config {
    subnet_ids              = var.subnet_ids
    security_group_ids      = [aws_security_group.cluster_sg.id]
    endpoint_private_access = var.endpoint_private_access
    endpoint_public_access  = var.endpoint_public_access
    public_access_cidrs     = var.public_access_cidrs
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.cluster_policy,
    aws_iam_role_policy_attachment.vpc_resource_controller,
    aws_cloudwatch_log_group.cluster_logs
  ]
}

# Create IAM role for EKS node groups
resource "aws_iam_role" "node_role" {
  name                 = "${var.cluster_name}-node-role"
  assume_role_policy   = data.aws_iam_policy_document.node_assume_role_policy.json
  tags                 = local.common_tags
}

# Attach required policies to the node role
resource "aws_iam_role_policy_attachment" "node_policy" {
  role       = aws_iam_role.node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "cni_policy" {
  role       = aws_iam_role.node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "container_registry_policy" {
  role       = aws_iam_role.node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Create EKS node groups for different workload types
resource "aws_eks_node_group" "this" {
  for_each        = var.node_groups
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${var.cluster_name}-${each.key}"
  node_role_arn   = aws_iam_role.node_role.arn
  subnet_ids      = var.subnet_ids
  instance_types  = each.value.instance_types

  scaling_config {
    desired_size = each.value.desired_size
    min_size     = each.value.min_size
    max_size     = each.value.max_size
  }

  labels = each.value.labels
  tags   = merge(local.common_tags, each.value.tags)

  update_config {
    max_unavailable = 1
  }

  depends_on = [
    aws_iam_role_policy_attachment.node_policy,
    aws_iam_role_policy_attachment.cni_policy,
    aws_iam_role_policy_attachment.container_registry_policy
  ]
}

# Allow worker Kubelets and pods to receive communication from the cluster control plane
resource "aws_security_group_rule" "node_ingress_cluster" {
  security_group_id = aws_security_group.cluster_sg.id
  type              = "ingress"
  from_port         = 1025
  to_port           = 65535
  protocol          = "tcp"
  cidr_blocks       = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  description       = "Allow worker nodes to receive communication from the cluster control plane"
}

# Allow pods to communicate with the cluster API Server
resource "aws_security_group_rule" "cluster_ingress_https" {
  security_group_id = aws_security_group.cluster_sg.id
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  description       = "Allow pods to communicate with the cluster API Server"
}

# Generate kubeconfig template for connecting to the cluster
data "template_file" "kubeconfig" {
  template = file("${path.module}/templates/kubeconfig.tpl")
  vars = {
    cluster_name     = aws_eks_cluster.this.name
    cluster_endpoint = aws_eks_cluster.this.endpoint
    cluster_ca_data  = aws_eks_cluster.this.certificate_authority[0].data
    region           = data.aws_region.current.name
  }
}

# Output values for use by other modules
output "cluster_id" {
  description = "The ID of the EKS cluster"
  value       = aws_eks_cluster.this.id
}

output "cluster_arn" {
  description = "The ARN of the EKS cluster"
  value       = aws_eks_cluster.this.arn
}

output "cluster_endpoint" {
  description = "The endpoint for the Kubernetes API server"
  value       = aws_eks_cluster.this.endpoint
}

output "cluster_certificate_authority_data" {
  description = "The certificate authority data for the cluster"
  value       = aws_eks_cluster.this.certificate_authority[0].data
}

output "cluster_security_group_id" {
  description = "The security group ID attached to the EKS cluster"
  value       = aws_security_group.cluster_sg.id
}

output "cluster_iam_role_arn" {
  description = "The ARN of the IAM role used by the EKS cluster"
  value       = aws_iam_role.cluster_role.arn
}

output "node_group_arns" {
  description = "The ARNs of the EKS node groups"
  value       = { for k, v in aws_eks_node_group.this : k => v.arn }
}

output "node_group_ids" {
  description = "The IDs of the EKS node groups"
  value       = { for k, v in aws_eks_node_group.this : k => v.id }
}

output "node_group_status" {
  description = "The status of the EKS node groups"
  value       = { for k, v in aws_eks_node_group.this : k => v.status }
}

output "node_iam_role_arn" {
  description = "The ARN of the IAM role used by the EKS node groups"
  value       = aws_iam_role.node_role.arn
}

output "kubeconfig" {
  description = "Kubernetes configuration for connecting to the cluster"
  value       = data.template_file.kubeconfig.rendered
}