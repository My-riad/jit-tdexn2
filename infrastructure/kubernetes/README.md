# AI-driven Freight Optimization Platform - Kubernetes Infrastructure

This repository contains the Kubernetes configuration for deploying and managing the AI-driven Freight Optimization Platform. The platform is designed as a microservices architecture deployed on Kubernetes to provide scalability, resilience, and efficient resource utilization.

The Kubernetes configuration follows a GitOps approach with environment-specific overlays, enabling consistent deployment across development, staging, and production environments.

## Repository Structure

The Kubernetes configuration is organized as follows:

- `base/`: Base Kubernetes resources
  - `api-gateway/`: API Gateway service configuration
  - `auth-service/`: Authentication service configuration
  - `cache-service/`: Cache service configuration
  - `data-service/`: Data service configuration
  - `driver-service/`: Driver service configuration
  - `event-bus/`: Event bus service configuration
  - `gamification-service/`: Gamification service configuration
  - `integration-service/`: Integration service configuration
  - `load-matching-service/`: Load matching service configuration
  - `load-service/`: Load service configuration
  - `market-intelligence-service/`: Market intelligence service configuration
  - `notification-service/`: Notification service configuration
  - `optimization-engine/`: Optimization engine service configuration
  - `tracking-service/`: Tracking service configuration
  - `ingress/`: Ingress configuration
  - `monitoring/`: Monitoring components configuration
  - `networking/`: Network policies
  - `security/`: Security policies and RBAC

- `overlays/`: Environment-specific overlays
  - `dev/`: Development environment
  - `staging/`: Staging environment
  - `prod/`: Production environment

- `charts/`: Helm charts
  - `freight-platform/`: Main Helm chart for the platform
    - `Chart.yaml`: Chart definition
    - `values.yaml`: Default values
    - `values-dev.yaml`: Development values
    - `values-staging.yaml`: Staging values
    - `values-prod.yaml`: Production values

## Deployment Architecture

The platform is deployed as a set of microservices on Kubernetes, with each service having its own deployment, service, configuration, and scaling policies.

### Core Services

| Service | Purpose | Scaling Strategy | Resource Profile |
|---------|---------|------------------|------------------|
| API Gateway | Entry point for all client applications | Horizontal scaling based on request rate | Medium CPU, Medium Memory |
| Load Matching Service | Matches drivers with loads based on AI predictions | Horizontal scaling based on queue depth | Medium CPU, High Memory |
| Optimization Engine | Executes AI algorithms for network-wide efficiency | Vertical scaling with GPU support | High CPU, High Memory |
| Driver Service | Manages driver profiles and availability | Horizontal scaling based on active sessions | Medium CPU, Medium Memory |
| Load Service | Manages load lifecycle | Horizontal scaling based on request rate | Medium CPU, Medium Memory |
| Tracking Service | Monitors truck positions and load status | Horizontal scaling based on message rate | Medium CPU, High Memory |
| Gamification Service | Implements scoring and incentives | Horizontal scaling based on request rate | Low CPU, Medium Memory |
| Market Intelligence | Analyzes market conditions and adjusts pricing | Vertical scaling for analytics | High CPU, High Memory |
| Notification Service | Delivers alerts and updates | Horizontal scaling based on queue length | Low CPU, Medium Memory |
| Integration Service | Connects with external systems | Horizontal scaling based on request rate | Medium CPU, Medium Memory |

### Supporting Components

- **Ingress Controller**: NGINX Ingress for external traffic routing
- **Service Mesh**: Istio for advanced traffic management and security
- **Monitoring Stack**: Prometheus, Grafana, and Alertmanager
- **Logging Stack**: Elasticsearch, Fluent Bit, and Kibana
- **Tracing**: Jaeger for distributed tracing

## Environment Configuration

The platform uses Kustomize overlays to manage environment-specific configurations:

### Development Environment

- **Purpose**: Feature development and testing
- **Scale**: 25% of production capacity
- **Configuration**:
  - Reduced replica counts
  - Smaller resource requests and limits
  - Debug logging enabled
  - Development-specific endpoints and configurations

### Staging Environment

- **Purpose**: Pre-production validation
- **Scale**: 50% of production capacity
- **Configuration**:
  - Moderate replica counts
  - Medium resource requests and limits
  - Standard logging levels
  - Staging-specific endpoints and configurations

### Production Environment

- **Purpose**: Live service delivery
- **Scale**: Full capacity
- **Configuration**:
  - High replica counts for resilience
  - Production-grade resource allocations
  - Production logging levels
  - Production endpoints and configurations

Each environment overlay customizes the base resources using:

- Patches for replica counts and resource allocations
- ConfigMap generators for environment-specific settings
- Secret generators for environment-specific credentials
- Image transformers for environment-specific container images

## Deployment Workflow

The platform follows a GitOps deployment workflow using ArgoCD:

1. Developers make changes to the Kubernetes configuration in a feature branch
2. Changes are reviewed and merged to the main branch
3. ArgoCD detects the changes and applies them to the appropriate environment
4. Deployment status and health are monitored through ArgoCD and the monitoring stack

### Manual Deployment

For manual deployments, use the following commands:

```bash
# Development environment
kubectl apply -k overlays/dev

# Staging environment
kubectl apply -k overlays/staging

# Production environment
kubectl apply -k overlays/prod
```

### Helm Deployment

For Helm-based deployments:

```bash
# Development environment
helm upgrade --install freight-platform ./charts/freight-platform -f ./charts/freight-platform/values-dev.yaml

# Staging environment
helm upgrade --install freight-platform ./charts/freight-platform -f ./charts/freight-platform/values-staging.yaml

# Production environment
helm upgrade --install freight-platform ./charts/freight-platform -f ./charts/freight-platform/values-prod.yaml
```

## Resource Management

The platform implements resource management best practices to ensure efficient utilization and reliable operation:

### Resource Requests and Limits

All deployments specify appropriate resource requests and limits based on service requirements and environment:

```yaml
resources:
  requests:
    cpu: "0.5"    # 500m CPU
    memory: "1Gi"  # 1GB Memory
  limits:
    cpu: "1"      # 1 CPU
    memory: "2Gi"  # 2GB Memory
```

### Quality of Service Classes

Services are assigned to appropriate QoS classes based on their criticality:

- **Guaranteed**: Critical services with matching requests and limits
- **Burstable**: Standard services with limits higher than requests
- **BestEffort**: Non-critical batch jobs with no resource specifications

### Node Affinity and Anti-Affinity

Services use affinity and anti-affinity rules to ensure proper distribution:

```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - service-name
        topologyKey: "kubernetes.io/hostname"
```

### Horizontal Pod Autoscaling

Services use HPA for automatic scaling based on metrics:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: service-name
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: service-name
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Security Configuration

The platform implements several security measures at the Kubernetes level:

### Pod Security

- Non-root containers with specific user/group IDs
- Read-only root filesystems where possible
- Restricted capabilities and seccomp profiles

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  fsGroup: 1000
```

### Network Policies

Network policies restrict communication between services:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: service-network-policy
spec:
  podSelector:
    matchLabels:
      app: service-name
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 8080
```

### RBAC Configuration

Role-based access control for service accounts:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: service-role
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: service-role-binding
subjects:
- kind: ServiceAccount
  name: service-account
roleRef:
  kind: Role
  name: service-role
  apiGroup: rbac.authorization.k8s.io
```

### Secret Management

Secrets are managed securely using Kubernetes Secrets and external secret management tools:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: service-secrets
type: Opaque
data:
  API_KEY: base64-encoded-value
  DATABASE_PASSWORD: base64-encoded-value
```

## Monitoring and Observability

The platform includes comprehensive monitoring and observability configurations:

### Prometheus Integration

Services expose metrics endpoints and include annotations for Prometheus scraping:

```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8080"
    prometheus.io/path: "/metrics"
```

### Liveness and Readiness Probes

All services include appropriate health checks:

```yaml
livenessProbe:
  httpGet:
    path: /health/liveness
    port: http
  initialDelaySeconds: 30
  periodSeconds: 15
  timeoutSeconds: 5
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /health/readiness
    port: http
  initialDelaySeconds: 15
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
```

### Logging Configuration

Services are configured for structured logging with appropriate log levels:

```yaml
env:
- name: LOG_LEVEL
  valueFrom:
    configMapKeyRef:
      name: service-config
      key: LOG_LEVEL
```

For more details on monitoring, see the [Monitoring Documentation](../monitoring/README.md).

## Operational Procedures

Standard operational procedures for the Kubernetes infrastructure:

### Deployment Verification

```bash
# Check deployment status
kubectl get deployments -n freight-platform

# Check pod status
kubectl get pods -n freight-platform

# Check service status
kubectl get services -n freight-platform

# Check HPA status
kubectl get hpa -n freight-platform
```

### Log Access

```bash
# Get logs for a specific service
kubectl logs -l app=service-name -n freight-platform

# Follow logs in real-time
kubectl logs -l app=service-name -n freight-platform -f

# Get logs for a specific pod
kubectl logs pod-name -n freight-platform
```

### Scaling Operations

```bash
# Scale a deployment manually
kubectl scale deployment/service-name --replicas=5 -n freight-platform

# Update HPA configuration
kubectl edit hpa service-name -n freight-platform
```

### Troubleshooting

```bash
# Describe a pod for detailed information
kubectl describe pod pod-name -n freight-platform

# Exec into a container for debugging
kubectl exec -it pod-name -n freight-platform -- /bin/sh

# Check events for issues
kubectl get events -n freight-platform
```

## References

Additional resources and documentation:

### Internal Documentation

- [Infrastructure Overview](../terraform/README.md)
- [Monitoring Setup](../monitoring/README.md)
- [Architecture Overview](../docs/architecture.md)
- [Deployment Procedures](../docs/deployment.md)

### External Documentation

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kustomize Documentation](https://kubectl.docs.kubernetes.io/references/kustomize/)
- [Helm Documentation](https://helm.sh/docs/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)