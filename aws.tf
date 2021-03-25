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

provider "aws" {
    region = "us-east-1"
}

module "aws-static-site" {
  source  = "dvargas92495/static-site/aws"
  version = "1.1.0"

  domain = "roam.davidvargas.me"
  secret = var.secret
  tags = {
      Application = "Roam JS Extensions"
  }
}

module "aws_static_site" {
  source  = "dvargas92495/static-site/aws"
  version = "1.3.0"

  domain = "roamjs.com"
  secret = var.secret
  allowed_origins = ["https://roamresearch.com"]
  tags = {
      Application = "Roam JS Extensions"
  }
}

module "aws-serverless-backend" {
    source  = "dvargas92495/serverless-backend/aws"
    version = "1.5.4"

    api_name = "roam-js-extensions"
    domain = "roamjs.com"
    paths = [
        "article/post",
        "balance/get",
        "balance/post",
        "customer/put",
        "deploy/post",
        "fund/post",
        "github-cards/get",
        "github-issues/get",
        "github-projects/get",
        "github-repositories/get",
        "google-calendar/get",
        "end-service/post",
        "finish-launch-social/post",
        "finish-launch-website/post",
        "finish-shutdown-website/post",
        "finish-start-service/post",
        "install/put",
        "is-subscribed/get",
        "launch-social/post",
        "launch-website/post",
        "mixpanel/post",
        "payment-methods/delete",
        "payment-methods/get",
        "payment-methods/put",
        "postman/post",
        "products/get",
        "publish/post",
        "queue-issues/get",
        "slack-url/post",
        "shutdown-social/post",
        "shutdown-website/post",
        "social-schedule/delete",
        "social-schedule/put",
        "social-token/get",
        "sponsorships/get",
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
        "website-status/get",
    ]
    cors = [
      "launch-social",
      "start-service",
      "end-service",
      "shutdown-social",
      "fund",
      "customer",
      "payment-methods",
      "token",
    ]
    tags = {
        Application = "Roam JS Extensions"
    }
}

module "aws_cron_job" {
  source    = "dvargas92495/cron-job/aws"
  version   = "1.1.0"
  
  rule_name = "RoamJS"
  schedule  = "cron(0 4 ? * * *)"
  lambdas    = [
    "template-daily-note"
  ]
  tags      = {
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

provider "github" {
    owner = "dvargas92495"
}

resource "github_actions_secret" "old_aws_access_key" {
  repository       = "roam-js-extensions"
  secret_name      = "OLD_AWS_ACCESS_KEY"
  plaintext_value  = module.aws-static-site.deploy-id
}

resource "github_actions_secret" "old_aws_access_secret" {
  repository       = "roam-js-extensions"
  secret_name      = "OLD_AWS_ACCESS_SECRET"
  plaintext_value  = module.aws-static-site.deploy-secret
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

resource "github_actions_secret" "cron_aws_access_key" {
  repository       = "roam-js-extensions"
  secret_name      = "CRON_AWS_ACCESS_KEY_ID"
  plaintext_value  = module.aws_cron_job.access_key
}

resource "github_actions_secret" "cron_aws_access_secret" {
  repository       = "roam-js-extensions"
  secret_name      = "CRON_AWS_SECRET_ACCESS_KEY"
  plaintext_value  = module.aws_cron_job.secret_key
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
