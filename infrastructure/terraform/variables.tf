variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment — staging or production"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be 'staging' or 'production'."
  }
}

# ─── Networking ────────────────────────────────────────────────────────────────

variable "enable_dual_nat" {
  description = "Provision a second NAT Gateway in AZ-2 for full HA. Increases cost."
  type        = bool
  default     = false
}

# ─── Database ─────────────────────────────────────────────────────────────────

variable "instance_class_pg" {
  description = "RDS PostgreSQL instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "instance_class_docdb" {
  description = "DocumentDB instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "enable_multi_az" {
  description = "Enable RDS Multi-AZ standby"
  type        = bool
  default     = false
}

variable "enable_read_replica" {
  description = "Create an RDS read replica"
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "RDS and DocumentDB backup retention in days"
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "Enable deletion protection on RDS and DocumentDB"
  type        = bool
  default     = false
}

variable "docdb_instance_count" {
  description = "Number of DocumentDB instances (1 for staging, 3 for production)"
  type        = number
  default     = 1
}

# ─── Kafka ────────────────────────────────────────────────────────────────────

variable "kafka_broker_count" {
  description = "MSK broker count (must equal the number of private subnets)"
  type        = number
  default     = 2
}

variable "kafka_instance_type" {
  description = "MSK broker instance type"
  type        = string
  default     = "kafka.t3.small"
}

# ─── ECS ──────────────────────────────────────────────────────────────────────

variable "ecr_repo_base_url" {
  description = "ECR repository base URL (e.g. 123456789.dkr.ecr.us-east-1.amazonaws.com/hotel-key)"
  type        = string
}

variable "image_tag" {
  description = "Container image tag to deploy across all services"
  type        = string
  default     = "latest"
}

# ─── ALB ──────────────────────────────────────────────────────────────────────

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for the ALB HTTPS listener"
  type        = string
}

# ─── Monitoring ───────────────────────────────────────────────────────────────

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN to receive CloudWatch alarm notifications"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "CloudWatch log group retention in days"
  type        = number
  default     = 30
}
