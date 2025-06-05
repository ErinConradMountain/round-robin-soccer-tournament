#!/usr/bin/env bash
# Setup project dependencies
# Learner Note: This script requires internet access to download packages.

set -e

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required. Install them from https://nodejs.org/" >&2
  exit 1
fi

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
