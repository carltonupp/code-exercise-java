FROM node:22-alpine AS dependencies
WORKDIR /workspace/web
COPY web/package.json web/package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /workspace
COPY --from=dependencies /workspace/web/node_modules ./web/node_modules
COPY openapi.yaml ./openapi.yaml
COPY web/ ./web/
WORKDIR /workspace/web
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /workspace/web
ENV NODE_ENV=production
COPY --from=build /workspace/web/package.json ./package.json
COPY --from=build /workspace/web/node_modules ./node_modules
COPY --from=build /workspace/web/.next ./.next
COPY --from=build /workspace/web/public ./public
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]
