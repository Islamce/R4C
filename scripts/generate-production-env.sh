#!/usr/bin/env bash
set -euo pipefail

template="${1:-.env.production.example}"
output="${2:-.env.production}"

if [[ ! -f "$template" ]]; then
  echo "Template not found: $template" >&2
  exit 1
fi
if [[ -e "$output" ]]; then
  echo "Refusing to overwrite existing file: $output" >&2
  exit 1
fi
for command in openssl python3; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Required command is missing: $command" >&2
    exit 1
  fi
done

export R4C_POSTGRES_PASSWORD="$(openssl rand -hex 24)"
export R4C_REDIS_PASSWORD="$(openssl rand -hex 24)"
export R4C_MINIO_ACCESS_KEY="r4c$(openssl rand -hex 8)"
export R4C_MINIO_SECRET_KEY="$(openssl rand -hex 32)"
export R4C_JWT_ACCESS_SECRET="$(openssl rand -hex 48)"
export R4C_JWT_REFRESH_SECRET="$(openssl rand -hex 48)"
export R4C_BIM_WORKER_TOKEN="$(openssl rand -hex 48)"
export R4C_BOOTSTRAP_ADMIN_PASSWORD="$(openssl rand -hex 24)"
export R4C_UAT_ADMIN_PASSWORD="$(openssl rand -hex 24)"
export R4C_UAT_SUBMIT_PASSWORD="$(openssl rand -hex 24)"

cp "$template" "$output"
python3 - "$output" <<'PY'
import os
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
replacements = {
    "REPLACE_WITH_GENERATED_POSTGRES_PASSWORD": os.environ["R4C_POSTGRES_PASSWORD"],
    "REPLACE_WITH_GENERATED_REDIS_PASSWORD": os.environ["R4C_REDIS_PASSWORD"],
    "REPLACE_WITH_GENERATED_MINIO_ACCESS_KEY": os.environ["R4C_MINIO_ACCESS_KEY"],
    "REPLACE_WITH_GENERATED_MINIO_SECRET_KEY": os.environ["R4C_MINIO_SECRET_KEY"],
    "REPLACE_WITH_GENERATED_JWT_ACCESS_SECRET": os.environ["R4C_JWT_ACCESS_SECRET"],
    "REPLACE_WITH_GENERATED_JWT_REFRESH_SECRET": os.environ["R4C_JWT_REFRESH_SECRET"],
    "REPLACE_WITH_GENERATED_BIM_WORKER_TOKEN": os.environ["R4C_BIM_WORKER_TOKEN"],
    "REPLACE_WITH_GENERATED_BOOTSTRAP_ADMIN_PASSWORD": os.environ[
        "R4C_BOOTSTRAP_ADMIN_PASSWORD"
    ],
    "REPLACE_WITH_GENERATED_UAT_ADMIN_PASSWORD": os.environ["R4C_UAT_ADMIN_PASSWORD"],
    "REPLACE_WITH_GENERATED_UAT_SUBMIT_PASSWORD": os.environ[
        "R4C_UAT_SUBMIT_PASSWORD"
    ],
}
for placeholder, value in replacements.items():
    if placeholder not in text:
        raise SystemExit(f"Missing expected placeholder: {placeholder}")
    text = text.replace(placeholder, value)
path.write_text(text, encoding="utf-8")
PY

chmod 600 "$output"
unset \
  R4C_POSTGRES_PASSWORD \
  R4C_REDIS_PASSWORD \
  R4C_MINIO_ACCESS_KEY \
  R4C_MINIO_SECRET_KEY \
  R4C_JWT_ACCESS_SECRET \
  R4C_JWT_REFRESH_SECRET \
  R4C_BIM_WORKER_TOKEN \
  R4C_BOOTSTRAP_ADMIN_PASSWORD \
  R4C_UAT_ADMIN_PASSWORD \
  R4C_UAT_SUBMIT_PASSWORD

echo "Created $output with mode 600 and independent generated secrets."
echo "Before deployment, edit domains, email addresses, and CLOUDFLARE_API_TOKEN."
echo "Do not commit or paste the completed file into an issue or pull request."
