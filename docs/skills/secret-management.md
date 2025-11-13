# Secret Management

## Overview

This project uses AWS Secrets Manager for secure storage and management of application secrets. The `scripts/manage-secrets.cjs` tool provides a CLI interface for initializing, updating, and managing secrets.

## Secret Naming Convention

Secrets follow the pattern: `{AppName}/{environment}/secrets`

Examples:
- `PawRush/preview-john/secrets` - Personal preview environment
- `PawRush/dev/secrets` - Development environment
- `PawRush/prod/secrets` - Production environment

## Required Secrets

Application-specific secrets will be documented here after infrastructure generation.

## Secret Management Tool Usage

The `manage-secrets.cjs` script provides commands for managing application secrets:

### Initialize Secrets
```bash
./scripts/manage-secrets.cjs init '{"KEY1":"TBD","KEY2":"TBD"}'
```

### View All Secrets (Masked)
```bash
./scripts/manage-secrets.cjs get
```

### Update Single Secret
```bash
./scripts/manage-secrets.cjs set KEY1 "new-value"
```

### Update Secret Interactively
```bash
./scripts/manage-secrets.cjs update KEY1
```

### Update All Secrets Interactively
```bash
./scripts/manage-secrets.cjs update-all
```

### Delete Secret Key
```bash
./scripts/manage-secrets.cjs delete KEY1
```

## Environment Variables

The tool respects these environment variables:
- `APP_NAME` - Override default app name
- `ENVIRONMENT` - Override default environment
- `SECRET_NAME` - Override default secret name

Example:
```bash
ENVIRONMENT=prod ./scripts/manage-secrets.cjs get
```

## Troubleshooting

### Permission Errors
Ensure your AWS credentials have `secretsmanager:*` permissions for the secret ARN.

### Secret Not Found
Initialize the secret using the `init` command before attempting other operations.

### TBD Values
Secrets initialized with "TBD" values will have a unique suffix appended. Use `update` or `update-all` to replace them with actual values.
