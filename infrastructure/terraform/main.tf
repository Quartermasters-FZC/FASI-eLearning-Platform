# =================================================================
# AI-POWERED ELEARNING PLATFORM - AWS INFRASTRUCTURE
# Quartermasters FZC - Production Deployment
# Terraform Configuration for Scalable, Secure, Multi-Language Platform
# =================================================================

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.4"
    }
  }

  backend "s3" {
    bucket         = "quartermasters-elearning-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "quartermasters-elearning-terraform-locks"
    encrypt        = true
  }
}

# =================================================================
# PROVIDER CONFIGURATION
# =================================================================

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "AI-eLearning-Platform"
      Environment = var.environment
      Owner       = "Quartermasters-FZC"
      ManagedBy   = "Terraform"
      CostCenter  = "Engineering"
      Compliance  = "FISMA-FedRAMP"
    }
  }
}

# =================================================================
# DATA SOURCES
# =================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# =================================================================
# LOCAL VALUES
# =================================================================

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Owner       = "Quartermasters-FZC"
    ManagedBy   = "Terraform"
  }
  
  # AZ configuration for high availability
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
  
  # Database configuration
  db_port = 5432
  redis_port = 6379
  
  # Application ports
  auth_service_port = 3001
  user_service_port = 3002
  content_service_port = 3003
  speech_service_port = 8001
  nlp_service_port = 8002
  translation_service_port = 8003
  
  # AI model storage
  model_bucket_name = "${local.name_prefix}-ai-models"
  content_bucket_name = "${local.name_prefix}-content"
  backup_bucket_name = "${local.name_prefix}-backups"
}

# =================================================================
# NETWORKING
# =================================================================

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "${local.name_prefix}-vpc"
  cidr = var.vpc_cidr
  
  azs             = local.azs
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs
  
  # Database subnets
  database_subnets = var.database_subnet_cidrs
  create_database_subnet_group = true
  create_database_subnet_route_table = true
  
  # NAT Gateway
  enable_nat_gateway = true
  single_nat_gateway = false
  enable_vpn_gateway = false
  
  # DNS
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  # VPC Flow Logs for security monitoring
  enable_flow_log                      = true
  create_flow_log_cloudwatch_iam_role  = true
  create_flow_log_cloudwatch_log_group = true
  flow_log_destination_type            = "cloud-watch-logs"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
    Type = "Production-Network"
  })
}

# =================================================================
# SECURITY GROUPS
# =================================================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  vpc_id      = module.vpc.vpc_id
  description = "Security group for Application Load Balancer"

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

# EKS Security Group
resource "aws_security_group" "eks_cluster" {
  name_prefix = "${local.name_prefix}-eks-cluster-"
  vpc_id      = module.vpc.vpc_id
  description = "Security group for EKS cluster"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eks-cluster-sg"
  })
}

# Database Security Group
resource "aws_security_group" "database" {
  name_prefix = "${local.name_prefix}-db-"
  vpc_id      = module.vpc.vpc_id
  description = "Security group for RDS PostgreSQL"

  ingress {
    description     = "PostgreSQL from EKS"
    from_port       = local.db_port
    to_port         = local.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-sg"
  })
}

# Redis Security Group
resource "aws_security_group" "redis" {
  name_prefix = "${local.name_prefix}-redis-"
  vpc_id      = module.vpc.vpc_id
  description = "Security group for ElastiCache Redis"

  ingress {
    description     = "Redis from EKS"
    from_port       = local.redis_port
    to_port         = local.redis_port
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-sg"
  })
}

# =================================================================
# EKS CLUSTER
# =================================================================

module "eks" {
  source = "terraform-aws-modules/eks/aws"
  
  cluster_name    = "${local.name_prefix}-cluster"
  cluster_version = var.kubernetes_version
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  # Cluster endpoint configuration
  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = true
  cluster_endpoint_public_access_cidrs = var.cluster_endpoint_public_access_cidrs
  
  # Cluster security group
  cluster_security_group_id = aws_security_group.eks_cluster.id
  
  # Cluster addons
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }
  
  # EKS Managed Node Groups
  eks_managed_node_groups = {
    # General purpose nodes for backend services
    general = {
      name = "general"
      
      instance_types = ["t3.large"]
      
      min_size     = 2
      max_size     = 10
      desired_size = 3
      
      disk_size = 50
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "general"
      }
      
      update_config = {
        max_unavailable_percentage = 33
      }
    }
    
    # AI/ML nodes with GPU support
    ai_compute = {
      name = "ai-compute"
      
      instance_types = ["g4dn.xlarge"]
      
      min_size     = 1
      max_size     = 5
      desired_size = 2
      
      disk_size = 100
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "ai-compute"
        Workload    = "ai-ml"
      }
      
      taints = [
        {
          key    = "ai-workload"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      ]
      
      update_config = {
        max_unavailable_percentage = 25
      }
    }
    
    # Memory-optimized nodes for databases and caching
    memory_optimized = {
      name = "memory-optimized"
      
      instance_types = ["r5.large"]
      
      min_size     = 1
      max_size     = 3
      desired_size = 2
      
      disk_size = 50
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "memory-optimized"
        Workload    = "memory-intensive"
      }
      
      update_config = {
        max_unavailable_percentage = 50
      }
    }
  }
  
  # AWS Auth configuration
  manage_aws_auth_configmap = true
  
  aws_auth_roles = var.aws_auth_roles
  aws_auth_users = var.aws_auth_users
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eks-cluster"
  })
}

# =================================================================
# RDS POSTGRESQL (Multi-AZ)
# =================================================================

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# KMS key for database encryption
resource "aws_kms_key" "database" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-kms-key"
  })
}

resource "aws_kms_alias" "database" {
  name          = "alias/${local.name_prefix}-database"
  target_key_id = aws_kms_key.database.key_id
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = module.vpc.database_subnets

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# Parameter Group
resource "aws_db_parameter_group" "postgresql" {
  family = "postgres15"
  name   = "${local.name_prefix}-postgresql-params"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = local.common_tags
}

# RDS Instance
resource "aws_db_instance" "postgresql" {
  identifier = "${local.name_prefix}-postgresql"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.database.arn

  db_name  = "elearning_platform"
  username = "elearning_admin"
  password = random_password.db_password.result
  port     = local.db_port

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.postgresql.name

  # High Availability
  multi_az               = true
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "Sun:04:00-Sun:05:00"

  # Security
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "${local.name_prefix}-postgresql-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  monitoring_interval             = 60
  monitoring_role_arn            = aws_iam_role.rds_monitoring.arn

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_retention_period = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-postgresql"
  })
}

# RDS Monitoring Role
resource "aws_iam_role" "rds_monitoring" {
  name = "${local.name_prefix}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# =================================================================
# ELASTICACHE REDIS
# =================================================================

# Redis Subnet Group
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name_prefix}-redis-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-subnet-group"
  })
}

# Redis Parameter Group
resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7.x"
  name   = "${local.name_prefix}-redis-params"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = local.common_tags
}

# Redis Replication Group
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.name_prefix}-redis"
  description                = "Redis cluster for eLearning platform"

  node_type          = var.redis_node_type
  port               = local.redis_port
  parameter_group_name = aws_elasticache_parameter_group.redis.name

  num_cache_clusters = 2

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  # Security
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth_token.result

  # Backup
  snapshot_retention_limit = 7
  snapshot_window         = "03:00-05:00"

  # Maintenance
  maintenance_window = "sun:05:00-sun:07:00"

  # Logging
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format      = "text"
    log_type        = "slow-log"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis"
  })
}

# Redis auth token
resource "random_password" "redis_auth_token" {
  length  = 32
  special = false
}

# CloudWatch Log Group for Redis
resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/redis/${local.name_prefix}/slow-log"
  retention_in_days = 30

  tags = local.common_tags
}

# =================================================================
# S3 BUCKETS
# =================================================================

# AI Models Bucket
resource "aws_s3_bucket" "ai_models" {
  bucket = local.model_bucket_name

  tags = merge(local.common_tags, {
    Name = "AI-Models-Storage"
    Type = "Private"
  })
}

resource "aws_s3_bucket_versioning" "ai_models" {
  bucket = aws_s3_bucket.ai_models.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "ai_models" {
  bucket = aws_s3_bucket.ai_models.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "ai_models" {
  bucket = aws_s3_bucket.ai_models.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Content Bucket (with CloudFront)
resource "aws_s3_bucket" "content" {
  bucket = local.content_bucket_name

  tags = merge(local.common_tags, {
    Name = "Content-Storage"
    Type = "Public-via-CloudFront"
  })
}

resource "aws_s3_bucket_versioning" "content" {
  bucket = aws_s3_bucket.content.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "content" {
  bucket = aws_s3_bucket.content.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

# Backup Bucket
resource "aws_s3_bucket" "backups" {
  bucket = local.backup_bucket_name

  tags = merge(local.common_tags, {
    Name = "Backup-Storage"
    Type = "Private"
  })
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "backups" {
  bucket = aws_s3_bucket.backups.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "backup_lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }
  }
}

# =================================================================
# APPLICATION LOAD BALANCER
# =================================================================

resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = module.vpc.public_subnets

  enable_deletion_protection = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "alb-logs"
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })
}

# ALB Logs Bucket
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${local.name_prefix}-alb-logs"

  tags = merge(local.common_tags, {
    Name = "ALB-Logs"
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "alb_logs_lifecycle"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}

# =================================================================
# ACM CERTIFICATE
# =================================================================

resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method = "DNS"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-certificate"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# =================================================================
# ROUTE 53
# =================================================================

data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

resource "aws_route53_record" "main" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# =================================================================
# CLOUDWATCH
# =================================================================

# Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/eks/${local.name_prefix}/application"
  retention_in_days = 30

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "ai_services" {
  name              = "/aws/eks/${local.name_prefix}/ai-services"
  retention_in_days = 30

  tags = local.common_tags
}

# =================================================================
# SECRETS MANAGER
# =================================================================

resource "aws_secretsmanager_secret" "database" {
  name                    = "${local.name_prefix}/database/credentials"
  description             = "Database credentials for eLearning platform"
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    username = aws_db_instance.postgresql.username
    password = random_password.db_password.result
    host     = aws_db_instance.postgresql.endpoint
    port     = aws_db_instance.postgresql.port
    dbname   = aws_db_instance.postgresql.db_name
  })
}

resource "aws_secretsmanager_secret" "redis" {
  name                    = "${local.name_prefix}/redis/credentials"
  description             = "Redis credentials for eLearning platform"
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id = aws_secretsmanager_secret.redis.id
  secret_string = jsonencode({
    auth_token = random_password.redis_auth_token.result
    host       = aws_elasticache_replication_group.redis.primary_endpoint_address
    port       = aws_elasticache_replication_group.redis.port
  })
}

# =================================================================
# IAM ROLES FOR SERVICES
# =================================================================

# EKS Service Account Role for accessing AWS services
resource "aws_iam_role" "eks_service_account" {
  name = "${local.name_prefix}-eks-service-account-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = module.eks.oidc_provider_arn
        }
        Condition = {
          StringEquals = {
            "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:sub" = "system:serviceaccount:default:elearning-service-account"
            "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

# Policy for accessing S3, Secrets Manager, etc.
resource "aws_iam_role_policy" "eks_service_account" {
  name = "${local.name_prefix}-eks-service-account-policy"
  role = aws_iam_role.eks_service_account.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.ai_models.arn,
          "${aws_s3_bucket.ai_models.arn}/*",
          aws_s3_bucket.content.arn,
          "${aws_s3_bucket.content.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.database.arn,
          aws_secretsmanager_secret.redis.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          aws_cloudwatch_log_group.application.arn,
          aws_cloudwatch_log_group.ai_services.arn
        ]
      }
    ]
  })
}