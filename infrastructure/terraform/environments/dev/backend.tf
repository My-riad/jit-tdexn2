# Backend configuration for Terraform state management
# Using S3 for state storage with encryption and DynamoDB for state locking
terraform {
  backend "s3" {
    bucket         = "freight-optimization-terraform-state-dev"
    key            = "dev/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "freight-optimization-terraform-locks-dev"
    profile        = "freight-optimization-dev"
  }
}