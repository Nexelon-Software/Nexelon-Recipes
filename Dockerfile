FROM node:18-alpine AS base

# Enable Corepack for package manager versioning
RUN corepack enable
# Make sure we have the required npm version (as specified in package.json)
RUN npm install -g npm@10.9.2

RUN apk add --no-cache libc6-compat

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

RUN npm install -g corepack@0.20
RUN corepack enable

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ENV NEXT_TELEMETRY_DISABLED 1

ARG _BETTER_AUTH_SECRET
ARG _GOOGLE_CLIENT_ID
ARG _GOOGLE_CLIENT_SECRET
ARG _DATABASE_URL
ARG _NEXT_PUBLIC_SERVER_URL

ENV BETTER_AUTH_SECRET=${_BETTER_AUTH_SECRET}
ENV GOOGLE_CLIENT_ID=${_GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${_GOOGLE_CLIENT_SECRET}
ENV DATABASE_URL=${_DATABASE_URL}
ENV NEXT_PUBLIC_SERVER_URL=${_NEXT_PUBLIC_SERVER_URL}

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
