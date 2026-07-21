# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@10.13.1 --activate
WORKDIR /workspace

FROM base AS dependencies
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN --mount=type=cache,id=pnpm-api,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @r4c/api...

FROM dependencies AS builder
COPY apps/api apps/api
COPY packages packages
RUN pnpm --filter @r4c/api prisma:generate \
    && pnpm --filter @r4c/api build \
    && pnpm --filter @r4c/api deploy --prod --legacy /opt/r4c-api \
    && cp -R apps/api/dist /opt/r4c-api/dist \
    && cp -R apps/api/prisma /opt/r4c-api/prisma

FROM dependencies AS tools
COPY apps/api apps/api
COPY packages packages
RUN pnpm --filter @r4c/api prisma:generate
USER node
WORKDIR /workspace
ENTRYPOINT ["pnpm", "--filter", "@r4c/api"]
CMD ["--help"]

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    API_PORT=4000
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 r4c \
    && useradd --uid 10001 --gid 10001 --create-home --shell /usr/sbin/nologin r4c
WORKDIR /app
COPY --from=builder --chown=10001:10001 /opt/r4c-api ./
USER 10001:10001
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||4000)+'/api/v1/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
