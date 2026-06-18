locals {
  secret_definitions = {
    "database/postgres" = {
      description = "PostgreSQL master credentials and connection info"
    }
    "database/docdb" = {
      description = "DocumentDB master credentials and connection info"
    }
    "auth/jwt-secret" = {
      description = "JWT signing secret for API authentication (min 64 chars)"
    }
    "auth/digitcard-jwt-secret" = {
      description = "JWT signing secret for DigitCard token issuance — separate from main auth secret"
    }
    "auth/lock-vendor-api-key" = {
      description = "API key for lock vendor hardware integration"
    }
    "encryption/pii-key" = {
      description = "AES-256-GCM encryption key for PII fields (exactly 64 hex chars / 32 bytes)"
    }
  }
}

resource "aws_secretsmanager_secret" "main" {
  for_each = local.secret_definitions

  name                    = "hotel-key/${var.environment}/${each.key}"
  description             = each.value.description
  recovery_window_in_days = 7

  tags = {
    environment = var.environment
    project     = "hotel-key"
  }
}

# Structured placeholder for PostgreSQL — update host/password before first deploy.
resource "aws_secretsmanager_secret_version" "postgres" {
  secret_id = aws_secretsmanager_secret.main["database/postgres"].id

  secret_string = jsonencode({
    username = "pms_app"
    password = "REPLACE_BEFORE_DEPLOY"
    host     = "POPULATED_AFTER_TERRAFORM_APPLY"
    port     = 5432
    dbname   = "hotel_key"
  })

  # Prevent Terraform from reverting manual rotations or post-deploy updates.
  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Structured placeholder for DocumentDB.
resource "aws_secretsmanager_secret_version" "docdb" {
  secret_id = aws_secretsmanager_secret.main["database/docdb"].id

  secret_string = jsonencode({
    username = "pms_app"
    password = "REPLACE_BEFORE_DEPLOY"
    host     = "POPULATED_AFTER_TERRAFORM_APPLY"
    port     = 27017
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# String-valued placeholders — replace with real secrets before deploying services.
resource "aws_secretsmanager_secret_version" "string_placeholders" {
  for_each = toset([
    "auth/jwt-secret",
    "auth/digitcard-jwt-secret",
    "auth/lock-vendor-api-key",
    "encryption/pii-key",
  ])

  secret_id     = aws_secretsmanager_secret.main[each.key].id
  secret_string = "REPLACE_BEFORE_DEPLOY"

  lifecycle {
    ignore_changes = [secret_string]
  }
}
