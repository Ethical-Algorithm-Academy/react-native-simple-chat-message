#!/bin/sh

# This script expects the changelog content as the first argument

CHANGELOG_CONTENT="$1"

if [ -z "$CHANGELOG_CONTENT" ]; then
  echo "No changelog content provided. Writing default message."
  printf "%s\n" "no changes identified" > CHANGELOG.md
  echo "CHANGELOG.md updated with default message."
  exit 0
fi

# Write the content to CHANGELOG.md in the project root
printf "%s\n" "$CHANGELOG_CONTENT" > CHANGELOG.md

echo "CHANGELOG.md updated." 