module "secrets" {
  source      = "./modules/secrets"
  environment = var.environment
}

module "networking" {
  source          = "./modules/networking"
  environment     = var.environment
  enable_dual_nat = var.enable_dual_nat
}

module "alb" {
  source              = "./modules/alb"
  environment         = var.environment
  vpc_id              = module.networking.vpc_id
  public_subnet_ids   = module.networking.public_subnet_ids
  sg_alb_id           = module.networking.sg_alb_id
  acm_certificate_arn = var.acm_certificate_arn
}

module "database" {
  source = "./modules/database"

  environment          = var.environment
  instance_class_pg    = var.instance_class_pg
  instance_class_docdb = var.instance_class_docdb
  enable_multi_az      = var.enable_multi_az
  enable_read_replica  = var.enable_read_replica
  backup_retention_days = var.backup_retention_days
  deletion_protection  = var.deletion_protection
  docdb_instance_count = var.docdb_instance_count

  database_subnet_ids = module.networking.database_subnet_ids
  sg_database_id      = module.networking.sg_database_id

  # The module decodes username/password from each JSON secret via jsondecode().
  postgres_secret_arn = module.secrets.postgres_secret_arn
  docdb_secret_arn    = module.secrets.docdb_secret_arn

  depends_on = [module.secrets]
}

module "kafka" {
  source = "./modules/kafka"

  environment        = var.environment
  broker_count       = var.kafka_broker_count
  instance_type      = var.kafka_instance_type
  private_subnet_ids = module.networking.private_subnet_ids
  sg_kafka_id        = module.networking.sg_kafka_id
}

module "ecs" {
  source = "./modules/ecs"

  environment          = var.environment
  aws_region           = var.aws_region
  vpc_id               = module.networking.vpc_id
  private_subnet_ids   = module.networking.private_subnet_ids
  sg_ecs_id            = module.networking.sg_ecs_id
  ecr_repo_base_url    = var.ecr_repo_base_url
  image_tag            = var.image_tag
  target_group_api_arn = module.alb.target_group_api_arn

  secrets_arns = module.secrets.secret_arns

  depends_on = [module.secrets, module.database, module.kafka]
}

module "monitoring" {
  source = "./modules/monitoring"

  environment             = var.environment
  ecs_cluster_name        = module.ecs.cluster_name
  rds_identifier          = "hotel-key-${var.environment}-postgres"
  alb_arn_suffix          = module.alb.alb_arn
  target_group_arn_suffix = module.alb.target_group_api_arn
  alarm_sns_topic_arn     = var.alarm_sns_topic_arn
  log_retention_days      = var.log_retention_days

  service_names = [
    "api-gateway",
    "reservation-service",
    "room-service",
    "billing-service",
    "housekeeping-service",
    "channel-sync-service",
    "rates-service",
    "reporting-service",
    "guest-profile-service",
  ]

  depends_on = [module.ecs]
}
