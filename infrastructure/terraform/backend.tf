terraform {
  backend "s3" {
    # These values must be supplied via -backend-config flags or a backend.hcl file.
    # Example:
    #   terraform init \
    #     -backend-config="bucket=hotel-key-tfstate-prod" \
    #     -backend-config="key=hotel-key/terraform.tfstate" \
    #     -backend-config="region=us-east-1" \
    #     -backend-config="dynamodb_table=hotel-key-tfstate-lock"
    bucket         = "REPLACE_WITH_STATE_BUCKET"
    key            = "hotel-key/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "REPLACE_WITH_LOCK_TABLE"
  }
}
