locals {
  services = {
    api-gateway = {
      container_port = 4000
      cpu            = 512
      memory         = 1024
      min_tasks      = 2
      max_tasks      = 6
      attach_to_alb  = true
    }
    reservation-service = {
      container_port = 4001
      cpu            = 256
      memory         = 512
      min_tasks      = 2
      max_tasks      = 4
      attach_to_alb  = false
    }
    room-service = {
      container_port = 4002
      cpu            = 256
      memory         = 512
      min_tasks      = 1
      max_tasks      = 3
      attach_to_alb  = false
    }
    billing-service = {
      container_port = 4003
      cpu            = 256
      memory         = 512
      min_tasks      = 1
      max_tasks      = 3
      attach_to_alb  = false
    }
    housekeeping-service = {
      container_port = 4004
      cpu            = 256
      memory         = 512
      min_tasks      = 1
      max_tasks      = 3
      attach_to_alb  = false
    }
    channel-sync-service = {
      container_port = 4005
      cpu            = 256
      memory         = 512
      min_tasks      = 1
      max_tasks      = 2
      attach_to_alb  = false
    }
    rates-service = {
      container_port = 4006
      cpu            = 256
      memory         = 512
      min_tasks      = 1
      max_tasks      = 2
      attach_to_alb  = false
    }
    reporting-service = {
      container_port = 4007
      cpu            = 512
      memory         = 1024
      min_tasks      = 1
      max_tasks      = 3
      attach_to_alb  = false
    }
    guest-profile-service = {
      container_port = 4008
      cpu            = 256
      memory         = 512
      min_tasks      = 1
      max_tasks      = 2
      attach_to_alb  = false
    }
  }
}

# ─── ECS Cluster ─────────────────────────────────────────────────────────────

resource "aws_ecs_cluster" "main" {
  name = "hotel-key-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "hotel-key-${var.environment}-cluster" }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}

# ─── IAM — Execution Role (ECS agent: ECR pull, logs, secrets read) ───────────

resource "aws_iam_role" "ecs_execution" {
  name = "hotel-key-${var.environment}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "hotel-key-${var.environment}-secrets-read"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
      Resource = length(values(var.secrets_arns)) > 0 ? values(var.secrets_arns) : ["arn:aws:secretsmanager:*:*:secret:hotel-key/*"]
    }]
  })
}

# ─── IAM — Task Role (application: MSK, Secrets Manager at runtime) ───────────

resource "aws_iam_role" "ecs_task" {
  name = "hotel-key-${var.environment}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "ecs_task_msk" {
  name = "hotel-key-${var.environment}-msk-access"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["kafka:DescribeCluster", "kafka:GetBootstrapBrokers", "kafka-cluster:Connect", "kafka-cluster:DescribeTopic", "kafka-cluster:ReadData", "kafka-cluster:WriteData"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
        Resource = length(values(var.secrets_arns)) > 0 ? values(var.secrets_arns) : ["arn:aws:secretsmanager:*:*:secret:hotel-key/*"]
      }
    ]
  })
}

# ─── CloudWatch Log Groups ────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "service" {
  for_each = local.services

  name              = "/hotel-key/${var.environment}/${each.key}"
  retention_in_days = 30

  tags = { service = each.key }
}

# ─── Task Definitions ─────────────────────────────────────────────────────────

resource "aws_ecs_task_definition" "service" {
  for_each = local.services

  family                   = "hotel-key-${var.environment}-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = each.key
    image     = "${var.ecr_repo_base_url}/${each.key}:${var.image_tag}"
    essential = true

    portMappings = [{
      containerPort = each.value.container_port
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV", value = var.environment },
      { name = "PORT", value = tostring(each.value.container_port) }
    ]

    secrets = [
      for secret_key, secret_arn in var.secrets_arns : {
        name      = upper(replace(replace(secret_key, "/", "_"), "-", "_"))
        valueFrom = secret_arn
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.service[each.key].name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = each.key
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:${each.value.container_port}/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = { service = each.key }
}

# ─── ECS Services ─────────────────────────────────────────────────────────────

resource "aws_ecs_service" "main" {
  for_each = local.services

  name                              = "hotel-key-${var.environment}-${each.key}"
  cluster                           = aws_ecs_cluster.main.id
  task_definition                   = aws_ecs_task_definition.service[each.key].arn
  desired_count                     = each.value.min_tasks
  launch_type                       = "FARGATE"
  health_check_grace_period_seconds = each.value.attach_to_alb ? 60 : null

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.sg_ecs_id]
    assign_public_ip = false
  }

  dynamic "load_balancer" {
    for_each = each.value.attach_to_alb ? [1] : []
    content {
      target_group_arn = var.target_group_api_arn
      container_name   = each.key
      container_port   = each.value.container_port
    }
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_controller {
    type = "ECS"
  }

  tags = { service = each.key }

  lifecycle {
    ignore_changes = [desired_count]
  }
}

# ─── Auto Scaling ─────────────────────────────────────────────────────────────

resource "aws_appautoscaling_target" "service" {
  for_each = local.services

  max_capacity       = each.value.max_tasks
  min_capacity       = each.value.min_tasks
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main[each.key].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  depends_on = [aws_ecs_service.main]
}

resource "aws_appautoscaling_policy" "cpu" {
  for_each = local.services

  name               = "hotel-key-${var.environment}-${each.key}-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.service[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.service[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.service[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
