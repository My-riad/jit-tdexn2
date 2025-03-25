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
  sensitive   = true
}