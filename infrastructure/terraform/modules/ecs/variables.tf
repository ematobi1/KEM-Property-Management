variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS task placement"
  type        = list(string)
}

variable "sg_ecs_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "ecr_repo_base_url" {
  description = "ECR repository base URL (e.g. 123456789.dkr.ecr.us-east-1.amazonaws.com/hotel-key)"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "target_group_api_arn" {
  description = "ALB target group ARN for the api-gateway service"
  type        = string
}

variable "secrets_arns" {
  description = "Map of secret name to Secrets Manager ARN, injected into all task definitions"
  type        = map(string)
  default     = {}
}
