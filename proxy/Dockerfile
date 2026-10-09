# Reverse proxy: pinned, slim, non-root Nginx; config baked in (no bind mount)
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/nginx-health || exit 1
