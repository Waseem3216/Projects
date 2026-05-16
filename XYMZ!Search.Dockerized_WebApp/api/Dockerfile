# XYMZ API Container
# A tiny Node.js service used to demonstrate a backend container in Docker Compose.
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
COPY server.js ./

USER node
EXPOSE 3000

# Health check uses Node itself instead of curl/wget so it works reliably on minimal Alpine images.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/api/health', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
