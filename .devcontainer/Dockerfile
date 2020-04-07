FROM node:13

LABEL maintainer="NHibiki"

# Builder

WORKDIR /server
COPY . .

RUN apt-get update \
 && apt-get install -y --no-install-recommends mininet \
 && apt-get install -y --no-install-recommends python make g++ \
 && apt-get install -y --no-install-recommends mininet \
 && apt-get install -y --no-install-recommends openssl ffmpeg \
 && apt-get install -y --no-install-recommends  \
 && npm config set strict-ssl false \
 && yarn config set strict-ssl false \
 && yarn install \
 && yarn build 

# Packaging

FROM node:13

WORKDIR /server
COPY --from=0 /server /server

EXPOSE 80
