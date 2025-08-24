#!/bin/bash

# Parse arguments
DRY_RUN=false
PREFIX=""

for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      if [ -z "$PREFIX" ]; then
        PREFIX="$arg"
      fi
      shift
      ;;
  esac
done

# Set default prefix if not provided
PREFIX="${PREFIX:-pawrush}"

echo "Using prefix: $PREFIX"
if [ "$DRY_RUN" = true ]; then
  echo "DRY RUN MODE - No resources will be deleted"
fi

# Remove all S3 buckets that start with the prefix
for bucket in $(aws s3api list-buckets --query "Buckets[?starts_with(Name, '$PREFIX')].Name" --output text); do
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would remove bucket: $bucket"
  else
    echo "Removing bucket: $bucket"
    aws s3 rm "s3://$bucket" --recursive
    aws s3api delete-bucket --bucket "$bucket"
  fi
done

# Remove all CodePipelines that start with the prefix
for pipeline in $(aws codepipeline list-pipelines --query "pipelines[?starts_with(name, '$PREFIX')].name" --output text); do
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would remove pipeline: $pipeline"
  else
    echo "Removing pipeline: $pipeline"
    aws codepipeline delete-pipeline --name "$pipeline"
  fi
done

# Remove all CodeBuild projects that start with the prefix
for project in $(aws codebuild list-projects --query "projects[?starts_with(@, '$PREFIX')]" --output text); do
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would remove CodeBuild project: $project"
  else
    echo "Removing CodeBuild project: $project"
    aws codebuild delete-project --name "$project"
  fi
done

# Remove all Amplify apps that start with the prefix
for app in $(aws amplify list-apps --query "apps[?starts_with(name, '$PREFIX')].appId" --output text); do
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would remove Amplify app: $app"
  else
    echo "Removing Amplify app: $app"
    aws amplify delete-app --app-id "$app"
  fi
done

# Remove CodeStar notification rules that start with the prefix
for notification_rule in $(aws codestar-notifications list-notification-rules --query "NotificationRules[].Arn" --output text); do
  # Get the name of the notification rule to check if it starts with our prefix
  rule_name=$(aws codestar-notifications describe-notification-rule --arn "$notification_rule" --query "Name" --output text 2>/dev/null)
  if [[ "$rule_name" == "$PREFIX"* ]]; then
    if [ "$DRY_RUN" = true ]; then
      echo "[DRY RUN] Would remove CodeStar notification rule: $rule_name ($notification_rule)"
    else
      echo "Removing CodeStar notification rule: $rule_name ($notification_rule)"
      aws codestar-notifications delete-notification-rule --arn "$notification_rule"
    fi
  fi
done

# Remove all IAM roles that start with the prefix
for role in $(aws iam list-roles --query "Roles[?starts_with(RoleName, '$PREFIX')].RoleName" --output text); do
  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would remove IAM role: $role"
  else
    echo "Removing IAM role: $role"
    # Detach all policies first
    for policy in $(aws iam list-attached-role-policies --role-name "$role" --query "AttachedPolicies[].PolicyArn" --output text); do
      aws iam detach-role-policy --role-name "$role" --policy-arn "$policy"
    done
    # Delete inline policies
    for policy in $(aws iam list-role-policies --role-name "$role" --query "PolicyNames[]" --output text); do
      aws iam delete-role-policy --role-name "$role" --policy-name "$policy"
    done
    aws iam delete-role --role-name "$role"
  fi
done