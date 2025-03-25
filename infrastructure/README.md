# AI-driven Freight Optimization Platform - Infrastructure

This repository contains the infrastructure code and configuration for the AI-driven Freight Optimization Platform. The infrastructure is designed to be scalable, resilient, and secure, supporting the platform's requirements for real-time data processing, machine learning, and high availability.

The infrastructure follows a cloud-native approach with infrastructure as code, containerization, and GitOps principles for consistent deployment across environments.

# Repository Structure
The infrastructure code is organized as follows:

- `terraform/`: Terraform code for provisioning cloud resources
  - `modules/`: Reusable Terraform modules
  - `environments/`: Environment-specific configurations
  - `global/`: Resources shared across environments

- `kubernetes/`: Kubernetes configuration for container orchestration
  - `base/`: Base Kubernetes resources
  - `overlays/`: Environment-specific overlays
  - `charts/`: Helm charts

- `monitoring/`: Monitoring and observability configuration
  - `dashboards/`: Grafana dashboards
  - `alerts/`: Alert configurations
  - `prometheus/`: Prometheus configuration
  - `grafana/`: Grafana configuration

- `scripts/`: Utility scripts for infrastructure management
  - `init-eks.sh`: Initialize EKS cluster
  - `deploy-services.sh`: Deploy services to Kubernetes
  - `setup-monitoring.sh`: Set up monitoring stack
  - `backup-databases.sh`: Database backup utilities
  - `load-test.sh`: Load testing utilities
  - `generate-test-data.sh`: Test data generation

- `docs/`: Infrastructure documentation
  - `architecture.md`: Architecture overview
  - `deployment.md`: Deployment procedures
  - `scaling.md`: Scaling strategies
  - `monitoring.md`: Monitoring documentation
  - `disaster-recovery.md`: Disaster recovery procedures
  - `security.md`: Security documentation

# Infrastructure Components
The platform infrastructure consists of the following key components:

### Cloud Infrastructure (AWS)

- **Compute**: EKS (Kubernetes) for container orchestration
- **Databases**: RDS PostgreSQL, ElastiCache Redis, DocumentDB
- **Messaging**: MSK (Managed Streaming for Kafka)
- **Storage**: S3 buckets for various data types
- **Networking**: VPC, subnets, security groups, load balancers
- **Security**: IAM roles, KMS encryption, WAF
- **Monitoring**: CloudWatch, Prometheus, Grafana

### Container Orchestration (Kubernetes)

- **API Gateway**: Entry point for client applications
- **Microservices**: Core platform services
- **Batch Processing**: Data processing and analytics jobs
- **ML Inference**: AI model serving

### Monitoring and Observability

- **Metrics**: Prometheus for metrics collection
- **Visualization**: Grafana for dashboards
- **Alerting**: Alertmanager for notifications
- **Logging**: Fluent Bit, Elasticsearch, Kibana
- **Tracing**: Jaeger for distributed tracing

For detailed information about each component, refer to the specific documentation in the respective directories.

# Getting Started

### Prerequisites

- AWS account with appropriate permissions
- AWS CLI v2.0+ configured with credentials
- Terraform v1.6+
- Kubernetes CLI (kubectl) v1.28+
- Helm v3.12+
- Docker v24+

### Initial Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/your-org/freight-optimization-platform.git
   cd freight-optimization-platform/infrastructure
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your specific values
   source .env
   ```

3. Initialize and apply Terraform for the desired environment:
   ```bash
   cd terraform/environments/dev
   terraform init -backend-config=backend.tfvars
   terraform plan -out=plan.out
   terraform apply plan.out
   ```

4. Configure kubectl to connect to the EKS cluster:
   ```bash
   aws eks update-kubeconfig --name dev-freight-optimization --region us-west-2
   ```

5. Deploy the Kubernetes resources:
   ```bash
   cd ../../../kubernetes
   kubectl apply -k overlays/dev
   ```

6. Set up the monitoring stack:
   ```bash
   cd ../scripts
   ./setup-monitoring.sh dev
   ```

# Environment Management

The platform supports multiple environments with environment-specific configurations:

### Development Environment

- **Purpose**: Feature development and testing
- **Scale**: 25% of production capacity
- **Setup**:
  ```bash
  cd terraform/environments/dev
  terraform apply
  cd ../../../kubernetes
  kubectl apply -k overlays/dev
  ```

### Staging Environment

- **Purpose**: Pre-production validation
- **Scale**: 50% of production capacity
- **Setup**:
  ```bash
  cd terraform/environments/staging
  terraform apply
  cd ../../../kubernetes
  kubectl apply -k overlays/staging
  ```

### Production Environment

- **Purpose**: Live service delivery
- **Scale**: Full capacity with high availability
- **Setup**:
  ```bash
  cd terraform/environments/prod
  terraform apply
  cd ../../../kubernetes
  kubectl apply -k overlays/prod
  ```

### Disaster Recovery Environment

- **Purpose**: Business continuity during region failure
- **Scale**: Matches production capacity
- **Setup**:
  ```bash
  cd terraform/environments/dr
  terraform apply
  ```

Each environment has its own configuration with appropriate resource sizing, redundancy, and security settings.

# Deployment Workflow

The platform follows a GitOps deployment workflow:

1. Infrastructure changes are made in the Terraform code and Kubernetes manifests
2. Changes are committed to the repository and reviewed through pull requests
3. After approval, changes are merged to the main branch
4. CI/CD pipeline automatically applies the changes to the appropriate environment

### CI/CD Pipeline

The CI/CD pipeline is implemented using GitHub Actions and consists of the following stages:

1. **Validate**: Terraform validation and Kubernetes manifest validation
2. **Plan**: Generate Terraform plan and preview changes
3. **Apply**: Apply infrastructure changes to the target environment
4. **Deploy**: Deploy application components to Kubernetes
5. **Test**: Run post-deployment tests to verify functionality

### Manual Deployment

For manual deployments, follow these steps:

1. Make changes to the infrastructure code
2. Run validation and linting:
   ```bash
   terraform fmt
   terraform validate
   ```
3. Generate and review the plan:
   ```bash
   terraform plan -out=plan.out
   ```
4. Apply the changes:
   ```bash
   terraform apply plan.out
   ```
5. Deploy Kubernetes resources:
   ```bash
   kubectl apply -k overlays/[environment]
   ```

# Monitoring and Observability

The platform includes comprehensive monitoring and observability capabilities:

### Metrics and Dashboards

- **Prometheus**: Collects metrics from all components
- **Grafana**: Provides visualization dashboards
- **Custom Dashboards**: Role-specific dashboards for different stakeholders

### Alerting

- **Alertmanager**: Routes alerts to appropriate channels
- **PagerDuty**: On-call notification for critical issues
- **Slack**: Team notifications for various alert levels

### Logging

- **Fluent Bit**: Collects logs from all containers
- **Elasticsearch**: Stores and indexes logs
- **Kibana**: Log visualization and search

### Tracing

- **Jaeger**: Distributed tracing for request flows
- **OpenTelemetry**: Instrumentation for services

For detailed information about monitoring, refer to the [Monitoring Documentation](monitoring/README.md).

# Backup and Disaster Recovery

The platform implements robust backup and disaster recovery capabilities:

### Database Backups

- **Automated Snapshots**: Daily snapshots of all databases
- **Transaction Logs**: Continuous backup of transaction logs
- **Retention**: 30 days of daily backups, 7 days of transaction logs

### Disaster Recovery

- **Multi-Region Strategy**: Resources deployed across multiple AWS regions
- **Database Replication**: Cross-region replication for critical databases
- **S3 Replication**: Cross-region replication for object storage
- **Recovery Procedures**: Documented procedures for various failure scenarios

### Recovery Time Objectives (RTO)

- **Critical Services**: 1 hour
- **Non-critical Services**: 4 hours
- **Complete System**: 8 hours

### Recovery Point Objectives (RPO)

- **Critical Data**: 15 minutes
- **Non-critical Data**: 1 hour

For detailed information about disaster recovery, refer to the [Disaster Recovery Documentation](docs/disaster-recovery.md).

# Security

The infrastructure implements several security best practices:

### Network Security

- **VPC Isolation**: Resources deployed in private subnets
- **Security Groups**: Least privilege access controls
- **WAF**: Protection against common web vulnerabilities
- **DDoS Protection**: AWS Shield for DDoS mitigation

### Data Security

- **Encryption at Rest**: All data encrypted using AWS KMS
- **Encryption in Transit**: TLS for all communications
- **Secrets Management**: AWS Secrets Manager for credentials

### Access Control

- **IAM Roles**: Least privilege principle for service accounts
- **RBAC**: Role-based access control for Kubernetes resources
- **MFA**: Multi-factor authentication for human users

### Compliance and Auditing

- **CloudTrail**: Audit logging for all AWS API calls
- **Kubernetes Audit Logs**: Detailed audit of cluster operations
- **Compliance Scanning**: Regular security and compliance scans

For detailed information about security, refer to the [Security Documentation](docs/security.md).

# Scaling

The infrastructure is designed for elastic scaling to handle varying loads:

### Horizontal Scaling

- **Kubernetes HPA**: Automatic scaling of pods based on metrics
- **Node Auto-scaling**: Automatic scaling of Kubernetes nodes
- **Database Read Replicas**: Scaling for read-heavy workloads

### Vertical Scaling

- **Resource Adjustment**: Changing resource allocations for services
- **Instance Type Upgrades**: Upgrading to more powerful instances

### Geographic Scaling

- **Multi-region Deployment**: Resources deployed across regions
- **CDN**: CloudFront for global content delivery

For detailed information about scaling strategies, refer to the [Scaling Documentation](docs/scaling.md).

# Troubleshooting

Common troubleshooting procedures for infrastructure issues:

### Terraform Issues

```bash
# Check Terraform state
terraform state list

# Show details of a specific resource
terraform state show aws_eks_cluster.main

# Refresh state without making changes
terraform refresh

# Import existing resource into state
terraform import aws_s3_bucket.example bucket-name
```

### Kubernetes Issues

```bash
# Check pod status
kubectl get pods -n freight-platform

# View pod logs
kubectl logs pod-name -n freight-platform

# Describe pod for details
kubectl describe pod pod-name -n freight-platform

# Check events
kubectl get events -n freight-platform
```

### Monitoring Issues

```bash
# Check Prometheus targets
kubectl port-forward svc/prometheus-server 9090:80 -n monitoring
# Then open http://localhost:9090/targets in your browser

# Check Grafana dashboards
kubectl port-forward svc/grafana 3000:80 -n monitoring
# Then open http://localhost:3000 in your browser
```

### Database Issues

```bash
# Connect to RDS database
psql -h <rds-endpoint> -U <username> -d <database>

# Check Redis status
redis-cli -h <redis-endpoint> -p 6379 -a <password> info
```

# Contributing

When contributing to the infrastructure code:

1. Create a feature branch from `main`
2. Make your changes following the project conventions
3. Run validation and linting:
   ```bash
   terraform fmt
   terraform validate
   ```
4. Test changes in the development environment
5. Submit a pull request for review
6. Changes will be applied by the CI/CD pipeline after approval

Coding standards:
- Use consistent naming conventions
- Document all variables and outputs
- Use modules for reusable components
- Follow security best practices
- Include appropriate tags for all resources

# References

### Internal Documentation

- [Terraform Infrastructure](terraform/README.md)
- [Kubernetes Configuration](kubernetes/README.md)
- [Monitoring Setup](monitoring/README.md)
- [Architecture Overview](docs/architecture.md)
- [Deployment Procedures](docs/deployment.md)
- [Scaling Strategies](docs/scaling.md)
- [Security Documentation](docs/security.md)
- [Disaster Recovery](docs/disaster-recovery.md)

### External Documentation

- [AWS Documentation](https://docs.aws.amazon.com/)
- [Terraform Documentation](https://www.terraform.io/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)