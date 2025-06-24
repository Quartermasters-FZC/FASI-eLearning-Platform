# =================================================================
# TERRAFORM OUTPUTS
# AI-Powered eLearning Platform - Quartermasters FZC
# =================================================================

# =================================================================
# CLUSTER INFORMATION
# =================================================================

output "cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = module.eks.cluster_arn
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "EKS cluster security group ID"
  value       = module.eks.cluster_security_group_id
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster OIDC Issuer"
  value       = module.eks.cluster_oidc_issuer_url
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "cluster_version" {
  description = "The Kubernetes version for the EKS cluster"
  value       = module.eks.cluster_version
}

# =================================================================
# NETWORKING
# =================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnet_ids" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnet_ids" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "database_subnet_ids" {
  description = "List of IDs of database subnets"
  value       = module.vpc.database_subnets
}

output "database_subnet_group_name" {
  description = "Name of the database subnet group"
  value       = aws_db_subnet_group.main.name
}

# =================================================================
# DATABASE
# =================================================================

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.postgresql.endpoint
  sensitive   = true
}

output "database_port" {
  description = "RDS instance port"
  value       = aws_db_instance.postgresql.port
}

output "database_name" {
  description = "RDS database name"
  value       = aws_db_instance.postgresql.db_name
}

output "database_username" {
  description = "RDS database username"
  value       = aws_db_instance.postgresql.username
  sensitive   = true
}

output "database_secret_arn" {
  description = "ARN of the database credentials secret"
  value       = aws_secretsmanager_secret.database.arn
}

# =================================================================
# REDIS
# =================================================================

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.redis.port
}

output "redis_secret_arn" {
  description = "ARN of the Redis credentials secret"
  value       = aws_secretsmanager_secret.redis.arn
}

# =================================================================
# S3 BUCKETS
# =================================================================

output "ai_models_bucket_name" {
  description = "Name of the S3 bucket for AI models"
  value       = aws_s3_bucket.ai_models.id
}

output "ai_models_bucket_arn" {
  description = "ARN of the S3 bucket for AI models"
  value       = aws_s3_bucket.ai_models.arn
}

output "content_bucket_name" {
  description = "Name of the S3 bucket for content"
  value       = aws_s3_bucket.content.id
}

output "content_bucket_arn" {
  description = "ARN of the S3 bucket for content"
  value       = aws_s3_bucket.content.arn
}

output "backups_bucket_name" {
  description = "Name of the S3 bucket for backups"
  value       = aws_s3_bucket.backups.id
}

output "backups_bucket_arn" {
  description = "ARN of the S3 bucket for backups"
  value       = aws_s3_bucket.backups.arn
}

# =================================================================
# LOAD BALANCER
# =================================================================

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

# =================================================================
# DOMAIN AND SSL
# =================================================================

output "domain_name" {
  description = "Domain name for the application"
  value       = var.domain_name
}

output "ssl_certificate_arn" {
  description = "ARN of the SSL certificate"
  value       = aws_acm_certificate.main.arn
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = data.aws_route53_zone.main.zone_id
}

# =================================================================
# IAM
# =================================================================

output "eks_service_account_role_arn" {
  description = "ARN of the EKS service account IAM role"
  value       = aws_iam_role.eks_service_account.arn
}

output "rds_monitoring_role_arn" {
  description = "ARN of the RDS monitoring IAM role"
  value       = aws_iam_role.rds_monitoring.arn
}

# =================================================================
# CLOUDWATCH
# =================================================================

output "application_log_group_name" {
  description = "Name of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.application.name
}

output "application_log_group_arn" {
  description = "ARN of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.application.arn
}

output "ai_services_log_group_name" {
  description = "Name of the AI services CloudWatch log group"
  value       = aws_cloudwatch_log_group.ai_services.name
}

output "ai_services_log_group_arn" {
  description = "ARN of the AI services CloudWatch log group"
  value       = aws_cloudwatch_log_group.ai_services.arn
}

# =================================================================
# SECURITY GROUPS
# =================================================================

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

output "redis_security_group_id" {
  description = "ID of the Redis security group"
  value       = aws_security_group.redis.id
}

# =================================================================
# NODE GROUPS
# =================================================================

output "node_groups" {
  description = "EKS managed node groups"
  value       = module.eks.eks_managed_node_groups
}

# =================================================================
# KUBECTL CONFIGURATION
# =================================================================

output "kubectl_config" {
  description = "kubectl configuration for accessing the cluster"
  value = {
    cluster_name = module.eks.cluster_id
    region       = var.aws_region
    endpoint     = module.eks.cluster_endpoint
    certificate  = module.eks.cluster_certificate_authority_data
  }
  sensitive = true
}

# =================================================================
# APPLICATION ENDPOINTS
# =================================================================

output "application_urls" {
  description = "Application URLs"
  value = {
    web_app         = "https://${var.domain_name}"
    api_gateway     = "https://api.${var.domain_name}"
    admin_portal    = "https://admin.${var.domain_name}"
    docs           = "https://docs.${var.domain_name}"
  }
}

# =================================================================
# MONITORING ENDPOINTS
# =================================================================

output "monitoring_endpoints" {
  description = "Monitoring and observability endpoints"
  value = {
    prometheus     = "https://prometheus.${var.domain_name}"
    grafana        = "https://grafana.${var.domain_name}"
    jaeger         = "https://jaeger.${var.domain_name}"
    kibana         = "https://kibana.${var.domain_name}"
  }
}

# =================================================================
# AI SERVICE ENDPOINTS
# =================================================================

output "ai_service_endpoints" {
  description = "AI service internal endpoints"
  value = {
    speech_recognition = "http://speech-service:${local.speech_service_port}"
    nlp_service       = "http://nlp-service:${local.nlp_service_port}"
    translation       = "http://translation-service:${local.translation_service_port}"
  }
  sensitive = true
}

# =================================================================
# CONNECTION STRINGS
# =================================================================

output "connection_strings" {
  description = "Database and cache connection strings"
  value = {
    postgresql_connection = "postgresql://${aws_db_instance.postgresql.username}:${urlencode(random_password.db_password.result)}@${aws_db_instance.postgresql.endpoint}/${aws_db_instance.postgresql.db_name}"
    redis_connection     = "redis://:${urlencode(random_password.redis_auth_token.result)}@${aws_elasticache_replication_group.redis.primary_endpoint_address}:${aws_elasticache_replication_group.redis.port}"
  }
  sensitive = true
}

# =================================================================
# KUBERNETES MANIFESTS CONFIGURATION
# =================================================================

output "kubernetes_config_map_data" {
  description = "Configuration data for Kubernetes ConfigMap"
  value = {
    # Database configuration
    DATABASE_HOST = aws_db_instance.postgresql.endpoint
    DATABASE_PORT = tostring(aws_db_instance.postgresql.port)
    DATABASE_NAME = aws_db_instance.postgresql.db_name
    
    # Redis configuration
    REDIS_HOST = aws_elasticache_replication_group.redis.primary_endpoint_address
    REDIS_PORT = tostring(aws_elasticache_replication_group.redis.port)
    
    # S3 configuration
    AI_MODELS_BUCKET = aws_s3_bucket.ai_models.id
    CONTENT_BUCKET   = aws_s3_bucket.content.id
    BACKUPS_BUCKET   = aws_s3_bucket.backups.id
    
    # AWS configuration
    AWS_REGION = var.aws_region
    AWS_ACCOUNT_ID = data.aws_caller_identity.current.account_id
    
    # Application configuration
    ENVIRONMENT = var.environment
    PROJECT_NAME = var.project_name
    DOMAIN_NAME = var.domain_name
    
    # Service discovery
    AUTH_SERVICE_URL = "http://auth-service:${local.auth_service_port}"
    USER_SERVICE_URL = "http://user-service:${local.user_service_port}"
    CONTENT_SERVICE_URL = "http://content-service:${local.content_service_port}"
    SPEECH_SERVICE_URL = "http://speech-service:${local.speech_service_port}"
    NLP_SERVICE_URL = "http://nlp-service:${local.nlp_service_port}"
    TRANSLATION_SERVICE_URL = "http://translation-service:${local.translation_service_port}"
    
    # Logging
    LOG_LEVEL = var.environment == "production" ? "INFO" : "DEBUG"
    APPLICATION_LOG_GROUP = aws_cloudwatch_log_group.application.name
    AI_SERVICES_LOG_GROUP = aws_cloudwatch_log_group.ai_services.name
  }
  sensitive = true
}

# =================================================================
# DEPLOYMENT INFORMATION
# =================================================================

output "deployment_info" {
  description = "Deployment information and instructions"
  value = {
    cluster_name = module.eks.cluster_id
    region      = var.aws_region
    environment = var.environment
    
    kubectl_commands = [
      "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_id}",
      "kubectl get nodes",
      "kubectl get pods --all-namespaces"
    ]
    
    helm_releases = [
      "speech-service",
      "nlp-service", 
      "translation-service",
      "auth-service",
      "user-service",
      "content-service",
      "web-app",
      "admin-portal"
    ]
    
    monitoring_stack = [
      "prometheus",
      "grafana",
      "jaeger",
      "elasticsearch",
      "kibana",
      "fluentd"
    ]
  }
}

# =================================================================
# COST ESTIMATION
# =================================================================

output "estimated_monthly_costs" {
  description = "Estimated monthly AWS costs (USD)"
  value = {
    eks_cluster = "75"
    node_groups = "400-800"
    rds_database = "200-400"
    redis_cache = "100-200"
    s3_storage = "50-200"
    load_balancer = "25"
    data_transfer = "50-300"
    cloudwatch = "20-100"
    total_estimated = "920-2100"
    note = "Costs vary based on usage, data transfer, and storage requirements"
  }
}

# =================================================================
# SECURITY COMPLIANCE
# =================================================================

output "security_compliance" {
  description = "Security and compliance information"
  value = {
    encryption_at_rest = true
    encryption_in_transit = true
    vpc_flow_logs = true
    cloudtrail = "Recommended to enable separately"
    waf = "Recommended to enable separately"
    compliance_frameworks = ["FISMA", "FedRAMP", "SOC2"]
    security_groups = [
      aws_security_group.alb.id,
      aws_security_group.database.id,
      aws_security_group.redis.id
    ]
    iam_roles = [
      aws_iam_role.eks_service_account.arn,
      aws_iam_role.rds_monitoring.arn
    ]
  }
}