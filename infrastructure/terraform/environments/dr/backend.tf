# Backend configuration for Terraform state management
# Using S3 for state storage with encryption and DynamoDB for state locking
# DR environment state is stored in a different region than primary environments
# DR environment state is isolated from other environments

terraform {
  backend "s3" {
    bucket         = "freight-optimization-terraform-state-dr"
    key            = "dr/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "freight-optimization-terraform-locks-dr"
    profile        = "freight-optimization-dr"
  }
}