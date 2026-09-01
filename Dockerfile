# Builds CivilVerify for a persistent-disk host (Railway, Render, Fly.io, a
# plain VPS with Docker...). Two stages: build with full devDependencies and
# a C++ toolchain (better-sqlite3 compiles a native addon), then ship a slim
# runtime image with just the Next.js standalone output.

FROM node:20-bookworm-slim AS build
WORKDIR /app

# better-sqlite3 needs to compile a native addon at install time.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- runtime image ----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Standalone build already bundles the node_modules it needs (including the
# compiled better-sqlite3 addon) — no toolchain required at runtime.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# data/ (SQLite db + uploaded files) must survive redeploys — mount your
# host's persistent volume at /app/data. Created here so the app has
# somewhere to write before a volume is attached too.
RUN mkdir -p /app/data/uploads

EXPOSE 3000
CMD ["node", "server.js"]
