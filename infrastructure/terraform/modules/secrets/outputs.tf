output "secret_arns" {
  description = "Map of secret key to Secrets Manager ARN"
  value       = { for k, v in aws_secretsmanager_secret.main : k => v.arn }
}

output "postgres_secret_arn" {
  description = "Secrets Manager ARN for PostgreSQL credentials"
  value       = aws_secretsmanager_secret.main["database/postgres"].arn
}

output "docdb_secret_arn" {
  description = "Secrets Manager ARN for DocumentDB credentials"
  value       = aws_secretsmanager_secret.main["database/docdb"].arn
}

output "jwt_secret_arn" {
  description = "Secrets Manager ARN for JWT signing secret"
  value       = aws_secretsmanager_secret.main["auth/jwt-secret"].arn
}

output "digitcard_jwt_secret_arn" {
  description = "Secrets Manager ARN for Digitcard JWT secret"
  value       = aws_secretsmanager_secret.main["auth/digitcard-jwt-secret"].arn
}

output "pii_key_arn" {
  description = "Secrets Manager ARN for PII encryption key"
  value       = aws_secretsmanager_secret.main["encryption/pii-key"].arn
}
