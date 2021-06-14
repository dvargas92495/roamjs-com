terraform {
  backend "remote" {
    hostname = "app.terraform.io"
    organization = "VargasArts"
    workspaces {
      prefix = "roam-js-extensions"
    }
  }
  
  required_providers {
    github = {
      source = "integrations/github"
      version = "4.2.0"
    }
  }
}

variable "roam_api_key" {
    type = string
}

variable "roam_api_token" {
    type = string
}

variable "secret" {
    type = string
}

variable "twitter_consumer_key" {
    type = string
}

variable "twitter_consumer_secret" {
    type = string
}

variable "twitter_bearer_token" {
    type = string
}

variable "stripe_public" {
    type = string
}

variable "mixpanel_token" {
    type = string
}

variable "mapbox_token" {
    type = string
}

variable "giphy_key" {
    type = string
}

variable "slack_client_id" {
    type = string
}

variable "slack_client_secret" {
    type = string
}

variable "clerk_api_key" {
    type = string
}

variable "floss_token" {
    type = string
}

variable "google_client_id" {
    type = string  
}

variable "google_client_secret" {
    type = string  
}

variable "facebook_client_id" {
    type = string
}

variable "facebook_client_secret" {
    type = string
}

variable "iframely_api_key" {
  type = string
}

variable "diahook_secret" {
  type = string
}

variable "dropbox_client_id" {
  type = string
}

variable "dropbox_client_secret" {
  type = string
}

variable "encryption_secret" {
  type = string
}

variable "convertkit_api_token" {
  type = string
}

provider "aws" {
    region = "us-east-1"
}

module "aws_static_site" {
  source  = "dvargas92495/static-site/aws"
  version = "2.3.2"

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

module "aws-serverless-backend" {
    source  = "dvargas92495/serverless-backend/aws"
    version = "1.5.10"

    api_name = "roam-js-extensions"
    domain = "roamjs.com"
    paths = [
        "article/post",
        "balance/get",
        "balance/post",
        "connected/get",
        "convertkit/get",
        "convertkit/post",
        "convertkit/delete",
        "customer/post",
        "customer/put",
        "deploy/post",
        "dropbox-auth/post",
        "fund/post",
        "github-cards/get",
        "github-issues/get",
        "github-projects/get",
        "github-repositories/get",
        "google-auth/post",
        "google-calendar/get",
        "decrypt-proxy/post",
        "encrypt/post",
        "end-service/post",
        "facebook-auth/post",
        "facebook-groups/get",
        "facebook-groups/post",
        "finish-launch-social/post",
        "finish-launch-website/post",
        "finish-shutdown-website/post",
        "finish-start-service/post",
        "iframely/post",
        "install/put",
        "is-subscribed/get",
        "launch-social/post",
        "launch-website/post",
        "metadata/get",
        "mixpanel/post",
        "payment-methods/delete",
        "payment-methods/get",
        "payment-methods/put",
        "postman/post",
        "products/get",
        "publish/post",
        "publish/put",
        "queue-issues/get",
        "request-path/get",
        "request-path/post",
        "request-path/delete",
        "slack-url/post",
        "shutdown-social/post",
        "shutdown-website/post",
        "social-schedule/delete",
        "social-schedule/put",
        "social-token/get",
        "sponsorships/get",
        "sponsorships/post",
        "start-service/post",
        "subscriptions/get",
        "subscribe-sponsorship/post",
        "token/post",
        "twitter-auth/post",
        "twitter-feed/get",
        "twitter-login/post",
        "twitter-search/get",
        "twitter-schedule/post",
        "twitter-schedule/get",
        "twitter-tweet/post",
        "twitter-upload/post",
        "update-website/post",
        "versions/get",
        "website-status/get",
        "website-variables/get",
    ]
    cors = [
      "connected",
      "convertkit",
      "launch-social",
      "start-service",
      "end-service",
      "shutdown-social",
      "fund",
      "customer",
      "payment-methods",
      "token",
      "subscribe-sponsorship",
      "sponsorships",
    ]
    tags = {
        Application = "Roam JS Extensions"
    }
}

module "aws_email" {
  source  = "dvargas92495/email/aws"
  version = "1.1.7"

  domain = "roamjs.com"
  zone_id = module.aws_static_site.route53_zone_id
  forward_to = "dvargas92495@gmail.com"
  tags = {
    Application = "Roam JS Extensions"
  } 
}

data "aws_iam_role" "lambda_role" {
  name = "roam-js-extensions-lambda-execution"
}

resource "aws_route53_record" "clerk-accounts" {
  zone_id = module.aws_static_site.route53_zone_id
  name    = "accounts"
  type    = "CNAME"
  ttl     = "300"
  records = ["accounts.clerk.services"]
}

resource "aws_route53_record" "clerk-fe" {
  zone_id = module.aws_static_site.route53_zone_id
  name    = "clerk"
  type    = "CNAME"
  ttl     = "300"
  records = ["frontend-api.clerk.services"]
}

resource "aws_route53_record" "clerk-fe-api" {
  zone_id = module.aws_static_site.route53_zone_id
  name    = "clerk.api"
  type    = "CNAME"
  ttl     = "300"
  records = ["frontend-api.clerk.services"]
}

resource "aws_route53_record" "clerk-s1" {
  zone_id = module.aws_static_site.route53_zone_id
  name    = "s1._domainkey"
  type    = "CNAME"
  ttl     = "300"
  records = ["dkim1.q5lvvno2col9.clerk.services"]
}

resource "aws_route53_record" "clerk-s2" {
  zone_id = module.aws_static_site.route53_zone_id
  name    = "s2._domainkey"
  type    = "CNAME"
  ttl     = "300"
  records = ["dkim2.q5lvvno2col9.clerk.services"]
}

resource "aws_route53_record" "clerk-mail" {
  zone_id = module.aws_static_site.route53_zone_id
  name    = "mail"
  type    = "CNAME"
  ttl     = "300"
  records = ["mail.q5lvvno2col9.clerk.services"]
}

resource "aws_route53_record" "google-verifu" {
  zone_id = module.aws_static_site.route53_zone_id
  name    = "roamjs.com"
  type    = "TXT"
  ttl     = "300"
  records = ["google-site-verification=A9q11tN2qoTRaIdwMmlNqvbjgX4UQOj1okRat6CHtyE"]
}

resource "aws_route53_record" "gitbook" {
  zone_id = module.aws_static_site.route53_zone_id
  name    = "developer"
  type    = "CNAME"
  ttl     = "300"
  records = ["hosting.gitbook.io"]
}

resource "aws_dynamodb_table" "extensions" {
  name           = "RoamJSExtensions"
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
  repository       = "roam-js-extensions"
  secret_name      = "DEPLOY_AWS_ACCESS_KEY"
  plaintext_value  = module.aws_static_site.deploy-id
}

resource "github_actions_secret" "deploy_aws_access_secret" {
  repository       = "roam-js-extensions"
  secret_name      = "DEPLOY_AWS_ACCESS_SECRET"
  plaintext_value  = module.aws_static_site.deploy-secret
}

resource "github_actions_secret" "twitter_consumer_key" {
  repository       = "roam-js-extensions"
  secret_name      = "TWITTER_CONSUMER_KEY"
  plaintext_value  = var.twitter_consumer_key
}

resource "github_actions_secret" "twitter_consumer_secret" {
  repository       = "roam-js-extensions"
  secret_name      = "TWITTER_CONSUMER_SECRET"
  plaintext_value  = var.twitter_consumer_secret
}

resource "github_actions_secret" "twitter_bearer_token" {
  repository       = "roam-js-extensions"
  secret_name      = "TWITTER_BEARER_TOKEN"
  plaintext_value  = var.twitter_bearer_token
}

resource "github_actions_secret" "roam_api_key" {
  repository       = "roam-js-extensions"
  secret_name      = "ROAM_CLIENT_API_KEY"
  plaintext_value  = var.roam_api_key
}

resource "github_actions_secret" "roam_api_token" {
  repository       = "roam-js-extensions"
  secret_name      = "ROAM_CLIENT_API_TOKEN"
  plaintext_value  = var.roam_api_token
}

resource "github_actions_secret" "rest_api_id" {
  repository       = "roam-js-extensions"
  secret_name      = "REST_API_ID"
  plaintext_value  = module.aws-serverless-backend.rest_api_id
}

resource "github_actions_secret" "stripe_public" {
  repository       = "roam-js-extensions"
  secret_name      = "STRIPE_PUBLIC_KEY"
  plaintext_value  = var.stripe_public
}

resource "github_actions_secret" "mixpanel_token" {
  repository       = "roam-js-extensions"
  secret_name      = "MIXPANEL_TOKEN"
  plaintext_value  = var.mixpanel_token
}

resource "github_actions_secret" "mapbox_token" {
  repository       = "roam-js-extensions"
  secret_name      = "MAPBOX_TOKEN"
  plaintext_value  = var.mapbox_token
}

resource "github_actions_secret" "giphy_key" {
  repository       = "roam-js-extensions"
  secret_name      = "GIPHY_KEY"
  plaintext_value  = var.giphy_key
}

resource "github_actions_secret" "slack_client_id" {
  repository       = "roam-js-extensions"
  secret_name      = "SLACK_CLIENT_ID"
  plaintext_value  = var.slack_client_id
}

resource "github_actions_secret" "slack_client_secret" {
  repository       = "roam-js-extensions"
  secret_name      = "SLACK_CLIENT_SECRET"
  plaintext_value  = var.slack_client_secret
}

resource "github_actions_secret" "clerk_api_key" {
  repository       = "roam-js-extensions"
  secret_name      = "CLERK_API_KEY"
  plaintext_value  = var.clerk_api_key
}

resource "github_actions_secret" "floss_token" {
  repository       = "roam-js-extensions"
  secret_name      = "FLOSS_TOKEN"
  plaintext_value  = var.floss_token
}

resource "github_actions_secret" "lambda_role" {
  repository       = "roam-js-extensions"
  secret_name      = "LAMBDA_ROLE"
  plaintext_value  = data.aws_iam_role.lambda_role.arn
}

resource "github_actions_secret" "cloudfront_arn" {
  repository       = "roam-js-extensions"
  secret_name      = "CLOUDFRONT_ARN"
  plaintext_value  = module.aws_static_site.cloudfront_arn
}

resource "github_actions_secret" "google_client_id" {
  repository       = "roam-js-extensions"
  secret_name      = "GOOGLE_CLIENT_ID"
  plaintext_value  = var.google_client_id
}

resource "github_actions_secret" "google_client_secret" {
  repository       = "roam-js-extensions"
  secret_name      = "GOOGLE_CLIENT_SECRET"
  plaintext_value  = var.google_client_secret
}

resource "github_actions_secret" "facebook_client_id" {
  repository       = "roam-js-extensions"
  secret_name      = "FACEBOOK_CLIENT_ID"
  plaintext_value  = var.facebook_client_id
}

resource "github_actions_secret" "facebook_client_secret" {
  repository       = "roam-js-extensions"
  secret_name      = "FACEBOOK_CLIENT_SECRET"
  plaintext_value  = var.facebook_client_secret
}

resource "github_actions_secret" "iframely_api_key" {
  repository       = "roam-js-extensions"
  secret_name      = "IFRAMELY_API_KEY"
  plaintext_value  = var.iframely_api_key
}

resource "github_actions_secret" "diahook_secret" {
  repository       = "roam-js-extensions"
  secret_name      = "DIAHOOK_SECRET"
  plaintext_value  = var.diahook_secret
}

resource "github_actions_secret" "dropbox_client_id" {
  repository       = "roam-js-extensions"
  secret_name      = "DROPBOX_CLIENT_ID"
  plaintext_value  = var.dropbox_client_id
}

resource "github_actions_secret" "dropbox_client_secret" {
  repository       = "roam-js-extensions"
  secret_name      = "DROPBOX_CLIENT_SECRET"
  plaintext_value  = var.dropbox_client_secret
}

resource "github_actions_secret" "encryption_secret" {
  repository       = "roam-js-extensions"
  secret_name      = "ENCRYPTION_SECRET"
  plaintext_value  = var.encryption_secret
}

resource "github_actions_secret" "convertkit_api_token" {
  repository       = "roam-js-extensions"
  secret_name      = "CONVERTKIT_API_TOKEN"
  plaintext_value  = var.convertkit_api_token
}
