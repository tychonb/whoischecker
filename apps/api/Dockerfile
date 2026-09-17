FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.base.json tsconfig.base.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY . .

RUN npm run db:generate --workspace @whoischecker/api
RUN npm run build --workspace @whoischecker/api
RUN chmod +x apps/api/scripts/docker-entrypoint.sh

FROM build AS migration

CMD ["npx", "prisma", "migrate", "deploy", "--schema", "apps/api/prisma/schema.prisma"]

FROM build AS production-dependencies

RUN npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=production-dependencies --chown=node:node /app/node_modules /app/node_modules
COPY --from=build --chown=node:node /app/package.json /app/package.json
COPY --from=build --chown=node:node /app/apps/api/package.json /app/apps/api/package.json
COPY --from=build --chown=node:node /app/packages/shared/package.json /app/packages/shared/package.json
COPY --from=build --chown=node:node /app/apps/api/dist /app/apps/api/dist
COPY --from=build --chown=node:node /app/apps/api/prisma /app/apps/api/prisma
COPY --from=build --chown=node:node /app/apps/api/scripts /app/apps/api/scripts

USER node

EXPOSE 4000

CMD ["sh", "apps/api/scripts/docker-entrypoint.sh"]
