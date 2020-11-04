terraform {
    backend "remote" {
        hostname = "app.terraform.io"
        organization = "VargasArts"
        workspaces {
            prefix = "roam-js-extensions"
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
  version = "1.2.1"

  domain = "roamjs.com"
  secret = var.secret
  tags = {
      Application = "Roam JS Extensions"
  }
}

module "aws-serverless-backend" {
    source  = "dvargas92495/serverless-backend/aws"
    version = "1.2.1"

    api_name = "roam-js-extensions"
    paths = [
        "github-cards/get",
        "github-issues/get",
        "github-projects/get",
        "github-repositories/get",
        "google-calendar/get",
        "queue-issues/get",
        "queue-projects/get",
        "twitter-search/get"
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
