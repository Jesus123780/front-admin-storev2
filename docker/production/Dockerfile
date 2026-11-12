
# ==================================================
# BUILD - Next.js
# ==================================================

FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./

RUN npm ci --no-audit --no-fund

COPY . .

# Compilar solamente la aplicación web.
RUN npm run next:build

# Verificar que Next.js generó standalone.
RUN test -f .next/standalone/server.js


# ==================================================
# PRODUCTION
# ==================================================

FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copiar los archivos necesarios de standalone.
COPY --from=builder --chown=node:node \
  /app/.next/standalone ./

# Copiar archivos estáticos.
COPY --from=builder --chown=node:node \
  /app/.next/static ./.next/static

# Copiar carpeta pública.
COPY --from=builder --chown=node:node \
  /app/public ./public

# Permitir que Next.js escriba su caché.
RUN mkdir -p .next/cache && \
    chown -R node:node .next

USER node

EXPOSE 3000

CMD ["node", "server.js"]
