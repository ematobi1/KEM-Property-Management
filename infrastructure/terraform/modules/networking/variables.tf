variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "enable_dual_nat" {
  description = "Provision a NAT Gateway in both AZs"
  type        = bool
  default     = false
}
