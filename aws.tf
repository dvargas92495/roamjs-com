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

provider "github" {
    organization = "dvargas92495"
}

module "terraform-aws-s3-static-site" {
  source  = "github.com/dvargas92495/terraform-aws-s3-static-site"

  domains = [
      "roam.davidvargas.me"
  ]
  secret = var.secret
  tags = {
      Application = "Roam JS Extensions"
  }
}

resource "github_actions_secret" "deploy_aws_access_key" {
  repository       = "roam-js-extensions"
  secret_name      = "DEPLOY_AWS_ACCESS_KEY"
  plaintext_value  = module.terraform-aws-s3-static-site.deploy-id
}

resource "github_actions_secret" "deploy_aws_access_secret" {
  repository       = "roam-js-extensions"
  secret_name      = "DEPLOY_AWS_ACCESS_SECRET"
  plaintext_value  = module.terraform-aws-s3-static-site.deploy-secret
}
