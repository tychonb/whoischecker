# WhoisChecker Platform

Productiegerichte monorepo voor secure domeinmonitoring met React, TypeScript, Express, Prisma, BullMQ en Docker.

## Status

Deze codebase is nu geschikt als basis voor een VPS-deploy met Docker:

- frontend draait tegen de echte API via `/api`
- backend gebruikt Prisma als runtime datastore
- Docker voert migraties uit in een aparte, eenmalige migratiecontainer
- seeding gebeurt nooit automatisch
- demo-data wordt alleen geladen als je dat expliciet toestaat
- productie start niet wanneer secrets ontbreken of veilige cookies/HTTPS niet zijn ingesteld

Belangrijk:

- Een `git push` overschrijft je database niet.
- `docker compose up -d` seedt je database niet.
- Alleen `npm run seed` schrijft demo-data, en zelfs dat werkt alleen met expliciete env-flags.

## Inhoud

- `apps/web`: Vite + React + TypeScript adminfrontend
- `apps/api`: Express API met auth, RBAC, audit logging, live RDAP/WHOIS checks en registrar/notificatie-services
- `packages/shared`: gedeelde types en validaties
- `apps/api/prisma`: Prisma schema, migraties en seedscript
- `docker-compose.yml`: VPS/Docker-opzet met Postgres, Redis, API en web

## Lokale ontwikkeling

1. Kopieer `.env.example` naar `.env`.
2. Installeer dependencies met `npm install`.
3. Start lokaal met `npm run dev`.
4. Open [http://localhost:5173](http://localhost:5173).

De Vite-devserver proxyt `/api` automatisch naar de lokale API op poort `4000`.

## Demo-login

- E-mail: `eva@monitoring.internal`
- Wachtwoord: `ChangeMe!123`

Gebruik deze gebruiker uitsluitend lokaal. Seed demo-data niet op een publiek bereikbare productieomgeving.

## Productie met Docker op een VPS

1. Plaats de code op de server.
2. Maak een echte `.env` aan op basis van `.env.example`.
3. Zet minimaal deze variabelen goed:
   - `JWT_SECRET`
   - `SECRET_ENCRYPTION_KEY`
   - `POSTGRES_PASSWORD`
   - `REDIS_PASSWORD`
   - `FRONTEND_ORIGIN`
   - `COOKIE_SECURE=true`
4. Genereer secrets, bijvoorbeeld met `openssl rand -hex 32`. Hergebruik geen secret voor JWT, encryptie, PostgreSQL of Redis.
5. Plaats de stack achter een TLS-reverse-proxy naar `127.0.0.1:8080`. Publiceer API, PostgreSQL en Redis nooit rechtstreeks.
6. Start de stack:

```bash
docker compose up -d --build
```

Wat er dan gebeurt:

- Postgres en Redis starten met persistente volumes
- een eenmalige migratiecontainer draait `prisma migrate deploy`
- de API start alleen nadat de migratie succesvol is afgerond
- Nginx serveert de frontend en proxyt `/api` naar de API-container

## Database en migraties

Schemawijzigingen worden in productie uitgerold via:

```bash
npm run db:deploy
```

of in Docker automatisch via de aparte `migrate`-service.

De database wordt niet gereset tijdens normale deploys.

## Demo-data seeden

Seeding is optioneel en standaard uitgeschakeld.

Lokaal of op een lege server:

```bash
ALLOW_DB_SEED=true npm run seed
```

In productie moet je extra expliciet zijn:

```bash
ALLOW_DB_SEED=true SEED_ALLOW_PRODUCTION=true npm run seed
```

Gebruik dit alleen eenmalig als je bewust demo-data wilt laden. Het seedscript gebruikt `upsert` en voert geen reset uit, maar het kan bestaande demo-records met dezelfde vaste ids wel bijwerken.

## Belangrijke scripts

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm run test`
- `npm run db:deploy`
- `npm run seed`

## API-overzicht

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/dashboard`
- `GET /api/domains`
- `POST /api/domains`
- `PATCH /api/domains/:id`
- `POST /api/domains/:id/manual-check`
- `POST /api/domains/:id/pause`
- `POST /api/domains/:id/resume`
- `GET /api/settings`
- `PUT /api/settings/notifications`
- `POST /api/settings/notifications/test`
- `PUT /api/settings/openprovider`
- `POST /api/settings/openprovider/test`
- `GET /api/audit-logs`
- `GET /api/registrations`
- `POST /api/registrations/:id/retry`

## Validatie

Succesvol uitgevoerd:

- `npm run typecheck`
- `npm run build`
- `npm run test --workspace @whoischecker/api`
- `npm audit --omit=dev` (`0` kwetsbaarheden)
- volledige Docker-build en start
- Prisma-productiemigratie op een bestaande persistente database
- HTTP healthcheck en container-hardening

Niet uitgevoerd:

- echte live registratiecall naar Openprovider

## Volgende logische stap

Voor een echte productie-uitrol zou ik hierna nog doen:

- Prisma ook gebruiken voor alle job-observability-tabellen
- aanvullende TLD-specifieke validatieregels voor Openprovider toevoegen
- geautomatiseerde versleutelde PostgreSQL-back-ups en restore-tests op VPS-niveau toevoegen
- CI voor build, tests en image-publish inrichten
