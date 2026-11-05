FROM node:26 AS build

WORKDIR /opt

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY tsconfig.json tsconfig.json
COPY tsconfig.defs.json tsconfig.defs.json
COPY ./examples ./examples
COPY ./src ./src
COPY ./test ./test
RUN npm run build --ignore-scripts -- -p ./tsconfig.defs.json
RUN npm test


FROM node:26-alpine AS runtime

WORKDIR /opt

RUN apk add --no-cache tini

COPY --from=build /opt/package.json /opt/package.json
COPY --from=build /opt/dist/src /opt/dist/src
ENTRYPOINT ["/sbin/tini", "--", "node", "./dist/src/cli.js"]

CMD ["--"]
