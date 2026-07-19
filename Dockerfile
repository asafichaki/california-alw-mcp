FROM node:20-alpine

LABEL org.opencontainers.image.source="https://github.com/asafichaki/california-alw-mcp"
LABEL org.opencontainers.image.description="Read-only MCP server for California Medi-Cal Assisted Living Waiver open data"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY data ./data

USER node
ENTRYPOINT ["node", "src/index.js"]
