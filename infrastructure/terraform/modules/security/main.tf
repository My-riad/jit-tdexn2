# ---------------------------------------------------------------------------------------------------------------------
# Security Module - AI-driven Freight Optimization Platform
# 
# This module provisions security-related resources including:
# - KMS keys for data encryption
# - IAM roles and policies for service access
# - Security groups for network isolation
# - WAF for API protection
# - Shield Advanced for DDoS protection
# - Secrets Manager resources for credential management
# - Password policies and compliance settings
# ---------------------------------------------------------------------------------------------------------------------

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# Local Values
# ---------------------------------------------------------------------------------------------------------------------

locals {
  name_prefix = "${var.name}-${var.environment}"
  common_tags = merge(var.tags, {
    Name        = var.name
    Environment = var.environment
  })
  
  security_group_map = {
    api_gateway = aws_security_group.api_gateway.id
    application = aws_security_group.application.id
    database    = aws_security_group.database.id
    kafka       = aws_security_group.kafka.id
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# Data Sources
# ---------------------------------------------------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# KMS key policy
data "aws_iam_policy_document" "kms_policy" {
  statement {
    sid    = "EnableIAMUserPermissions"
    effect = "Allow"
    
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.account_id != null ? var.account_id : data.aws_caller_identity.current.account_id}:root"]
    }
    
    actions   = ["kms:*"]
    resources = ["*"]
  }
  
  statement {
    sid    = "AllowKeyUsageForServices"
    effect = "Allow"
    
    principals {
      type = "Service"
      identifiers = [
        "rds.amazonaws.com",
        "elasticache.amazonaws.com",
        "kafka.amazonaws.com",
        "secretsmanager.amazonaws.com",
        "s3.amazonaws.com",
        "ec2.amazonaws.com",
        "lambda.amazonaws.com"
      ]
    }
    
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]
    
    resources = ["*"]
  }
}

# EKS assume role policy
data "aws_iam_policy_document" "eks_assume_role" {
  statement {
    effect = "Allow"
    
    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
    
    actions = ["sts:AssumeRole"]
  }
}

# EC2 assume role policy
data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"
    
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
    
    actions = ["sts:AssumeRole"]
  }
}

# Lambda assume role policy
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    
    actions = ["sts:AssumeRole"]
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# KMS Keys - For Data Encryption
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_kms_key" "main" {
  description             = "KMS key for data encryption in ${var.name}-${var.environment}"
  deletion_window_in_days = var.kms_key_deletion_window_in_days
  enable_key_rotation     = var.kms_key_enable_rotation
  policy                  = data.aws_iam_policy_document.kms_policy.json
  tags                    = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.main.key_id
}

# ---------------------------------------------------------------------------------------------------------------------
# IAM Roles and Policies - For Access Control
# ---------------------------------------------------------------------------------------------------------------------

# EKS cluster role
resource "aws_iam_role" "eks_cluster" {
  name               = "${local.name_prefix}-eks-cluster-role"
  assume_role_policy = data.aws_iam_policy_document.eks_assume_role.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

# EKS node group role
resource "aws_iam_role" "eks_node_group" {
  name               = "${local.name_prefix}-eks-node-group-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  role       = aws_iam_role.eks_node_group.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  role       = aws_iam_role.eks_node_group.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "ecr_read_only" {
  role       = aws_iam_role.eks_node_group.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  name               = "${local.name_prefix}-lambda-execution-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ---------------------------------------------------------------------------------------------------------------------
# Security Groups - For Network Security
# ---------------------------------------------------------------------------------------------------------------------

# API Gateway security group
resource "aws_security_group" "api_gateway" {
  name        = "${local.name_prefix}-api-gateway-sg"
  description = "Security group for API Gateway in ${var.name}-${var.environment}"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access from anywhere"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-gateway-sg"
  })
}

# Application security group
resource "aws_security_group" "application" {
  name        = "${local.name_prefix}-application-sg"
  description = "Security group for application services in ${var.name}-${var.environment}"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway.id]
    description     = "Allow traffic from API Gateway"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-application-sg"
  })
}

# Database security group
resource "aws_security_group" "database" {
  name        = "${local.name_prefix}-database-sg"
  description = "Security group for database services in ${var.name}-${var.environment}"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.application.id]
    description     = "PostgreSQL access from application layer"
  }
  
  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.application.id]
    description     = "MongoDB access from application layer"
  }
  
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.application.id]
    description     = "Redis access from application layer"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-sg"
  })
}

# Kafka security group
resource "aws_security_group" "kafka" {
  name        = "${local.name_prefix}-kafka-sg"
  description = "Security group for Kafka cluster in ${var.name}-${var.environment}"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 9092
    to_port         = 9092
    protocol        = "tcp"
    security_groups = [aws_security_group.application.id]
    description     = "Kafka plaintext access from application layer"
  }
  
  ingress {
    from_port       = 9094
    to_port         = 9094
    protocol        = "tcp"
    security_groups = [aws_security_group.application.id]
    description     = "Kafka TLS access from application layer"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kafka-sg"
  })
}

# Additional security group rules
resource "aws_security_group_rule" "additional_ingress_rules" {
  for_each = var.security_group_ingress_rules
  
  type              = "ingress"
  from_port         = each.value.from_port
  to_port           = each.value.to_port
  protocol          = each.value.protocol
  cidr_blocks       = each.value.cidr_blocks
  security_group_id = lookup(local.security_group_map, each.key, aws_security_group.application.id)
  description       = each.value.description
}

resource "aws_security_group_rule" "additional_egress_rules" {
  for_each = var.security_group_egress_rules
  
  type              = "egress"
  from_port         = each.value.from_port
  to_port           = each.value.to_port
  protocol          = each.value.protocol
  cidr_blocks       = each.value.cidr_blocks
  security_group_id = lookup(local.security_group_map, each.key, aws_security_group.application.id)
  description       = each.value.description
}

# ---------------------------------------------------------------------------------------------------------------------
# WAF and Shield - For API Security
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_wafv2_web_acl" "main" {
  count = var.enable_waf ? 1 : 0
  
  name  = "${local.name_prefix}-waf"
  scope = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  # AWS Managed Rules
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }
  
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }
  
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 3
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesSQLiRuleSet"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }
  
  # Rate-based rule
  rule {
    name     = "RateBasedRule"
    priority = 4
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateBasedRule"
      sampled_requests_enabled   = true
    }
  }
  
  # Additional WAF rules
  dynamic "rule" {
    for_each = var.additional_waf_rules
    
    content {
      name     = rule.value.name
      priority = rule.value.priority
      action   = rule.value.action
      statement = rule.value.statement
      
      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = rule.value.name
        sampled_requests_enabled   = true
      }
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-waf"
    sampled_requests_enabled   = true
  }
  
  tags = local.common_tags
}

resource "aws_shield_protection" "api_gateway" {
  count = var.enable_shield_advanced ? 1 : 0
  
  name         = "${local.name_prefix}-api-gateway-protection"
  resource_arn = var.api_gateway_arn
  tags         = local.common_tags
}

# ---------------------------------------------------------------------------------------------------------------------
# Secrets Manager - For Credential Management
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "database_credentials" {
  name        = "${local.name_prefix}-db-credentials"
  description = "Database credentials for ${var.name}-${var.environment}"
  kms_key_id  = aws_kms_key.main.arn
  tags        = local.common_tags
}

resource "aws_secretsmanager_secret" "api_keys" {
  name        = "${local.name_prefix}-api-keys"
  description = "API keys for ${var.name}-${var.environment}"
  kms_key_id  = aws_kms_key.main.arn
  tags        = local.common_tags
}

# ---------------------------------------------------------------------------------------------------------------------
# Password Policy and Compliance - For Security Compliance
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length      = var.password_policy.minimum_length
  require_lowercase_characters = var.password_policy.require_lowercase
  require_uppercase_characters = var.password_policy.require_uppercase
  require_numbers              = var.password_policy.require_numbers
  require_symbols              = var.password_policy.require_symbols
  allow_users_to_change_password = true
  password_reuse_prevention    = var.password_policy.password_reuse_prevention
  max_password_age             = var.password_policy.max_password_age
}

# ---------------------------------------------------------------------------------------------------------------------
# AWS Config Rules - For Compliance Monitoring
# ---------------------------------------------------------------------------------------------------------------------

resource "aws_config_config_rule" "encrypted_volumes" {
  count = var.enable_config_rules ? 1 : 0
  
  name = "encrypted-volumes"
  
  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
  
  tags = local.common_tags
}

resource "aws_config_config_rule" "root_account_mfa" {
  count = var.enable_config_rules ? 1 : 0
  
  name = "root-account-mfa-enabled"
  
  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }
  
  tags = local.common_tags
}

resource "aws_config_config_rule" "iam_password_policy" {
  count = var.enable_config_rules ? 1 : 0
  
  name = "iam-password-policy"
  
  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }
  
  input_parameters = {
    RequireUppercaseCharacters = var.password_policy.require_uppercase
    RequireLowercaseCharacters = var.password_policy.require_lowercase
    RequireSymbols             = var.password_policy.require_symbols
    RequireNumbers             = var.password_policy.require_numbers
    MinimumPasswordLength      = var.password_policy.minimum_length
    PasswordReusePrevention    = var.password_policy.password_reuse_prevention
    MaxPasswordAge             = var.password_policy.max_password_age
  }
  
  tags = local.common_tags
}