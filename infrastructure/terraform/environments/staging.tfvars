environment = "staging"

# Networking
enable_dual_nat = false

# Database — small instances, no redundancy, short retention
instance_class_pg     = "db.t3.medium"
instance_class_docdb  = "db.t3.medium"
enable_multi_az       = false
enable_read_replica   = false
backup_retention_days = 7
deletion_protection   = false
docdb_instance_count  = 1

# Kafka — minimum footprint
kafka_broker_count  = 2
kafka_instance_type = "kafka.t3.small"

# ECS
image_tag = "staging"

# Monitoring
log_retention_days = 30
