data "aws_secretsmanager_secret_version" "postgres" {
  secret_id = var.postgres_secret_arn
}

data "aws_secretsmanager_secret_version" "docdb" {
  secret_id = var.docdb_secret_arn
}

locals {
  pg_creds    = jsondecode(data.aws_secretsmanager_secret_version.postgres.secret_string)
  docdb_creds = jsondecode(data.aws_secretsmanager_secret_version.docdb.secret_string)
}

# ─── Shared Subnet Group ──────────────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name       = "hotel-key-${var.environment}"
  subnet_ids = var.database_subnet_ids

  tags = { Name = "hotel-key-${var.environment}-db-subnet-group" }
}

# ─── RDS Parameter Group (enforce SSL) ───────────────────────────────────────

resource "aws_db_parameter_group" "postgres" {
  name   = "hotel-key-${var.environment}-pg15"
  family = "postgres15"

  parameter {
    name         = "rds.force_ssl"
    value        = "1"
    apply_method = "immediate"
  }

  tags = { Name = "hotel-key-${var.environment}-pg15-params" }
}

# ─── RDS Enhanced Monitoring Role ────────────────────────────────────────────

resource "aws_iam_role" "rds_monitoring" {
  name = "hotel-key-${var.environment}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "monitoring.rds.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ─── RDS PostgreSQL Primary ───────────────────────────────────────────────────

resource "aws_db_instance" "postgres" {
  identifier     = "hotel-key-${var.environment}-postgres"
  engine         = "postgres"
  engine_version = "15"
  instance_class = var.instance_class_pg
  db_name        = "hotel_key"
  username       = local.pg_creds["username"]
  password       = local.pg_creds["password"]

  allocated_storage     = 50
  max_allocated_storage = 200
  storage_type          = "gp3"
  storage_encrypted     = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.sg_database_id]
  publicly_accessible    = false
  multi_az               = var.enable_multi_az

  parameter_group_name = aws_db_parameter_group.postgres.name

  backup_retention_period = var.backup_retention_days
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = !var.deletion_protection
  final_snapshot_identifier = var.deletion_protection ? "hotel-key-${var.environment}-final" : null

  tags = { Name = "hotel-key-${var.environment}-postgres" }
}

# ─── RDS Read Replica (production only) ──────────────────────────────────────

resource "aws_db_instance" "postgres_replica" {
  count = var.enable_read_replica ? 1 : 0

  identifier             = "hotel-key-${var.environment}-postgres-replica"
  replicate_source_db    = aws_db_instance.postgres.identifier
  instance_class         = var.instance_class_pg
  storage_encrypted      = true
  publicly_accessible    = false
  vpc_security_group_ids = [var.sg_database_id]
  parameter_group_name   = aws_db_parameter_group.postgres.name
  skip_final_snapshot    = true

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  tags = { Name = "hotel-key-${var.environment}-postgres-replica" }
}

# ─── DocumentDB ──────────────────────────────────────────────────────────────

resource "aws_docdb_subnet_group" "main" {
  name       = "hotel-key-${var.environment}-docdb"
  subnet_ids = var.database_subnet_ids

  tags = { Name = "hotel-key-${var.environment}-docdb-subnet-group" }
}

resource "aws_docdb_cluster_parameter_group" "main" {
  family      = "docdb5.0"
  name        = "hotel-key-${var.environment}-docdb"
  description = "TLS enforced"

  parameter {
    name  = "tls"
    value = "enabled"
  }
}

resource "aws_docdb_cluster" "main" {
  cluster_identifier              = "hotel-key-${var.environment}-docdb"
  engine                          = "docdb"
  engine_version                  = "5.0.0"
  master_username                 = local.docdb_creds["username"]
  master_password                 = local.docdb_creds["password"]
  db_subnet_group_name            = aws_docdb_subnet_group.main.name
  vpc_security_group_ids          = [var.sg_database_id]
  storage_encrypted               = true
  backup_retention_period         = var.backup_retention_days
  preferred_backup_window         = "03:00-04:00"
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.main.name
  skip_final_snapshot             = !var.deletion_protection

  tags = { Name = "hotel-key-${var.environment}-docdb" }
}

resource "aws_docdb_cluster_instance" "main" {
  count              = var.docdb_instance_count
  identifier         = "hotel-key-${var.environment}-docdb-${count.index}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.instance_class_docdb

  tags = { Name = "hotel-key-${var.environment}-docdb-${count.index}" }
}
