#!/bin/sh

# This script expects the base64 string in the SERVICE_ACCOUNT environment variable

if [ -z "$SERVICE_ACCOUNT" ]; then
  echo "Error: SERVICE_ACCOUNT environment variable is not set."
  exit 1
fi

# Decode and write to SimpleChatApp/android/service-account.json
echo $SERVICE_ACCOUNT | base64 -di > SimpleChatApp/android/service-account.json

echo "Decoded service-account.json written to SimpleChatApp/android/service-account.json"