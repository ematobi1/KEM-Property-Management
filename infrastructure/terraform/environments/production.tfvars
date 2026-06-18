environment = "production"

# Networking — dual NAT for full AZ resilience
enable_dual_nat = true

# Database — larger instances, Multi-AZ, read replica, 30-day retention
instance_class_pg     = "db.r6g.large"
instance_class_docdb  = "db.r6g.large"
enable_multi_az       = true
enable_read_replica   = true
backup_retention_days = 30
deletion_protection   = true
docdb_instance_count  = 3

# Kafka — production-grade brokers
kafka_broker_count  = 2
kafka_instance_type = "kafka.m5.large"

# ECS
image_tag = "production"

# Monitoring — longer log retention
log_retention_days = 90
