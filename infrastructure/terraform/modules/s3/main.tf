#################
# AWS Providers #
#################

provider "aws" {
  alias  = "replication"
  region = var.replication_region
}

########################
# Primary S3 Resources #
########################

# Main S3 bucket for storing documents, logs, and backups
resource "aws_s3_bucket" "main" {
  bucket = "${var.bucket_name}-${var.environment}"
  tags   = var.tags
}

# Versioning configuration for the main bucket
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  
  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Disabled"
  }
}

# Server-side encryption configuration for the main bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle configuration for the main bucket
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  count  = length(var.lifecycle_rules) > 0 ? 1 : 0
  bucket = aws_s3_bucket.main.id

  dynamic "rule" {
    for_each = var.lifecycle_rules
    content {
      id      = rule.value.id
      status  = rule.value.enabled ? "Enabled" : "Disabled"
      prefix  = rule.value.prefix

      dynamic "transition" {
        for_each = rule.value.transition
        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
        }
      }

      dynamic "expiration" {
        for_each = rule.value.expiration != null ? [rule.value.expiration] : []
        content {
          days = expiration.value.days
        }
      }
    }
  }
}

# Public access block configuration for the main bucket
resource "aws_s3_bucket_public_access_block" "main" {
  bucket                  = aws_s3_bucket.main.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

############################
# Replication S3 Resources #
############################

# Replication S3 bucket for disaster recovery
resource "aws_s3_bucket" "replication" {
  count    = var.enable_replication ? 1 : 0
  provider = aws.replication
  bucket   = "${var.bucket_name}-${var.environment}-replication"
  tags     = var.tags
}

# Versioning configuration for the replication bucket (required for replication)
resource "aws_s3_bucket_versioning" "replication" {
  count    = var.enable_replication ? 1 : 0
  provider = aws.replication
  bucket   = aws_s3_bucket.replication[0].id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption configuration for the replication bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "replication" {
  count    = var.enable_replication ? 1 : 0
  provider = aws.replication
  bucket   = aws_s3_bucket.replication[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Public access block configuration for the replication bucket
resource "aws_s3_bucket_public_access_block" "replication" {
  count                   = var.enable_replication ? 1 : 0
  provider                = aws.replication
  bucket                  = aws_s3_bucket.replication[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

############################
# Replication IAM Resources #
############################

# IAM role for S3 replication
resource "aws_iam_role" "replication" {
  count = var.enable_replication ? 1 : 0
  name  = "s3-replication-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

# IAM policy for S3 replication
resource "aws_iam_policy" "replication" {
  count = var.enable_replication ? 1 : 0
  name  = "s3-replication-policy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = [aws_s3_bucket.main.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = ["${aws_s3_bucket.main.arn}/*"]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.replication[0].arn}/*"
      }
    ]
  })

  tags = var.tags
}

# Attach the replication policy to the role
resource "aws_iam_role_policy_attachment" "replication" {
  count      = var.enable_replication ? 1 : 0
  role       = aws_iam_role.replication[0].name
  policy_arn = aws_iam_policy.replication[0].arn
}

############################
# Replication Configuration #
############################

# Replication configuration for the main bucket
resource "aws_s3_bucket_replication_configuration" "main" {
  count  = var.enable_replication ? 1 : 0
  bucket = aws_s3_bucket.main.id
  role   = aws_iam_role.replication[0].arn

  rule {
    id     = "entire-bucket"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.replication[0].arn
      storage_class = "STANDARD"
    }
  }

  # Replication configuration requires versioning to be enabled
  depends_on = [aws_s3_bucket_versioning.main]
}