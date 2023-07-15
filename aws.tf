terraform {
  backend "remote" {
    hostname = "app.terraform.io"
    organization = "VargasArts"
    workspaces {
      name = "roam-js-extensions"
    }
  }
  
  required_providers {
    github = {
      source = "integrations/github"
    }
  }
}

variable "secret" {
    type = string
}

provider "aws" {
    region = "us-east-1"
}

module "aws_static_site" {
  source  = "dvargas92495/static-site/aws"
  version = "2.3.6"

  domain = "roamjs.com"
  redirects = ["roam.davidvargas.me"]
  secret = var.secret
  allowed_origins = ["https://roamresearch.com"]
  tags = {
      Application = "Roam JS Extensions"
  }

  providers = {
    aws.us-east-1 = aws
  }
}

module "aws_email" {
  source  = "dvargas92495/email/aws"
  version = "2.0.3"

  domain = "roamjs.com"
  zone_id = module.aws_static_site.route53_zone_id
}

data "aws_iam_role" "lambda_role" {
  name = "roam-js-extensions-lambda-execution"
}

resource "aws_route53_record" "google-verifu" {
  zone_id = module.aws_static_site.route53_zone_id
  name    = "roamjs.com"
  type    = "TXT"
  ttl     = "300"
  records = ["google-site-verification=A9q11tN2qoTRaIdwMmlNqvbjgX4UQOj1okRat6CHtyE"]
}

resource "aws_dynamodb_table" "auth" {
  name           = "RoamJSAuth"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Application = "Roam JS Extensions"
  }
}

resource "aws_api_gateway_rest_api" "lambda_api" {
  name        = "roamjs-extensions"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }

  binary_media_types = [
    "multipart/form-data",
    "application/octet-stream"
  ]

  tags = {
    Application = "Roam JS Extensions"
  }
}

resource "aws_api_gateway_resource" "resource" {
  rest_api_id = aws_api_gateway_rest_api.lambda_api.id
  parent_id   = aws_api_gateway_rest_api.lambda_api.root_resource_id
  path_part   = "mock"
}

resource "aws_api_gateway_method" "options" {
  rest_api_id   = aws_api_gateway_rest_api.lambda_api.id
  resource_id   = aws_api_gateway_resource.resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "mock" {
  rest_api_id          = aws_api_gateway_rest_api.lambda_api.id
  resource_id          = aws_api_gateway_resource.resource.id
  http_method          = aws_api_gateway_method.options.http_method
  type                 = "MOCK"
  passthrough_behavior = "WHEN_NO_TEMPLATES"

  request_templates = {
    "application/json" = jsonencode(
        {
            statusCode = 200
        }
    )
  }
}

resource "aws_acm_certificate" "api" {
  domain_name       = "lambda.roamjs.com"
  validation_method = "DNS"

  tags = {
    Application = "Roam JS Extensions"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "api_cert" {
  name    = tolist(aws_acm_certificate.api.domain_validation_options)[0].resource_record_name
  type    = tolist(aws_acm_certificate.api.domain_validation_options)[0].resource_record_type
  zone_id = module.aws_static_site.route53_zone_id
  records = [tolist(aws_acm_certificate.api.domain_validation_options)[0].resource_record_value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "api" {
  certificate_arn         = aws_acm_certificate.api.arn
  validation_record_fqdns = [aws_route53_record.api_cert.fqdn]
}

resource "aws_api_gateway_domain_name" "api" {
  certificate_arn = aws_acm_certificate_validation.api.certificate_arn
  domain_name     = "lambda.roamjs.com"
}

resource "aws_route53_record" "api" {
  name    = aws_api_gateway_domain_name.api.domain_name
  type    = "A"
  zone_id = module.aws_static_site.route53_zone_id

  alias {
    evaluate_target_health = true
    name                   = aws_api_gateway_domain_name.api.cloudfront_domain_name
    zone_id                = aws_api_gateway_domain_name.api.cloudfront_zone_id
  }
}

resource "aws_api_gateway_deployment" "production" {
  rest_api_id = aws_api_gateway_rest_api.lambda_api.id
  stage_name  = "production"
  depends_on  = [
    aws_api_gateway_integration.mock, 
  ]
}

resource "aws_api_gateway_base_path_mapping" "api" {
  api_id      = aws_api_gateway_rest_api.lambda_api.id
  stage_name  = aws_api_gateway_deployment.production.stage_name
  domain_name = aws_api_gateway_domain_name.api.domain_name
}

provider "github" {
    owner = "dvargas92495"
}

resource "github_actions_secret" "deploy_aws_access_key" {
  repository       = "roamjs-com"
  secret_name      = "DEPLOY_AWS_ACCESS_KEY"
  plaintext_value  = module.aws_static_site.deploy-id
}

resource "github_actions_secret" "deploy_aws_access_secret" {
  repository       = "roamjs-com"
  secret_name      = "DEPLOY_AWS_ACCESS_SECRET"
  plaintext_value  = module.aws_static_site.deploy-secret
}
