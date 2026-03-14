# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps: install production dependencies only
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — builder: compile TypeScript
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — production: lean final image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Use non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nestjs

# Copy production node_modules (includes prisma CLI + @prisma/client)
COPY --from=deps /app/node_modules ./node_modules

# Copy compiled application
COPY --from=builder /app/dist ./dist

# Copy Prisma schema (required for prisma generate + runtime migration checks)
COPY prisma ./prisma

# Generate Prisma client binaries for the current platform (linux/musl)
RUN npx prisma generate

# Hand ownership to the non-root user
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
