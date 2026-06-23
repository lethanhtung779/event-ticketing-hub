# ---- Build ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

COPY apps/api/package.json ./apps/api/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter api build

# ---- Production ----
FROM node:20-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate && apk add --no-cache openssl

ENV NODE_ENV=production

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY apps/api/prisma ./apps/api/prisma
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

EXPOSE 3000

CMD ["node", "apps/api/dist/main"]
