FROM alpine:latest

LABEL maintainer="NHibiki"

# Builder

WORKDIR /server
COPY . .

RUN set -ex \
 && apk add --no-cache nodejs openssl ffmpeg \
 && apk add --no-cache curl python npm make g++ \
 && npm i -g yarn \
 && yarn install \
 && yarn build

# Packaging

FROM alpine:3.9

WORKDIR /server
COPY --from=0 /server /server

RUN apk add --no-cache nodejs openssl ffmpeg

EXPOSE 80

ENTRYPOINT ["node", "dist/index.js"]