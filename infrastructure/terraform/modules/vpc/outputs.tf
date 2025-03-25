# VPC Outputs
output "vpc_id" {
  description = "The ID of the VPC created by this module"
  value       = aws_vpc.this.id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.this.cidr_block
}

# Subnet Outputs
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
  description = "Name of the database subnet group created"
  value       = aws_db_subnet_group.database.name
}

# Route Table Outputs
output "public_route_table_ids" {
  description = "List of IDs of public route tables"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of IDs of private route tables"
  value       = aws_route_table.private.*.id
}

output "database_route_table_ids" {
  description = "List of IDs of database route tables"
  value       = aws_route_table.database.*.id
}

# Gateway Outputs
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

# Security Group Outputs
output "default_security_group_id" {
  description = "ID of the default security group created for the VPC"
  value       = aws_security_group.default.id
}

# VPC Endpoint Outputs
output "vpc_endpoint_s3_id" {
  description = "ID of the VPC endpoint for S3"
  value       = length(aws_vpc_endpoint.s3) > 0 ? aws_vpc_endpoint.s3[0].id : ""
}

# Availability Zone Outputs
output "availability_zones" {
  description = "List of availability zones used"
  value       = var.availability_zones
}