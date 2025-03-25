# Backend configuration for Terraform state management of global resources
# Using S3 for state storage with encryption and DynamoDB for state locking
# Global resources include shared infrastructure like ECR repositories, IAM roles, and Route53 zones

terraform {
  backend "s3" {
    bucket         = "freight-optimization-terraform-state"
    key            = "global/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "freight-optimization-terraform-locks"
    profile        = "freight-optimization-admin"
  }
}