# Backend configuration for Terraform state management
# Using S3 for state storage with encryption and DynamoDB for state locking
# Production environment state is isolated from other environments

terraform {
  backend "s3" {
    bucket         = "freight-optimization-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "freight-optimization-terraform-locks-prod"
    profile        = "freight-optimization-prod"
  }
}