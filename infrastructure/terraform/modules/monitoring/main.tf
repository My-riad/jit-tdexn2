# Provider configurations
provider "aws" {
  region = data.aws_region.current.name
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.this.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.this.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.this.token
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.this.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.this.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.this.token
  }
}

# Locals for common values and configurations
locals {
  monitoring_namespace = "monitoring"
  default_tags = {
    Name        = "${var.name}-monitoring"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Component   = "Monitoring"
  }
  merged_tags = merge(var.tags, local.default_tags)
  
  prometheus_config_path    = "${path.module}/templates/prometheus.yml"
  alertmanager_config_path  = "${path.module}/templates/alertmanager.yml"
  grafana_datasources_path  = "${path.module}/templates/datasources.yaml"
  grafana_dashboards_path   = "${path.module}/templates/dashboards"
}

# Data sources
data "aws_region" "current" {}

data "aws_eks_cluster" "this" {
  name = var.eks_cluster_name
}

data "aws_eks_cluster_auth" "this" {
  name = var.eks_cluster_name
}

#------------------------------------------------------------------------------
# CloudWatch Log Groups
#------------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "/freight-optimization/${var.environment}/application"
  retention_in_days = var.retention_in_days
  tags              = local.merged_tags
}

resource "aws_cloudwatch_log_group" "system_logs" {
  name              = "/freight-optimization/${var.environment}/system"
  retention_in_days = var.retention_in_days
  tags              = local.merged_tags
}

resource "aws_cloudwatch_log_group" "audit_logs" {
  name              = "/freight-optimization/${var.environment}/audit"
  retention_in_days = var.retention_in_days * 2 # Audit logs are kept longer
  tags              = local.merged_tags
}

#------------------------------------------------------------------------------
# CloudWatch Dashboards
#------------------------------------------------------------------------------
resource "aws_cloudwatch_dashboard" "system_overview" {
  dashboard_name = "FreightOptimization-${var.environment}-SystemOverview"
  dashboard_body = file("${path.module}/templates/dashboards/system_overview.json")
  tags           = local.merged_tags
}

resource "aws_cloudwatch_dashboard" "api_gateway" {
  dashboard_name = "FreightOptimization-${var.environment}-APIGateway"
  dashboard_body = file("${path.module}/templates/dashboards/api_gateway.json")
  tags           = local.merged_tags
}

resource "aws_cloudwatch_dashboard" "load_matching" {
  dashboard_name = "FreightOptimization-${var.environment}-LoadMatching"
  dashboard_body = file("${path.module}/templates/dashboards/load_matching.json")
  tags           = local.merged_tags
}

resource "aws_cloudwatch_dashboard" "optimization_engine" {
  dashboard_name = "FreightOptimization-${var.environment}-OptimizationEngine"
  dashboard_body = file("${path.module}/templates/dashboards/optimization_engine.json")
  tags           = local.merged_tags
}

#------------------------------------------------------------------------------
# CloudWatch Alarms
#------------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "high_cpu_utilization" {
  alarm_name          = "FreightOptimization-${var.environment}-HighCPUUtilization"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_utilization_threshold
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.monitoring_alerts.arn]
  ok_actions          = [aws_sns_topic.monitoring_alerts.arn]
  dimensions = {
    AutoScalingGroupName = "eks-${var.eks_cluster_name}-node-group"
  }
  tags = local.merged_tags
}

resource "aws_cloudwatch_metric_alarm" "high_memory_utilization" {
  alarm_name          = "FreightOptimization-${var.environment}-HighMemoryUtilization"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "CWAgent"
  period              = 300
  statistic           = "Average"
  threshold           = var.memory_utilization_threshold
  alarm_description   = "This metric monitors EC2 memory utilization"
  alarm_actions       = [aws_sns_topic.monitoring_alerts.arn]
  ok_actions          = [aws_sns_topic.monitoring_alerts.arn]
  dimensions = {
    AutoScalingGroupName = "eks-${var.eks_cluster_name}-node-group"
  }
  tags = local.merged_tags
}

resource "aws_cloudwatch_metric_alarm" "high_disk_utilization" {
  alarm_name          = "FreightOptimization-${var.environment}-HighDiskUtilization"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "DiskUtilization"
  namespace           = "CWAgent"
  period              = 300
  statistic           = "Average"
  threshold           = var.disk_utilization_threshold
  alarm_description   = "This metric monitors EC2 disk utilization"
  alarm_actions       = [aws_sns_topic.monitoring_alerts.arn]
  ok_actions          = [aws_sns_topic.monitoring_alerts.arn]
  dimensions = {
    AutoScalingGroupName = "eks-${var.eks_cluster_name}-node-group"
    Filesystem           = "/dev/xvda1"
    MountPath            = "/"
  }
  tags = local.merged_tags
}

#------------------------------------------------------------------------------
# SNS Topics and Subscriptions for Alerts
#------------------------------------------------------------------------------
resource "aws_sns_topic" "monitoring_alerts" {
  name = "freight-optimization-${var.environment}-monitoring-alerts"
  tags = local.merged_tags
}

resource "aws_sns_topic_subscription" "email_subscription" {
  topic_arn = aws_sns_topic.monitoring_alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_notification_email
}

#------------------------------------------------------------------------------
# Security Groups and IAM Roles
#------------------------------------------------------------------------------
resource "aws_security_group" "monitoring" {
  name        = "freight-optimization-${var.environment}-monitoring"
  description = "Security group for monitoring services"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 9090
    to_port         = 9090
    protocol        = "tcp"
    description     = "Prometheus"
    security_groups = []
  }

  ingress {
    from_port       = 9093
    to_port         = 9093
    protocol        = "tcp"
    description     = "Alertmanager"
    security_groups = []
  }

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    description     = "Grafana"
    security_groups = []
  }

  ingress {
    from_port       = 9100
    to_port         = 9100
    protocol        = "tcp"
    description     = "Node Exporter"
    security_groups = []
  }

  egress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    cidr_blocks     = ["0.0.0.0/0"]
    description     = "Allow all outbound traffic"
  }

  tags = local.merged_tags
}

resource "aws_iam_role" "monitoring" {
  name = "freight-optimization-${var.environment}-monitoring"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  tags = local.merged_tags
}

resource "aws_iam_policy" "monitoring" {
  name        = "freight-optimization-${var.environment}-monitoring"
  description = "Policy for monitoring services"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      }
    ]
  })
  tags = local.merged_tags
}

resource "aws_iam_role_policy_attachment" "monitoring_policy_attachment" {
  role       = aws_iam_role.monitoring.name
  policy_arn = aws_iam_policy.monitoring.arn
}

#------------------------------------------------------------------------------
# Kubernetes Namespace for Monitoring
#------------------------------------------------------------------------------
resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = local.monitoring_namespace
    labels = {
      name        = "monitoring"
      environment = var.environment
    }
  }
}

#------------------------------------------------------------------------------
# Helm Releases for Monitoring Stack
#------------------------------------------------------------------------------
resource "helm_release" "prometheus" {
  count            = var.enable_prometheus ? 1 : 0
  name             = "prometheus"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "prometheus"
  version          = "15.10.0"  # Using version 15.10.0 - version 2.41.0 of the actual Prometheus app
  namespace        = kubernetes_namespace.monitoring.metadata[0].name
  create_namespace = false
  wait             = true
  timeout          = 600

  values = [
    file("${path.module}/templates/prometheus-values.yaml")
  ]

  set {
    name  = "server.persistentVolume.size"
    value = var.prometheus_storage_size
  }

  set {
    name  = "server.retention"
    value = "${var.prometheus_retention_days}d"
  }

  set {
    name  = "alertmanager.persistentVolume.size"
    value = var.alertmanager_storage_size
  }

  set {
    name  = "server.global.scrape_interval"
    value = "15s"
  }

  set {
    name  = "server.global.evaluation_interval"
    value = "15s"
  }

  set {
    name  = "server.global.external_labels.environment"
    value = var.environment
  }

  depends_on = [kubernetes_namespace.monitoring]
}

resource "helm_release" "grafana" {
  count            = var.enable_grafana ? 1 : 0
  name             = "grafana"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "grafana"
  version          = "6.50.0"  # Using version 6.50.0 - version 9.4.7 of the actual Grafana app
  namespace        = kubernetes_namespace.monitoring.metadata[0].name
  create_namespace = false
  wait             = true
  timeout          = 300

  values = [
    file("${path.module}/templates/grafana-values.yaml")
  ]

  set {
    name  = "persistence.size"
    value = var.grafana_storage_size
  }

  set {
    name  = "adminPassword"
    value = var.grafana_admin_password
  }

  # Configure Prometheus as a datasource
  set {
    name  = "datasources.datasources\\.yaml.apiVersion"
    value = "1"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[0].name"
    value = "Prometheus"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[0].type"
    value = "prometheus"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[0].url"
    value = "http://prometheus-server:9090"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[0].access"
    value = "proxy"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[0].isDefault"
    value = "true"
  }

  depends_on = [kubernetes_namespace.monitoring, helm_release.prometheus]
}

resource "helm_release" "alertmanager" {
  count            = var.enable_alertmanager ? 1 : 0
  name             = "alertmanager"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "alertmanager"
  version          = "0.24.0"  # Using version 0.24.0 of the chart - version 0.25.0 of the actual Alertmanager app
  namespace        = kubernetes_namespace.monitoring.metadata[0].name
  create_namespace = false
  wait             = true
  timeout          = 300

  values = [
    file("${path.module}/templates/alertmanager-values.yaml")
  ]

  set {
    name  = "persistence.size"
    value = var.alertmanager_storage_size
  }

  # Configure alertmanager with basic email alerting
  set {
    name  = "config.global.smtp_smarthost"
    value = "smtp.example.com:587"
  }

  set {
    name  = "config.global.smtp_from"
    value = "alertmanager@freight-optimization.com"
  }

  set {
    name  = "config.receivers[0].name"
    value = "default-receiver"
  }

  set {
    name  = "config.receivers[0].email_configs[0].to"
    value = var.alarm_notification_email
  }

  set {
    name  = "config.route.group_by[0]"
    value = "alertname"
  }

  set {
    name  = "config.route.group_wait"
    value = "30s"
  }

  set {
    name  = "config.route.group_interval"
    value = "5m"
  }

  set {
    name  = "config.route.repeat_interval"
    value = "3h"
  }

  set {
    name  = "config.route.receiver"
    value = "default-receiver"
  }

  depends_on = [kubernetes_namespace.monitoring, helm_release.prometheus]
}

#------------------------------------------------------------------------------
# Grafana Dashboards
#------------------------------------------------------------------------------
resource "kubernetes_config_map" "grafana_dashboards" {
  count = var.enable_grafana ? 1 : 0
  metadata {
    name      = "grafana-dashboards"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    labels = {
      grafana_dashboard = "1"
    }
  }

  data = {
    "api-gateway-dashboard.json"         = file("${path.module}/templates/dashboards/api-gateway-dashboard.json")
    "load-matching-dashboard.json"       = file("${path.module}/templates/dashboards/load-matching-dashboard.json")
    "optimization-engine-dashboard.json" = file("${path.module}/templates/dashboards/optimization-engine-dashboard.json")
    "system-overview-dashboard.json"     = file("${path.module}/templates/dashboards/system-overview-dashboard.json")
    "business-metrics-dashboard.json"    = file("${path.module}/templates/dashboards/business-metrics-dashboard.json")
  }

  depends_on = [kubernetes_namespace.monitoring, helm_release.grafana]
}

#------------------------------------------------------------------------------
# External Service Access for Monitoring UIs
#------------------------------------------------------------------------------
resource "kubernetes_service" "prometheus_external" {
  count = var.enable_prometheus ? 1 : 0
  metadata {
    name      = "prometheus-external"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    annotations = {
      "service.beta.kubernetes.io/aws-load-balancer-type"     = "nlb"
      "service.beta.kubernetes.io/aws-load-balancer-internal" = "true"
    }
  }
  spec {
    selector = {
      app       = "prometheus"
      component = "server"
    }
    port {
      port        = 9090
      target_port = 9090
      protocol    = "TCP"
      name        = "http"
    }
    type = "LoadBalancer"
  }
  depends_on = [helm_release.prometheus]
}

resource "kubernetes_service" "grafana_external" {
  count = var.enable_grafana ? 1 : 0
  metadata {
    name      = "grafana-external"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    annotations = {
      "service.beta.kubernetes.io/aws-load-balancer-type"     = "nlb"
      "service.beta.kubernetes.io/aws-load-balancer-internal" = "true"
    }
  }
  spec {
    selector = {
      "app.kubernetes.io/name" = "grafana"
    }
    port {
      port        = 3000
      target_port = 3000
      protocol    = "TCP"
      name        = "http"
    }
    type = "LoadBalancer"
  }
  depends_on = [helm_release.grafana]
}

resource "kubernetes_service" "alertmanager_external" {
  count = var.enable_alertmanager ? 1 : 0
  metadata {
    name      = "alertmanager-external"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    annotations = {
      "service.beta.kubernetes.io/aws-load-balancer-type"     = "nlb"
      "service.beta.kubernetes.io/aws-load-balancer-internal" = "true"
    }
  }
  spec {
    selector = {
      app = "alertmanager"
    }
    port {
      port        = 9093
      target_port = 9093
      protocol    = "TCP"
      name        = "http"
    }
    type = "LoadBalancer"
  }
  depends_on = [helm_release.alertmanager]
}

#------------------------------------------------------------------------------
# Outputs
#------------------------------------------------------------------------------
output "cloudwatch_dashboard_arns" {
  description = "ARNs of all CloudWatch dashboards created by the monitoring module"
  value = [
    aws_cloudwatch_dashboard.system_overview.dashboard_arn,
    aws_cloudwatch_dashboard.api_gateway.dashboard_arn,
    aws_cloudwatch_dashboard.load_matching.dashboard_arn,
    aws_cloudwatch_dashboard.optimization_engine.dashboard_arn
  ]
}

output "cloudwatch_alarm_arns" {
  description = "ARNs of all CloudWatch alarms created by the monitoring module"
  value = [
    aws_cloudwatch_metric_alarm.high_cpu_utilization.arn,
    aws_cloudwatch_metric_alarm.high_memory_utilization.arn,
    aws_cloudwatch_metric_alarm.high_disk_utilization.arn
  ]
}

output "prometheus_endpoint" {
  description = "Endpoint URL for the Prometheus server"
  value       = var.enable_prometheus ? kubernetes_service.prometheus_external[0].status[0].load_balancer[0].ingress[0].hostname : null
}

output "grafana_endpoint" {
  description = "Endpoint URL for the Grafana dashboard"
  value       = var.enable_grafana ? kubernetes_service.grafana_external[0].status[0].load_balancer[0].ingress[0].hostname : null
}

output "alertmanager_endpoint" {
  description = "Endpoint URL for the AlertManager service"
  value       = var.enable_alertmanager ? kubernetes_service.alertmanager_external[0].status[0].load_balancer[0].ingress[0].hostname : null
}

output "log_group_names" {
  description = "Names of CloudWatch Log Groups created for application logging"
  value = [
    aws_cloudwatch_log_group.application_logs.name,
    aws_cloudwatch_log_group.system_logs.name,
    aws_cloudwatch_log_group.audit_logs.name
  ]
}

output "metric_namespace" {
  description = "CloudWatch namespace used for custom metrics"
  value       = "FreightOptimization/${var.environment}"
}

output "monitoring_security_group_id" {
  description = "ID of the security group created for monitoring services"
  value       = aws_security_group.monitoring.id
}

output "monitoring_iam_role_arn" {
  description = "ARN of the IAM role created for monitoring services"
  value       = aws_iam_role.monitoring.arn
}