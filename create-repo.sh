#!/bin/bash

# GitHub CLIでリポジトリを作成してプッシュ
gh repo create suzuri-api \
  --public \
  --description "API server for creating SUZURI merchandise from uploaded images" \
  --source=. \
  --remote=origin \
  --push

echo "Repository created and pushed successfully!"
echo "Visit: https://github.com/$(gh api user --jq .login)/suzuri-api"