#!/bin/bash
# Vercel Ignored Build Step
# Only deploys to production if commit message contains "deploy"
# Exit 0 = skip build, Exit 1 = proceed with build

if [ "$VERCEL_GIT_COMMIT_REF" == "main" ] && [[ ! "$VERCEL_GIT_COMMIT_MESSAGE" == *"deploy"* ]]; then
  echo "🛑 Skipping deploy — commit message does not contain 'deploy'"
  exit 0
else
  echo "✅ Proceeding with deploy"
  exit 1
fi
