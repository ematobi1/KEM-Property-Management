output "alb_dns_name" {
  description = "ALB DNS name — point your domain CNAME here"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "ALB Route 53 hosted zone ID (for alias records)"
  value       = module.alb.alb_zone_id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL primary endpoint"
  value       = module.database.rds_endpoint
  sensitive   = true
}

output "rds_read_endpoint" {
  description = "RDS PostgreSQL read replica endpoint (empty if not enabled)"
  value       = module.database.rds_read_endpoint
  sensitive   = true
}

output "docdb_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = module.database.docdb_endpoint
  sensitive   = true
}

output "msk_bootstrap_brokers_tls" {
  description = "MSK TLS bootstrap broker connection string"
  value       = module.kafka.bootstrap_brokers_tls
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "secret_arns" {
  description = "Map of secret key to Secrets Manager ARN"
  value       = module.secrets.secret_arns
  sensitive   = true
}

output "monitoring_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.monitoring.dashboard_url
}
