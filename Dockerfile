FROM node:22 AS build

WORKDIR /opt

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci

COPY tsconfig.json tsconfig.json
COPY tsconfig.defs.json tsconfig.defs.json
COPY ./src ./src
RUN npm run build --ignore-scripts -- -p ./tsconfig.defs.json


FROM node:22-alpine AS runtime

WORKDIR /opt

RUN apk add --no-cache tini

COPY --from=build /opt/dist /opt/dist
COPY --from=build /opt/package.json /opt/package.json

ENTRYPOINT ["/sbin/tini", "--", "node", "./dist/src/cli.js"]

CMD ["--"]
