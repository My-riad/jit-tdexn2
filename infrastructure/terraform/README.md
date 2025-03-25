# AI-driven Freight Optimization Platform - Terraform Infrastructure

This repository contains the Terraform code for provisioning and managing the cloud infrastructure of the AI-driven Freight Optimization Platform. The infrastructure is designed to be scalable, resilient, and secure, supporting the platform's requirements for real-time data processing, machine learning, and high availability.

The Terraform code follows a modular approach with environment-specific configurations, enabling consistent infrastructure deployment across development, staging, and production environments.

## Repository Structure

The Terraform code is organized as follows:

- `modules/`: Reusable Terraform modules
  - `eks/`: Amazon EKS (Kubernetes) cluster configuration
  - `rds/`: PostgreSQL RDS database configuration
  - `elasticache/`: Redis ElastiCache configuration
  - `documentdb/`: DocumentDB configuration
  - `msk/`: Managed Streaming for Kafka configuration
  - `s3/`: S3 bucket configuration
  - `vpc/`: VPC and networking configuration
  - `security/`: Security groups and IAM roles
  - `monitoring/`: CloudWatch and monitoring resources

- `environments/`: Environment-specific configurations
  - `dev/`: Development environment
  - `staging/`: Staging environment
  - `prod/`: Production environment
  - `dr/`: Disaster recovery environment

- `global/`: Resources shared across environments
  - IAM roles and policies
  - Route53 DNS configuration
  - S3 buckets for shared resources

## Infrastructure Components

The platform infrastructure consists of the following key components:

### Compute
- **EKS Cluster**: Kubernetes cluster for container orchestration
  - Multiple node groups with different instance types for various workloads
  - Autoscaling configuration for dynamic capacity management
  - Multi-AZ deployment for high availability

### Databases
- **RDS PostgreSQL**: Relational database for transactional data
  - Multi-AZ deployment with read replicas
  - Automated backups and point-in-time recovery
  - Parameter groups optimized for the platform's workload

- **ElastiCache Redis**: In-memory data store for caching and real-time data
  - Multi-AZ deployment with automatic failover
  - Redis Cluster mode for horizontal scaling
  - Parameter groups optimized for caching and pub/sub

- **DocumentDB**: Document database for flexible schema data
  - Multi-node cluster with automatic scaling
  - Backup and recovery configuration

### Messaging
- **MSK (Managed Streaming for Kafka)**: Event streaming platform
  - Multi-broker deployment across availability zones
  - Auto-scaling configuration for brokers
  - Topic and partition configuration

### Storage
- **S3 Buckets**: Object storage for various data types
  - Data bucket for application data
  - Logs bucket for system logs
  - Backups bucket for database backups
  - Cross-region replication for disaster recovery

### Networking
- **VPC**: Virtual Private Cloud with proper network segmentation
  - Public, private, and database subnets
  - NAT gateways for outbound connectivity
  - Security groups for network access control
  - VPC endpoints for AWS service access

### Security
- **KMS**: Key Management Service for encryption
  - Customer managed keys for sensitive data
  - Automatic key rotation

- **IAM**: Identity and Access Management
  - Service roles with least privilege
  - Instance profiles for EC2 instances

### Monitoring
- **CloudWatch**: Metrics, logs, and alarms
  - Custom metrics for application monitoring
  - Log groups for centralized logging
  - Alarms for critical thresholds

- **SNS**: Simple Notification Service for alerts
  - Topic configuration for different alert types
  - Subscription configuration for notification delivery

## Module Usage

### VPC Module

```hcl
module "vpc" {
  source = "../../modules/vpc"

  name = "freight-optimization"
  environment = var.environment
  vpc_cidr = var.vpc_cidr
  availability_zones = var.availability_zones
  public_subnets = var.public_subnets
  private_subnets = var.private_subnets
  database_subnets = var.database_subnets
  enable_nat_gateway = true
  single_nat_gateway = true
  enable_vpn_gateway = false
  enable_dns_hostnames = true
  enable_dns_support = true
  tags = local.common_tags
}
```

### EKS Module

```hcl
module "eks" {
  source = "../../modules/eks"

  cluster_name = var.eks_cluster_name
  kubernetes_version = var.eks_cluster_version
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
  node_groups = var.eks_node_groups
  cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  endpoint_private_access = true
  endpoint_public_access = true
  public_access_cidrs = ["0.0.0.0/0"]
  tags = local.common_tags
}
```

### RDS Module

```hcl
module "rds" {
  source = "../../modules/rds"

  name = "freight-optimization"
  environment = var.environment
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.database_subnet_ids
  app_security_group_ids = [module.eks.cluster_security_group_id]
  instance_class = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  db_name = var.db_name
  db_username = var.db_username
  multi_az = var.db_multi_az
  backup_retention_period = var.db_backup_retention_period
  deletion_protection = false
  skip_final_snapshot = true
  kms_key_id = aws_kms_key.main.arn
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  create_read_replica = var.environment == "prod" ? true : false
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions = [aws_sns_topic.alerts.arn]
}
```

### ElastiCache Module

```hcl
module "elasticache" {
  source = "../../modules/elasticache"

  application = "freight-optimization"
  environment = var.environment
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
  allowed_security_group_ids = [module.eks.cluster_security_group_id]
  node_type = var.redis_node_type
  engine_version = "7.0"
  num_cache_nodes = var.redis_num_cache_nodes
  parameter_group_parameters = {
    "maxmemory-policy" = "volatile-lru"
    "notify-keyspace-events" = "Ex"
  }
  automatic_failover_enabled = true
  multi_az_enabled = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  snapshot_retention_limit = 7
  tags = local.common_tags
}
```

## Environment Configuration

Each environment has its own configuration with appropriate resource sizing and settings:

### Development Environment

- **Purpose**: Feature development and testing
- **Scale**: 25% of production capacity
- **Configuration**:
  - Smaller instance types
  - Reduced replica counts
  - Single-AZ for some components
  - Shorter backup retention
  - Simplified monitoring

### Staging Environment

- **Purpose**: Pre-production validation
- **Scale**: 50% of production capacity
- **Configuration**:
  - Medium instance types
  - Moderate replica counts
  - Multi-AZ for critical components
  - Standard backup retention
  - Full monitoring setup

### Production Environment

- **Purpose**: Live service delivery
- **Scale**: Full capacity
- **Configuration**:
  - Production-grade instance types
  - High replica counts
  - Multi-AZ for all components
  - Extended backup retention
  - Comprehensive monitoring and alerting

### Disaster Recovery Environment

- **Purpose**: Business continuity during region failure
- **Scale**: Matches production capacity
- **Configuration**:
  - Standby resources in a separate region
  - Database replication from production
  - Regular synchronization testing

## Getting Started

### Prerequisites

- Terraform v1.6+
- AWS CLI v2.0+
- AWS account with appropriate permissions
- S3 bucket for Terraform state (created manually)
- DynamoDB table for state locking (created manually)

### Initial Setup

1. Configure AWS credentials:
   ```bash
   aws configure --profile freight-optimization-dev
   ```

2. Initialize Terraform for the desired environment:
   ```bash
   cd environments/dev
   terraform init -backend-config=backend.tfvars
   ```

3. Create a `terraform.tfvars` file with environment-specific values:
   ```hcl
   aws_region = "us-west-2"
   environment = "dev"
   vpc_cidr = "10.0.0.0/16"
   availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]
   public_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
   private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
   database_subnets = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
   eks_cluster_name = "dev-freight-optimization"
   eks_cluster_version = "1.28"
   # Add other variables as needed
   ```

4. Plan the infrastructure changes:
   ```bash
   terraform plan -out=plan.out
   ```

5. Apply the changes:
   ```bash
   terraform apply plan.out
   ```

## Deployment Workflow

The recommended workflow for infrastructure changes is:

1. Make changes to the Terraform code in a feature branch
2. Run `terraform validate` and `terraform fmt` to ensure code quality
3. Run `terraform plan` to review the changes
4. Submit a pull request for code review
5. After approval, merge to the main branch
6. The CI/CD pipeline will apply the changes to the appropriate environment

For manual deployments:

```bash
# Development environment
cd environments/dev
terraform init -backend-config=backend.tfvars
terraform plan -out=plan.out
terraform apply plan.out

# Staging environment
cd ../staging
terraform init -backend-config=backend.tfvars
terraform plan -out=plan.out
terraform apply plan.out

# Production environment
cd ../prod
terraform init -backend-config=backend.tfvars
terraform plan -out=plan.out
terraform apply plan.out
```

## State Management

Terraform state is stored in S3 with DynamoDB for state locking:

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "freight-optimization-terraform-state"
    key            = "environments/dev/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "freight-optimization-terraform-locks"
    encrypt        = true
  }
}
```

Each environment has its own state file with appropriate access controls. State operations should be performed carefully, especially in production environments.

## Resource Naming Convention

Resources follow a consistent naming convention:

- Format: `{environment}-freight-optimization-{resource-type}-{optional-identifier}`
- Examples:
  - `dev-freight-optimization-eks`
  - `prod-freight-optimization-rds-main`
  - `staging-freight-optimization-redis`

All resources are tagged with:
- `Environment`: The deployment environment (dev, staging, prod)
- `Application`: "freight-optimization"
- `ManagedBy`: "terraform"
- Additional tags as appropriate for the resource type

## Security Considerations

The Terraform code implements several security best practices:

- **Encryption**: All sensitive data is encrypted at rest and in transit
  - RDS databases use AWS KMS for encryption
  - S3 buckets have default encryption enabled
  - ElastiCache clusters use encryption in transit and at rest

- **Network Security**: VPC security groups restrict access
  - Database instances are in private subnets
  - Security groups allow only necessary traffic
  - VPC endpoints for AWS services

- **Access Control**: IAM roles follow least privilege principle
  - Service-specific roles with minimal permissions
  - No hardcoded credentials in Terraform code
  - Secrets managed through AWS Secrets Manager

- **Compliance**: Resources configured for regulatory compliance
  - Logging enabled for audit trails
  - Backup and retention policies for data protection
  - Resource configurations follow security best practices

## Cost Optimization

The infrastructure is designed with cost optimization in mind:

- **Right-sizing**: Instance types appropriate for each environment
  - Development: Smaller, cost-effective instances
  - Staging: Medium-sized instances
  - Production: Performance-optimized instances

- **Auto-scaling**: Resources scale based on demand
  - EKS node groups with auto-scaling
  - RDS storage auto-scaling
  - ElastiCache with appropriate node counts

- **Reserved Instances**: Production environment uses reserved instances
  - 1-year commitments for baseline capacity
  - On-demand for variable workloads

- **Lifecycle Management**: Automated cleanup of temporary resources
  - S3 lifecycle policies for log rotation
  - Automated snapshot management
  - Cleanup of development resources during non-working hours

## Monitoring and Logging

The infrastructure includes comprehensive monitoring:

- **CloudWatch Metrics**: Automated collection of system metrics
  - CPU, memory, disk, and network utilization
  - Database performance metrics
  - Application-specific custom metrics

- **CloudWatch Logs**: Centralized log collection
  - Application logs
  - System logs
  - Database logs

- **CloudWatch Alarms**: Automated alerting for critical conditions
  - High CPU/memory utilization
  - Low disk space
  - Database connection limits
  - Error rate thresholds

- **SNS Topics**: Notification delivery for alerts
  - Email notifications
  - Integration with PagerDuty
  - Slack notifications via Lambda

## Backup and Disaster Recovery

The infrastructure includes robust backup and disaster recovery capabilities:

- **Database Backups**:
  - Automated daily snapshots
  - Transaction log backups every 15 minutes
  - Point-in-time recovery capability
  - Cross-region replication for critical data

- **S3 Backups**:
  - Versioning enabled for critical buckets
  - Cross-region replication for disaster recovery
  - Lifecycle policies for cost-effective long-term storage

- **Disaster Recovery**:
  - Multi-region deployment capability
  - Database replication to DR region
  - Regular testing of failover procedures
  - Documented recovery processes

## Troubleshooting

Common troubleshooting procedures:

### Terraform State Issues

```bash
# List resources in state
terraform state list

# Show details of a specific resource
terraform state show aws_eks_cluster.main

# Remove a resource from state (use with caution)
terraform state rm aws_instance.example

# Import existing resource into state
terraform import aws_s3_bucket.example bucket-name
```

### Plan/Apply Failures

- Check AWS credentials and permissions
- Verify that the state file is accessible
- Check for concurrent state modifications
- Review error messages for specific resource issues
- Ensure that referenced resources exist

### Resource Management

- Use AWS Console or CLI to verify resource creation
- Check CloudTrail for API errors
- Review CloudWatch Logs for detailed error information
- Use AWS Config to verify resource configurations

## Contributing

When contributing to the Terraform code:

1. Create a feature branch from `main`
2. Make your changes following the project conventions
3. Run `terraform fmt` and `terraform validate`
4. Test changes in the development environment
5. Submit a pull request for review
6. Changes will be applied by the CI/CD pipeline after approval

Coding standards:
- Use consistent naming conventions
- Document all variables and outputs
- Use modules for reusable components
- Follow security best practices
- Include appropriate tags for all resources

## References

### Internal Documentation

- Kubernetes Configuration - See the Kubernetes directory for container orchestration configurations that run on this infrastructure
- [Monitoring Setup](../monitoring/README.md)
- [Architecture Overview](../docs/architecture.md)
- [Deployment Procedures](../docs/deployment.md)
- [Infrastructure Overview](./docs/overview.md)

### External Documentation

- [Terraform Documentation](https://www.terraform.io/docs/)
- [AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [EKS Documentation](https://docs.aws.amazon.com/eks/)
- [RDS Documentation](https://docs.aws.amazon.com/rds/)
- [ElastiCache Documentation](https://docs.aws.amazon.com/elasticache/)