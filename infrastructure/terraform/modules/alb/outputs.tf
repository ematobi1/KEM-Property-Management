output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "ALB Route 53 hosted zone ID"
  value       = aws_lb.main.zone_id
}

output "target_group_api_arn" {
  description = "Target group ARN for the api-gateway service"
  value       = aws_lb_target_group.api.arn
}
