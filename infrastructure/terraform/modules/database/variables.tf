variable "environment" {
  description = "Deployment environment"
  type        = string
}

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
  description = "Enable RDS Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "enable_read_replica" {
  description = "Create an RDS read replica"
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "Enable deletion protection (should be true for production)"
  type        = bool
  default     = false
}

variable "docdb_instance_count" {
  description = "Number of DocumentDB instances"
  type        = number
  default     = 1
}

variable "database_subnet_ids" {
  description = "Subnet IDs for DB subnet groups"
  type        = list(string)
}

variable "sg_database_id" {
  description = "Security group ID to attach to RDS and DocumentDB"
  type        = string
}

variable "postgres_secret_arn" {
  description = "Secrets Manager ARN for the PostgreSQL credentials JSON ({ username, password, ... })"
  type        = string
}

variable "docdb_secret_arn" {
  description = "Secrets Manager ARN for the DocumentDB credentials JSON ({ username, password, ... })"
  type        = string
}
