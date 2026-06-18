variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "broker_count" {
  description = "Number of MSK broker nodes (must equal the number of private subnets supplied)"
  type        = number
  default     = 2
}

variable "instance_type" {
  description = "MSK broker instance type"
  type        = string
  default     = "kafka.t3.small"
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for broker placement (one per broker)"
  type        = list(string)
}

variable "sg_kafka_id" {
  description = "Security group ID for MSK brokers"
  type        = string
}
