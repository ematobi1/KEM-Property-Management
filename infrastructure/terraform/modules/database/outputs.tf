output "rds_endpoint" {
  description = "RDS PostgreSQL primary endpoint (host:port)"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_read_endpoint" {
  description = "RDS PostgreSQL read replica endpoint (empty string if not enabled)"
  value       = var.enable_read_replica ? aws_db_instance.postgres_replica[0].endpoint : ""
}

output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = aws_db_instance.postgres.port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.postgres.db_name
}

output "docdb_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = aws_docdb_cluster.main.endpoint
}

output "docdb_port" {
  description = "DocumentDB port"
  value       = aws_docdb_cluster.main.port
}
