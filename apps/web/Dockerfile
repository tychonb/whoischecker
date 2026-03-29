FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_MODE=live
ARG VITE_API_BASE_URL=/api
ENV VITE_API_MODE=${VITE_API_MODE}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package.json
COPY tsconfig.base.json tsconfig.base.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm install

COPY . .

RUN npm run build --workspace @whoischecker/web

FROM nginx:1.27-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
