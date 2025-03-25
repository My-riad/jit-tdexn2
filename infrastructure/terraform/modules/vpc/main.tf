# AWS Provider version
# AWS Provider ~> 4.0

# Locals for name prefixing and common tags
locals {
  name_prefix = "${var.name}-${var.environment}"
  common_tags = merge(var.tags, {
    Name        = var.name
    Environment = var.environment
  })
}

# Data source to get current AWS region
data "aws_region" "current" {}

# Main VPC
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  instance_tenancy     = "default"
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Public subnets - for resources that need direct internet access
resource "aws_subnet" "public" {
  count                   = length(var.public_subnets)
  vpc_id                  = aws_vpc.this.id
  cidr_block              = element(var.public_subnets, count.index)
  availability_zone       = element(var.availability_zones, count.index)
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${element(var.availability_zones, count.index)}"
  })
}

# Private subnets - for application resources
resource "aws_subnet" "private" {
  count                   = length(var.private_subnets)
  vpc_id                  = aws_vpc.this.id
  cidr_block              = element(var.private_subnets, count.index)
  availability_zone       = element(var.availability_zones, count.index)
  map_public_ip_on_launch = false
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${element(var.availability_zones, count.index)}"
  })
}

# Database subnets - for database resources with additional isolation
resource "aws_subnet" "database" {
  count                   = length(var.database_subnets)
  vpc_id                  = aws_vpc.this.id
  cidr_block              = element(var.database_subnets, count.index)
  availability_zone       = element(var.availability_zones, count.index)
  map_public_ip_on_launch = false
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-${element(var.availability_zones, count.index)}"
  })
}

# Internet Gateway for public internet access
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0
  vpc   = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index}"
  })
  
  depends_on = [aws_internet_gateway.this]
}

# NAT Gateways for private subnet internet access
resource "aws_nat_gateway" "this" {
  count         = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0
  allocation_id = element(aws_eip.nat.*.id, var.single_nat_gateway ? 0 : count.index)
  subnet_id     = element(aws_subnet.public.*.id, var.single_nat_gateway ? 0 : count.index)
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gw-${count.index}"
  })
  
  depends_on = [
    aws_internet_gateway.this,
    aws_eip.nat,
    aws_subnet.public
  ]
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

# Route for internet access from public subnets
resource "aws_route" "public_internet_gateway" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
  
  depends_on = [
    aws_route_table.public,
    aws_internet_gateway.this
  ]
}

# Route tables for private subnets
resource "aws_route_table" "private" {
  count  = var.single_nat_gateway ? 1 : length(var.availability_zones)
  vpc_id = aws_vpc.this.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index}"
  })
}

# Route for internet access from private subnets via NAT Gateway
resource "aws_route" "private_nat_gateway" {
  count                  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0
  route_table_id         = element(aws_route_table.private.*.id, count.index)
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = element(aws_nat_gateway.this.*.id, var.single_nat_gateway ? 0 : count.index)
  
  depends_on = [
    aws_route_table.private,
    aws_nat_gateway.this
  ]
}

# Route tables for database subnets
resource "aws_route_table" "database" {
  count  = var.single_nat_gateway ? 1 : length(var.availability_zones)
  vpc_id = aws_vpc.this.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-rt-${count.index}"
  })
}

# Route for internet access from database subnets via NAT Gateway
resource "aws_route" "database_nat_gateway" {
  count                  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.availability_zones)) : 0
  route_table_id         = element(aws_route_table.database.*.id, count.index)
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = element(aws_nat_gateway.this.*.id, var.single_nat_gateway ? 0 : count.index)
  
  depends_on = [
    aws_route_table.database,
    aws_nat_gateway.this
  ]
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnets)
  subnet_id      = element(aws_subnet.public.*.id, count.index)
  route_table_id = aws_route_table.public.id
}

# Associate private subnets with private route tables
resource "aws_route_table_association" "private" {
  count          = length(var.private_subnets)
  subnet_id      = element(aws_subnet.private.*.id, count.index)
  route_table_id = element(aws_route_table.private.*.id, var.single_nat_gateway ? 0 : count.index)
}

# Associate database subnets with database route tables
resource "aws_route_table_association" "database" {
  count          = length(var.database_subnets)
  subnet_id      = element(aws_subnet.database.*.id, count.index)
  route_table_id = element(aws_route_table.database.*.id, var.single_nat_gateway ? 0 : count.index)
}

# Create a database subnet group if database subnets are provided
resource "aws_db_subnet_group" "database" {
  name        = "${local.name_prefix}-db-subnet-group"
  subnet_ids  = aws_subnet.database.*.id
  description = "Database subnet group for ${var.name}"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
  
  depends_on = [aws_subnet.database]
}

# Default security group for the VPC
resource "aws_security_group" "default" {
  name        = "${local.name_prefix}-default-sg"
  description = "Default security group for ${var.name} VPC"
  vpc_id      = aws_vpc.this.id
  
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
    description = "Allow all inbound traffic from resources with this security group"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-default-sg"
  })
}

# VPC Flow Logs for network monitoring and security
resource "aws_flow_log" "this" {
  count                = var.enable_flow_logs ? 1 : 0
  log_destination      = var.flow_logs_destination_arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.this.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-flow-logs"
  })
  
  depends_on = [aws_vpc.this]
}

# VPC Endpoint for S3 access without internet
resource "aws_vpc_endpoint" "s3" {
  count           = var.enable_s3_endpoint ? 1 : 0
  vpc_id          = aws_vpc.this.id
  service_name    = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids = concat(aws_route_table.private.*.id, aws_route_table.database.*.id)
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
  
  depends_on = [
    aws_vpc.this,
    aws_route_table.private,
    aws_route_table.database
  ]
}

# Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.this.id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  description = "List of IDs of public subnets"
  value       = aws_subnet.public.*.id
}

output "private_subnet_ids" {
  description = "List of IDs of private subnets"
  value       = aws_subnet.private.*.id
}

output "database_subnet_ids" {
  description = "List of IDs of database subnets"
  value       = aws_subnet.database.*.id
}

output "database_subnet_group_name" {
  description = "Name of the database subnet group"
  value       = aws_db_subnet_group.database.name
}

output "public_route_table_ids" {
  description = "List of IDs of public route tables"
  value       = [aws_route_table.public.id]
}

output "private_route_table_ids" {
  description = "List of IDs of private route tables"
  value       = aws_route_table.private.*.id
}

output "database_route_table_ids" {
  description = "List of IDs of database route tables"
  value       = aws_route_table.database.*.id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.this.*.id
}

output "nat_public_ips" {
  description = "List of public Elastic IPs created for NAT gateways"
  value       = aws_eip.nat.*.public_ip
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.this.id
}

output "default_security_group_id" {
  description = "ID of the default security group"
  value       = aws_security_group.default.id
}

output "vpc_endpoint_s3_id" {
  description = "ID of the VPC endpoint for S3"
  value       = var.enable_s3_endpoint ? aws_vpc_endpoint.s3[0].id : null
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = var.availability_zones
}