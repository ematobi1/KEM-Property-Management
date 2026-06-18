output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs (AZ-1, AZ-2)"
  value       = [aws_subnet.public_az1.id, aws_subnet.public_az2.id]
}

output "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks (AZ-1, AZ-2)"
  value       = [aws_subnet.private_az1.id, aws_subnet.private_az2.id]
}

output "database_subnet_ids" {
  description = "Database subnet IDs for RDS and DocumentDB (AZ-1, AZ-2)"
  value       = [aws_subnet.database_az1.id, aws_subnet.database_az2.id]
}

output "sg_alb_id" {
  description = "Security group ID for the Application Load Balancer"
  value       = aws_security_group.alb.id
}

output "sg_ecs_id" {
  description = "Security group ID for ECS Fargate tasks"
  value       = aws_security_group.ecs.id
}

output "sg_database_id" {
  description = "Security group ID for RDS and DocumentDB"
  value       = aws_security_group.database.id
}

output "sg_kafka_id" {
  description = "Security group ID for MSK Kafka"
  value       = aws_security_group.kafka.id
}
