# Backend configuration for Terraform state management
# Using S3 for state storage with encryption and DynamoDB for state locking
terraform {
  backend "s3" {
    bucket         = "freight-optimization-terraform-state-staging"
    key            = "staging/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "freight-optimization-terraform-locks-staging"
    profile        = "freight-optimization-staging"
  }
}