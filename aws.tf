terraform {
    backend "remote" {
        hostname = "app.terraform.io"
        organization = "VargasArts"
        workspaces {
            prefix = "roam-js-extensions"
        }
    }
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
  version = "1.1.0"

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
        "twitter-search/get"
    ]
    tags = {
        Application = "Roam JS Extensions"
    }
}

provider "github" {
    owner = "dvargas92495"
}

resource "github_actions_secret" "deploy_aws_access_key" {
  repository       = "roam-js-extensions"
  secret_name      = "DEPLOY_AWS_ACCESS_KEY"
  plaintext_value  = module.aws-static-site.deploy-id
}

resource "github_actions_secret" "deploy_aws_access_secret" {
  repository       = "roam-js-extensions"
  secret_name      = "DEPLOY_AWS_ACCESS_SECRET"
  plaintext_value  = module.aws-static-site.deploy-secret
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
