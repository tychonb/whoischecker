#!/bin/sh
set -eu

echo "Starting API..."
exec npm run start --workspace @whoischecker/api
