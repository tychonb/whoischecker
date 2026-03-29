FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package.json
COPY tsconfig.base.json tsconfig.base.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json

RUN npm install

COPY . .

RUN npm run build --workspace @whoischecker/api
RUN chmod +x apps/api/scripts/docker-entrypoint.sh

EXPOSE 4000

CMD ["sh", "apps/api/scripts/docker-entrypoint.sh"]
