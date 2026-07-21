# syntax=docker/dockerfile:1.7

ARG CADDY_VERSION=2.11.4
ARG CLOUDFLARE_PLUGIN_VERSION=v0.2.3

FROM caddy:${CADDY_VERSION}-builder-alpine AS builder
ARG CADDY_VERSION
ARG CLOUDFLARE_PLUGIN_VERSION
RUN xcaddy build v${CADDY_VERSION} \
    --with github.com/caddy-dns/cloudflare@${CLOUDFLARE_PLUGIN_VERSION}

FROM caddy:${CADDY_VERSION}-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
RUN addgroup --system --gid 10001 r4c \
    && adduser --system --disabled-password --no-create-home --uid 10001 --ingroup r4c r4c \
    && setcap cap_net_bind_service=+ep /usr/bin/caddy \
    && chown -R 10001:10001 /data /config /etc/caddy /srv
USER 10001:10001
