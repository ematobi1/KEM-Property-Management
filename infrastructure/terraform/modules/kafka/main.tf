resource "aws_msk_configuration" "main" {
  kafka_versions = ["3.5.1"]
  name           = "hotel-key-${var.environment}"
  description    = "Hotel Key MSK configuration"

  server_properties = <<-PROPERTIES
    auto.create.topics.enable=true
    default.replication.factor=2
    min.insync.replicas=1
    num.partitions=3
    log.retention.hours=168
    offsets.topic.replication.factor=2
  PROPERTIES
}

resource "aws_msk_cluster" "main" {
  cluster_name           = "hotel-key-${var.environment}"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = var.broker_count

  broker_node_group_info {
    instance_type  = var.instance_type
    client_subnets = slice(var.private_subnet_ids, 0, var.broker_count)
    security_groups = [var.sg_kafka_id]

    storage_info {
      ebs_storage_info {
        volume_size = 50
      }
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  open_monitoring {
    prometheus {
      jmx_exporter {
        enabled_in_broker = true
      }
      node_exporter {
        enabled_in_broker = true
      }
    }
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = "/hotel-key/${var.environment}/msk"
      }
    }
  }

  configuration_info {
    arn      = aws_msk_configuration.main.arn
    revision = aws_msk_configuration.main.latest_revision
  }

  tags = { Name = "hotel-key-${var.environment}-msk" }
}

resource "aws_cloudwatch_log_group" "msk" {
  name              = "/hotel-key/${var.environment}/msk"
  retention_in_days = 30

  tags = { Name = "hotel-key-${var.environment}-msk-logs" }
}
