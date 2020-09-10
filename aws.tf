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

provider "aws" {
    region = "us-east-1"
}

module "aws-static-site" {
  source  = "dvargas92495/static-site/aws"
  version = "1.0.0"

  domain = "roam.davidvargas.me"
  secret = var.secret
  tags = {
      Application = "Roam JS Extensions"
  }
}

module "aws-serverless-backend" {
    source  = "dvargas92495/serverless-backend/aws"
    version = "1.0.0"

    api_name = "roam-js-extensions"
    paths = [
        "github-cards/get",
        "github-issues/get",
        "github-projects/get",
        "github-repositories/get",
        "google-calendar/get"
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
