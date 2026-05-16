# XYMZ Frontend Container
# Serves the retro search portal with NGINX and proxies /api/* to the API container.
FROM nginx:1.27-alpine3.18

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/healthz || exit 1
