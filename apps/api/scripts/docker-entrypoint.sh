#!/bin/sh
set -eu

echo "Applying Prisma migrations..."
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

echo "Starting API..."
exec npm run start --workspace @whoischecker/api
