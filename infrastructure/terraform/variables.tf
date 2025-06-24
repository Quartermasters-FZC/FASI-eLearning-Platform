# =================================================================
# TERRAFORM VARIABLES
# AI-Powered eLearning Platform - Quartermasters FZC
# =================================================================

# =================================================================
# GENERAL CONFIGURATION
# =================================================================

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "quartermasters-elearning"
  
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
  
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "elearning.quartermasters.me"
}

# =================================================================
# NETWORKING CONFIGURATION
# =================================================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
  
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  
  validation {
    condition     = length(var.public_subnet_cidrs) >= 2
    error_message = "At least 2 public subnets are required for high availability."
  }
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
  
  validation {
    condition     = length(var.private_subnet_cidrs) >= 2
    error_message = "At least 2 private subnets are required for high availability."
  }
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.20.0/24", "10.0.21.0/24", "10.0.22.0/24"]
  
  validation {
    condition     = length(var.database_subnet_cidrs) >= 2
    error_message = "At least 2 database subnets are required for RDS Multi-AZ."
  }
}

# =================================================================
# KUBERNETES CONFIGURATION
# =================================================================

variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
  
  validation {
    condition     = can(regex("^1\\.(2[7-9]|[3-9][0-9])$", var.kubernetes_version))
    error_message = "Kubernetes version must be 1.27 or higher."
  }
}

variable "cluster_endpoint_public_access_cidrs" {
  description = "List of CIDR blocks that can access the EKS cluster API endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
  
  validation {
    condition     = length(var.cluster_endpoint_public_access_cidrs) > 0
    error_message = "At least one CIDR block must be specified for cluster access."
  }
}

variable "aws_auth_roles" {
  description = "List of role mappings for aws-auth configmap"
  type = list(object({
    rolearn  = string
    username = string
    groups   = list(string)
  }))
  default = []
}

variable "aws_auth_users" {
  description = "List of user mappings for aws-auth configmap"
  type = list(object({
    userarn  = string
    username = string
    groups   = list(string)
  }))
  default = []
}

# =================================================================
# DATABASE CONFIGURATION
# =================================================================

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.large"
  
  validation {
    condition     = can(regex("^db\\.", var.db_instance_class))
    error_message = "Database instance class must start with 'db.'."
  }
}

variable "db_allocated_storage" {
  description = "Initial allocated storage for RDS instance (GB)"
  type        = number
  default     = 100
  
  validation {
    condition     = var.db_allocated_storage >= 20 && var.db_allocated_storage <= 65536
    error_message = "Database allocated storage must be between 20 and 65536 GB."
  }
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS instance (GB)"
  type        = number
  default     = 1000
  
  validation {
    condition     = var.db_max_allocated_storage >= var.db_allocated_storage
    error_message = "Maximum allocated storage must be greater than or equal to initial allocated storage."
  }
}

variable "db_backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 30
  
  validation {
    condition     = var.db_backup_retention_period >= 1 && var.db_backup_retention_period <= 35
    error_message = "Backup retention period must be between 1 and 35 days."
  }
}

variable "db_deletion_protection" {
  description = "Enable deletion protection for RDS instance"
  type        = bool
  default     = true
}

# =================================================================
# REDIS CONFIGURATION
# =================================================================

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r6g.large"
  
  validation {
    condition     = can(regex("^cache\\.", var.redis_node_type))
    error_message = "Redis node type must start with 'cache.'."
  }
}

variable "redis_num_cache_clusters" {
  description = "Number of cache clusters for Redis replication group"
  type        = number
  default     = 2
  
  validation {
    condition     = var.redis_num_cache_clusters >= 2 && var.redis_num_cache_clusters <= 6
    error_message = "Number of cache clusters must be between 2 and 6."
  }
}

variable "redis_snapshot_retention_limit" {
  description = "Number of days to retain Redis snapshots"
  type        = number
  default     = 7
  
  validation {
    condition     = var.redis_snapshot_retention_limit >= 0 && var.redis_snapshot_retention_limit <= 35
    error_message = "Snapshot retention limit must be between 0 and 35 days."
  }
}

# =================================================================
# STORAGE CONFIGURATION
# =================================================================

variable "s3_bucket_names" {
  description = "Custom S3 bucket names"
  type = object({
    ai_models = optional(string)
    content   = optional(string)
    backups   = optional(string)
    alb_logs  = optional(string)
  })
  default = {}
}

variable "s3_lifecycle_rules" {
  description = "S3 lifecycle rules configuration"
  type = object({
    content_transition_days = optional(number, 30)
    backup_ia_days         = optional(number, 30)
    backup_glacier_days    = optional(number, 90)
    backup_deep_archive_days = optional(number, 365)
    log_expiration_days    = optional(number, 90)
  })
  default = {}
}

# =================================================================
# MONITORING CONFIGURATION
# =================================================================

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 30
  
  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653
    ], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch log retention value."
  }
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

# =================================================================
# SECURITY CONFIGURATION
# =================================================================

variable "enable_encryption_at_rest" {
  description = "Enable encryption at rest for all applicable services"
  type        = bool
  default     = true
}

variable "enable_encryption_in_transit" {
  description = "Enable encryption in transit for all applicable services"
  type        = bool
  default     = true
}

variable "kms_key_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 7
  
  validation {
    condition     = var.kms_key_deletion_window >= 7 && var.kms_key_deletion_window <= 30
    error_message = "KMS key deletion window must be between 7 and 30 days."
  }
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the application"
  type        = list(string)
  default     = ["0.0.0.0/0"]
  
  validation {
    condition     = length(var.allowed_cidr_blocks) > 0
    error_message = "At least one CIDR block must be specified."
  }
}

# =================================================================
# SCALING CONFIGURATION
# =================================================================

variable "eks_node_groups" {
  description = "EKS managed node groups configuration"
  type = map(object({
    instance_types = list(string)
    min_size      = number
    max_size      = number
    desired_size  = number
    disk_size     = number
    labels        = map(string)
    taints = list(object({
      key    = string
      value  = string
      effect = string
    }))
  }))
  default = {
    general = {
      instance_types = ["t3.large"]
      min_size      = 2
      max_size      = 10
      desired_size  = 3
      disk_size     = 50
      labels = {
        NodeGroup = "general"
      }
      taints = []
    }
    ai_compute = {
      instance_types = ["g4dn.xlarge"]
      min_size      = 1
      max_size      = 5
      desired_size  = 2
      disk_size     = 100
      labels = {
        NodeGroup = "ai-compute"
        Workload  = "ai-ml"
      }
      taints = [
        {
          key    = "ai-workload"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      ]
    }
  }
}

variable "enable_cluster_autoscaler" {
  description = "Enable Kubernetes cluster autoscaler"
  type        = bool
  default     = true
}

variable "enable_horizontal_pod_autoscaler" {
  description = "Enable Horizontal Pod Autoscaler"
  type        = bool
  default     = true
}

# =================================================================
# APPLICATION CONFIGURATION
# =================================================================

variable "application_environment_variables" {
  description = "Environment variables for applications"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "enable_ssl_redirect" {
  description = "Enable automatic HTTPS redirect"
  type        = bool
  default     = true
}

variable "ssl_certificate_arn" {
  description = "ARN of existing SSL certificate (optional)"
  type        = string
  default     = ""
}

# =================================================================
# COST OPTIMIZATION
# =================================================================

variable "enable_cost_optimization" {
  description = "Enable cost optimization features"
  type        = bool
  default     = true
}

variable "spot_instance_percentage" {
  description = "Percentage of spot instances to use in node groups"
  type        = number
  default     = 0
  
  validation {
    condition     = var.spot_instance_percentage >= 0 && var.spot_instance_percentage <= 100
    error_message = "Spot instance percentage must be between 0 and 100."
  }
}

# =================================================================
# BACKUP CONFIGURATION
# =================================================================

variable "backup_schedule" {
  description = "Backup schedule configuration"
  type = object({
    database_backup_window      = optional(string, "03:00-04:00")
    database_maintenance_window = optional(string, "Sun:04:00-Sun:05:00")
    redis_backup_window        = optional(string, "03:00-05:00")
    redis_maintenance_window   = optional(string, "sun:05:00-sun:07:00")
  })
  default = {}
}

# =================================================================
# DISASTER RECOVERY
# =================================================================

variable "enable_cross_region_backup" {
  description = "Enable cross-region backup for disaster recovery"
  type        = bool
  default     = false
}

variable "backup_region" {
  description = "Secondary region for cross-region backups"
  type        = string
  default     = "us-west-2"
}

# =================================================================
# COMPLIANCE CONFIGURATION
# =================================================================

variable "compliance_mode" {
  description = "Compliance mode (fisma, fedramp, soc2, hipaa)"
  type        = string
  default     = "fisma"
  
  validation {
    condition     = contains(["fisma", "fedramp", "soc2", "hipaa", "none"], var.compliance_mode)
    error_message = "Compliance mode must be one of: fisma, fedramp, soc2, hipaa, none."
  }
}

variable "enable_compliance_monitoring" {
  description = "Enable compliance monitoring and reporting"
  type        = bool
  default     = true
}

# =================================================================
# FEATURE FLAGS
# =================================================================

variable "feature_flags" {
  description = "Feature flags for optional components"
  type = object({
    enable_elasticsearch     = optional(bool, false)
    enable_prometheus       = optional(bool, true)
    enable_grafana         = optional(bool, true)
    enable_jaeger          = optional(bool, true)
    enable_certificate_manager = optional(bool, true)
    enable_external_dns    = optional(bool, false)
    enable_service_mesh    = optional(bool, false)
  })
  default = {}
}

# =================================================================
# TAGS
# =================================================================

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}