# Terraform configuration for the disaster recovery (DR) environment

# Define providers for both DR and primary regions
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = var.tags
  }
}

provider "aws" {
  alias  = "primary"
  region = var.primary_region
  default_tags {
    tags = var.tags
  }
}

# Define local variables for use throughout the configuration
locals {
  name_prefix = "freight-optimization-${var.environment}"
  common_tags = merge(var.tags, { Environment = var.environment, ManagedBy = "Terraform" })
}

# KMS key for encrypting resources in the DR region
resource "aws_kms_key" "main" {
  description             = "KMS key for DR environment encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags                    = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.main.key_id
}

# S3 bucket for backups in the DR region
resource "aws_s3_bucket" "backup" {
  bucket        = var.s3_backup_bucket_name
  force_destroy = false
  tags          = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup_encryption" {
  bucket = aws_s3_bucket.backup.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

resource "aws_s3_bucket_versioning" "backup_versioning" {
  bucket = aws_s3_bucket.backup.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backup_lifecycle" {
  bucket = aws_s3_bucket.backup.id

  rule {
    id     = "backup-transition"
    status = "Enabled"

    transition {
      days          = var.backup_cold_storage_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.backup_retention_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backup_public_access_block" {
  bucket                  = aws_s3_bucket.backup.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# SNS topic for monitoring alerts in DR region
resource "aws_sns_topic" "monitoring_alerts" {
  name              = "${local.name_prefix}-monitoring-alerts"
  kms_master_key_id = aws_kms_key.main.arn
  tags              = local.common_tags
}

# CloudWatch log group for centralized logging in DR region
resource "aws_cloudwatch_log_group" "monitoring_logs" {
  name              = "/aws/${local.name_prefix}/logs"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn
  tags              = local.common_tags
}

# VPC module for networking infrastructure in DR region
module "vpc" {
  source = "../../modules/vpc"

  name               = "freight-optimization"
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  public_subnets     = var.public_subnets
  private_subnets    = var.private_subnets
  database_subnets   = var.database_subnets

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_vpn_gateway   = false
  enable_dns_hostnames = true
  enable_dns_support   = true
  enable_flow_logs     = true
  flow_logs_destination_arn = aws_s3_bucket.backup.arn
  enable_s3_endpoint   = true

  tags = local.common_tags
}

# EKS module for Kubernetes cluster in DR region
module "eks" {
  source = "../../modules/eks"

  cluster_name       = var.eks_cluster_name
  kubernetes_version = var.eks_cluster_version
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnets
  node_groups        = var.eks_node_groups

  cluster_log_types        = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  endpoint_private_access  = true
  endpoint_public_access   = true
  public_access_cidrs      = ["0.0.0.0/0"]

  tags = local.common_tags
}

# AWS Backup vault for backups in DR region
resource "aws_backup_vault" "main" {
  name        = "${local.name_prefix}-backup-vault"
  kms_key_arn = aws_kms_key.main.arn
  tags        = local.common_tags
}

# IAM role for AWS Backup in DR region
resource "aws_iam_role" "backup" {
  name = "${local.name_prefix}-backup-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Principal = {
          Service = "backup.amazonaws.com"
        },
        Effect = "Allow",
        Sid    = ""
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_restore" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# Data source to get information about the primary RDS instance
data "aws_db_instance" "primary_rds" {
  provider                = aws.primary
  db_instance_identifier  = "freight-optimization-prod"
}

# Data source for RDS monitoring assume role policy
data "aws_iam_policy_document" "rds_monitoring_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["monitoring.rds.amazonaws.com"]
    }
    effect = "Allow"
  }
}

# Latest Amazon Linux 2 AMI for the bastion host
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security group for RDS replica in DR region
resource "aws_security_group" "rds_replica" {
  name        = "${local.name_prefix}-rds-replica-sg"
  description = "Allow access to PostgreSQL RDS replica"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.cluster_security_group_id]
    description     = "PostgreSQL access from EKS cluster"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = local.common_tags
}

# IAM role for RDS enhanced monitoring in DR region
resource "aws_iam_role" "rds_monitoring" {
  name               = "${local.name_prefix}-rds-monitoring"
  assume_role_policy = data.aws_iam_policy_document.rds_monitoring_assume_role.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# RDS read replica in DR region replicating from production
resource "aws_db_instance" "rds_replica" {
  identifier                  = "${local.name_prefix}-rds-replica"
  instance_class              = var.db_instance_class
  replicate_source_db         = data.aws_db_instance.primary_rds.db_instance_arn
  kms_key_id                  = aws_kms_key.main.arn
  storage_encrypted           = true
  auto_minor_version_upgrade  = true
  backup_retention_period     = 7
  backup_window               = "03:00-05:00"
  maintenance_window          = "sun:05:00-sun:07:00"
  multi_az                    = false
  publicly_accessible         = false
  skip_final_snapshot         = true
  vpc_security_group_ids      = [aws_security_group.rds_replica.id]
  monitoring_interval         = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring.arn
  tags                        = local.common_tags
}

# DocumentDB module for document database in DR region
module "documentdb_replica" {
  source = "../../modules/documentdb"

  name        = "freight-optimization-docdb"
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.database_subnets
  app_security_group_ids = [module.eks.cluster_security_group_id]
  
  instance_class            = var.documentdb_instance_class
  instance_count            = var.documentdb_instance_count
  db_username               = "docdbadmin"
  backup_retention_period   = 7
  deletion_protection       = true
  skip_final_snapshot       = false
  kms_key_id                = aws_kms_key.main.arn
  enable_tls                = true
  
  alarm_actions             = [aws_sns_topic.monitoring_alerts.arn]
  ok_actions                = [aws_sns_topic.monitoring_alerts.arn]
  max_connections_threshold = 1000
  
  tags                      = local.common_tags
}

# Security group for bastion host in DR region
resource "aws_security_group" "bastion" {
  name        = "${local.name_prefix}-bastion-sg"
  description = "Security group for bastion host in DR region"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
    description = "SSH access from allowed CIDR blocks"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = local.common_tags
}

# Bastion host for secure SSH access in DR region
resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.amazon_linux_2.id
  instance_type               = var.bastion_instance_type
  key_name                    = var.bastion_key_name
  subnet_id                   = module.vpc.public_subnets[0]
  vpc_security_group_ids      = [aws_security_group.bastion.id]
  associate_public_ip_address = true
  
  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
    kms_key_id  = aws_kms_key.main.arn
  }
  
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-bastion" })
}

# AWS Backup plan for DR region resources
resource "aws_backup_plan" "main" {
  name = "${local.name_prefix}-backup-plan"

  rule {
    rule_name         = "daily-backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 3 * * ? *)"
    start_window      = 60
    completion_window = 180
    
    lifecycle {
      cold_storage_after = var.backup_cold_storage_days
      delete_after       = var.backup_retention_days
    }
  }

  tags = local.common_tags
}

# AWS Backup selection for DR region resources
resource "aws_backup_selection" "main" {
  name         = "${local.name_prefix}-backup-selection"
  iam_role_arn = aws_iam_role.backup.arn
  plan_id      = aws_backup_plan.main.id
  
  resources = [
    aws_db_instance.rds_replica.arn,
    module.documentdb_replica.cluster_arn
  ]
}