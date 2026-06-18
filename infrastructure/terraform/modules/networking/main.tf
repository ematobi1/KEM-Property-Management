data "aws_availability_zones" "available" {
  state = "available"
}

# ─── VPC ─────────────────────────────────────────────────────────────────────

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "hotel-key-${var.environment}"
  }
}

# ─── Subnets ─────────────────────────────────────────────────────────────────

resource "aws_subnet" "public_az1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = { Name = "hotel-key-${var.environment}-public-az1", Type = "public" }
}

resource "aws_subnet" "public_az2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = { Name = "hotel-key-${var.environment}-public-az2", Type = "public" }
}

resource "aws_subnet" "private_az1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = { Name = "hotel-key-${var.environment}-private-az1", Type = "private" }
}

resource "aws_subnet" "private_az2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.20.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = { Name = "hotel-key-${var.environment}-private-az2", Type = "private" }
}

resource "aws_subnet" "database_az1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.100.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = { Name = "hotel-key-${var.environment}-database-az1", Type = "database" }
}

resource "aws_subnet" "database_az2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.200.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = { Name = "hotel-key-${var.environment}-database-az2", Type = "database" }
}

# ─── Internet Gateway ─────────────────────────────────────────────────────────

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "hotel-key-${var.environment}-igw" }
}

# ─── Elastic IPs for NAT ─────────────────────────────────────────────────────

resource "aws_eip" "nat_az1" {
  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = { Name = "hotel-key-${var.environment}-nat-az1" }
}

resource "aws_eip" "nat_az2" {
  count      = var.enable_dual_nat ? 1 : 0
  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = { Name = "hotel-key-${var.environment}-nat-az2" }
}

# ─── NAT Gateways ────────────────────────────────────────────────────────────

resource "aws_nat_gateway" "az1" {
  allocation_id = aws_eip.nat_az1.id
  subnet_id     = aws_subnet.public_az1.id
  depends_on    = [aws_internet_gateway.main]

  tags = { Name = "hotel-key-${var.environment}-nat-az1" }
}

resource "aws_nat_gateway" "az2" {
  count         = var.enable_dual_nat ? 1 : 0
  allocation_id = aws_eip.nat_az2[0].id
  subnet_id     = aws_subnet.public_az2.id
  depends_on    = [aws_internet_gateway.main]

  tags = { Name = "hotel-key-${var.environment}-nat-az2" }
}

# ─── Route Tables ─────────────────────────────────────────────────────────────

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "hotel-key-${var.environment}-public-rt" }
}

resource "aws_route_table_association" "public_az1" {
  subnet_id      = aws_subnet.public_az1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_az2" {
  subnet_id      = aws_subnet.public_az2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private_az1" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.az1.id
  }

  tags = { Name = "hotel-key-${var.environment}-private-az1-rt" }
}

resource "aws_route_table" "private_az2" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.enable_dual_nat ? aws_nat_gateway.az2[0].id : aws_nat_gateway.az1.id
  }

  tags = { Name = "hotel-key-${var.environment}-private-az2-rt" }
}

resource "aws_route_table_association" "private_az1" {
  subnet_id      = aws_subnet.private_az1.id
  route_table_id = aws_route_table.private_az1.id
}

resource "aws_route_table_association" "private_az2" {
  subnet_id      = aws_subnet.private_az2.id
  route_table_id = aws_route_table.private_az2.id
}

# ─── Security Groups ─────────────────────────────────────────────────────────
# Egress rules are separate resources to break the circular dependency between
# ALB → ECS → Database/Kafka security groups.

resource "aws_security_group" "alb" {
  name        = "hotel-key-${var.environment}-alb"
  description = "ALB — public HTTPS/HTTP ingress"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from internet (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "hotel-key-${var.environment}-sg-alb" }
}

resource "aws_security_group" "ecs" {
  name        = "hotel-key-${var.environment}-ecs"
  description = "ECS Fargate tasks — inbound from ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "App traffic from ALB"
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  tags = { Name = "hotel-key-${var.environment}-sg-ecs" }
}

resource "aws_security_group" "database" {
  name        = "hotel-key-${var.environment}-database"
  description = "RDS and DocumentDB — inbound from ECS only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  ingress {
    description     = "DocumentDB from ECS"
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  tags = { Name = "hotel-key-${var.environment}-sg-database" }
}

resource "aws_security_group" "kafka" {
  name        = "hotel-key-${var.environment}-kafka"
  description = "MSK Kafka — inbound from ECS only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Kafka brokers from ECS"
    from_port       = 9092
    to_port         = 9092
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  ingress {
    description     = "Zookeeper from ECS"
    from_port       = 2181
    to_port         = 2181
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  tags = { Name = "hotel-key-${var.environment}-sg-kafka" }
}

# ─── Egress rules (separate to avoid circular references) ─────────────────────

resource "aws_security_group_rule" "alb_egress_ecs" {
  type                     = "egress"
  from_port                = 4000
  to_port                  = 4000
  protocol                 = "tcp"
  security_group_id        = aws_security_group.alb.id
  source_security_group_id = aws_security_group.ecs.id
  description              = "ALB to ECS tasks"
}

resource "aws_security_group_rule" "ecs_egress_pg" {
  type                     = "egress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.ecs.id
  source_security_group_id = aws_security_group.database.id
  description              = "ECS to RDS PostgreSQL"
}

resource "aws_security_group_rule" "ecs_egress_docdb" {
  type                     = "egress"
  from_port                = 27017
  to_port                  = 27017
  protocol                 = "tcp"
  security_group_id        = aws_security_group.ecs.id
  source_security_group_id = aws_security_group.database.id
  description              = "ECS to DocumentDB"
}

resource "aws_security_group_rule" "ecs_egress_kafka" {
  type                     = "egress"
  from_port                = 9092
  to_port                  = 9092
  protocol                 = "tcp"
  security_group_id        = aws_security_group.ecs.id
  source_security_group_id = aws_security_group.kafka.id
  description              = "ECS to MSK Kafka"
}

resource "aws_security_group_rule" "ecs_egress_https" {
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  security_group_id = aws_security_group.ecs.id
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "ECS outbound HTTPS for ECR pulls and Secrets Manager"
}
