terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.34.0"
    }
  }
}

provider "google" {
  region = "europe-west3"
}

data "google_project" "project" {}

data "google_cloud_run_service" "service" {
  name = "service"
  location = "europe-west3"
}

# Enable APIs
resource "google_project_service" "iam" {
  service            = "iam.googleapis.com"
  disable_on_destroy = false
}

# Create Service Account
resource "google_service_account" "behco" {
  account_id   = "behco-sa"
  display_name = "Behavioral Couponing Service Account"
}

resource "google_project_iam_member" "behco" {
  project = data.google_project.project.name
  role    = "roles/editor"
  member = "serviceAccount:${google_service_account.behco.email}"
}

# Cloud Scheduler - Refresh Token
resource "google_cloud_scheduler_job" "refresh_token" {
  name        = "refresh-token"
  description = "Token Refresh"
  schedule    = "*/30 * * * *"

  http_target {
    http_method = "GET"
    uri         = "${data.google_cloud_run_service.service.status.0.url}/token"
    oidc_token {
      service_account_email = google_service_account.behco.email
      audience = data.google_cloud_run_service.service.status.0.url
    }
  }
}

# Cloud Scheduler - Archive Visitors
resource "google_cloud_scheduler_job" "archive_visitors" {
  name             = "archive-visitors"
  description      = "Archive Visitors"
  schedule         = "*/30 * * * *"

  retry_config {
    retry_count = 1
  }

  http_target {
    http_method = "GET"
    uri         = "${data.google_cloud_run_service.service.status.0.url}/archive"
    oidc_token {
      service_account_email = google_service_account.behco.email
      audience = data.google_cloud_run_service.service.status.0.url
    }
  }
}
