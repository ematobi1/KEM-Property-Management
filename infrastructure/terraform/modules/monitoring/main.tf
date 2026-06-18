locals {
  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
}

# ─── CloudWatch Log Groups (one per service) ──────────────────────────────────

resource "aws_cloudwatch_log_group" "service" {
  for_each = toset(var.service_names)

  name              = "/hotel-key/${var.environment}/${each.key}"
  retention_in_days = var.log_retention_days

  tags = { service = each.key, environment = var.environment }
}

# ─── CloudWatch Dashboard ─────────────────────────────────────────────────────

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "hotel-key-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      # ── ECS CPU per service ──────────────────────────────────────────────────
      {
        type   = "metric"
        x      = 0; y = 0; width = 12; height = 6
        properties = {
          title  = "ECS CPU Utilization by Service"
          period = 60
          stat   = "Average"
          view   = "timeSeries"
          metrics = [
            for svc in var.service_names : [
              "AWS/ECS", "CPUUtilization",
              "ClusterName", var.ecs_cluster_name,
              "ServiceName", "hotel-key-${var.environment}-${svc}",
              { label = svc }
            ]
          ]
        }
      },
      # ── ECS Memory per service ───────────────────────────────────────────────
      {
        type   = "metric"
        x      = 12; y = 0; width = 12; height = 6
        properties = {
          title  = "ECS Memory Utilization by Service"
          period = 60
          stat   = "Average"
          view   = "timeSeries"
          metrics = [
            for svc in var.service_names : [
              "AWS/ECS", "MemoryUtilization",
              "ClusterName", var.ecs_cluster_name,
              "ServiceName", "hotel-key-${var.environment}-${svc}",
              { label = svc }
            ]
          ]
        }
      },
      # ── RDS CPU ──────────────────────────────────────────────────────────────
      {
        type   = "metric"
        x      = 0; y = 6; width = 8; height = 6
        properties = {
          title  = "RDS CPU Utilization"
          period = 60
          stat   = "Average"
          view   = "timeSeries"
          metrics = [[
            "AWS/RDS", "CPUUtilization",
            "DBInstanceIdentifier", var.rds_identifier
          ]]
        }
      },
      # ── RDS Connections ───────────────────────────────────────────────────────
      {
        type   = "metric"
        x      = 8; y = 6; width = 8; height = 6
        properties = {
          title  = "RDS Database Connections"
          period = 60
          stat   = "Average"
          view   = "timeSeries"
          metrics = [[
            "AWS/RDS", "DatabaseConnections",
            "DBInstanceIdentifier", var.rds_identifier
          ]]
        }
      },
      # ── RDS Free Storage ─────────────────────────────────────────────────────
      {
        type   = "metric"
        x      = 16; y = 6; width = 8; height = 6
        properties = {
          title  = "RDS Freeable Memory & Free Storage"
          period = 60
          stat   = "Average"
          view   = "timeSeries"
          metrics = [
            ["AWS/RDS", "FreeableMemory", "DBInstanceIdentifier", var.rds_identifier, { label = "Freeable Memory" }],
            ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", var.rds_identifier, { label = "Free Storage" }]
          ]
        }
      },
      # ── RDS IOPS ─────────────────────────────────────────────────────────────
      {
        type   = "metric"
        x      = 0; y = 12; width = 12; height = 6
        properties = {
          title  = "RDS Read/Write IOPS"
          period = 60
          stat   = "Average"
          view   = "timeSeries"
          metrics = [
            ["AWS/RDS", "ReadIOPS", "DBInstanceIdentifier", var.rds_identifier, { label = "Read IOPS" }],
            ["AWS/RDS", "WriteIOPS", "DBInstanceIdentifier", var.rds_identifier, { label = "Write IOPS" }]
          ]
        }
      },
      # ── ALB Request Count ─────────────────────────────────────────────────────
      {
        type   = "metric"
        x      = 12; y = 12; width = 12; height = 6
        properties = {
          title  = "ALB Request Count & 5xx Rate"
          period = 60
          view   = "timeSeries"
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix, { stat = "Sum", label = "Requests" }],
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", var.alb_arn_suffix, { stat = "Sum", label = "5xx Errors" }]
          ]
        }
      },
      # ── ALB Latency ───────────────────────────────────────────────────────────
      {
        type   = "metric"
        x      = 0; y = 18; width = 12; height = 6
        properties = {
          title  = "ALB Target Response Time (p50 / p95 / p99)"
          period = 60
          view   = "timeSeries"
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix, { stat = "p50", label = "p50" }],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix, { stat = "p95", label = "p95" }],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix, { stat = "p99", label = "p99" }]
          ]
        }
      },
      # ── MSK Consumer Lag ──────────────────────────────────────────────────────
      {
        type   = "metric"
        x      = 12; y = 18; width = 12; height = 6
        properties = {
          title  = "MSK Consumer Lag"
          period = 60
          stat   = "Maximum"
          view   = "timeSeries"
          metrics = [[
            "AWS/Kafka", "EstimatedMaxTimeLag",
            "Cluster Name", "hotel-key-${var.environment}"
          ]]
        }
      }
    ]
  })
}

# ─── Alarms ───────────────────────────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  for_each = toset(var.service_names)

  alarm_name          = "hotel-key-${var.environment}-${each.key}-cpu-high"
  alarm_description   = "ECS service ${each.key} CPU > 85% for 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  period              = 60
  threshold           = 85
  statistic           = "Average"
  namespace           = "AWS/ECS"
  metric_name         = "CPUUtilization"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = "hotel-key-${var.environment}-${each.key}"
  }

  alarm_actions             = local.alarm_actions
  ok_actions                = local.alarm_actions
  treat_missing_data        = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "hotel-key-${var.environment}-rds-cpu-high"
  alarm_description   = "RDS CPU > 80% for 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  period              = 60
  threshold           = 80
  statistic           = "Average"
  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"

  dimensions = {
    DBInstanceIdentifier = var.rds_identifier
  }

  alarm_actions      = local.alarm_actions
  ok_actions         = local.alarm_actions
  treat_missing_data = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "hotel-key-${var.environment}-rds-storage-low"
  alarm_description   = "RDS free storage < 10 GB"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  period              = 300
  threshold           = 10737418240 # 10 GB in bytes
  statistic           = "Average"
  namespace           = "AWS/RDS"
  metric_name         = "FreeStorageSpace"

  dimensions = {
    DBInstanceIdentifier = var.rds_identifier
  }

  alarm_actions      = local.alarm_actions
  ok_actions         = local.alarm_actions
  treat_missing_data = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_high" {
  alarm_name          = "hotel-key-${var.environment}-alb-5xx-high"
  alarm_description   = "ALB 5xx error rate > 5% for 3 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  period              = 60
  threshold           = 5
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions

  metric_query {
    id          = "error_rate"
    expression  = "100 * errors / requests"
    label       = "5xx Error Rate (%)"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      namespace   = "AWS/ApplicationELB"
      metric_name = "HTTPCode_ELB_5XX_Count"
      dimensions  = { LoadBalancer = var.alb_arn_suffix }
      period      = 60
      stat        = "Sum"
    }
  }

  metric_query {
    id = "requests"
    metric {
      namespace   = "AWS/ApplicationELB"
      metric_name = "RequestCount"
      dimensions  = { LoadBalancer = var.alb_arn_suffix }
      period      = 60
      stat        = "Sum"
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_p99_latency" {
  alarm_name          = "hotel-key-${var.environment}-alb-p99-latency"
  alarm_description   = "ALB p99 target response time > 3 seconds for 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  period              = 60
  threshold           = 3
  extended_statistic  = "p99"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "TargetResponseTime"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  alarm_actions      = local.alarm_actions
  ok_actions         = local.alarm_actions
  treat_missing_data = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "msk_consumer_lag" {
  alarm_name          = "hotel-key-${var.environment}-msk-consumer-lag"
  alarm_description   = "MSK consumer lag > 10,000 for 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  period              = 60
  threshold           = 10000
  statistic           = "Maximum"
  namespace           = "AWS/Kafka"
  metric_name         = "EstimatedMaxTimeLag"

  dimensions = {
    "Cluster Name" = "hotel-key-${var.environment}"
  }

  alarm_actions      = local.alarm_actions
  ok_actions         = local.alarm_actions
  treat_missing_data = "notBreaching"
}
