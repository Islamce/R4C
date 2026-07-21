# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
WORKDIR /workspace

FROM base AS dependencies
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN --mount=type=cache,id=pnpm-web,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @r4c/web... --filter @r4c/contracts...

FROM dependencies AS builder
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY apps/web apps/web
COPY packages packages
RUN pnpm --filter @r4c/web build

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN groupadd --gid 10001 r4c \
    && useradd --uid 10001 --gid 10001 --create-home --shell /usr/sbin/nologin r4c
WORKDIR /app
COPY --from=builder --chown=10001:10001 /workspace/apps/web/.next/standalone ./
COPY --from=builder --chown=10001:10001 /workspace/apps/web/.next/static ./apps/web/.next/static
USER 10001:10001
WORKDIR /app/apps/web
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
