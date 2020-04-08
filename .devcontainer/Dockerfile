FROM node:13

LABEL maintainer="NHibiki"

# Builder

WORKDIR /server
COPY . .

RUN apt-get update \
 && apt-get update && apt-get install -y --no-install-recommends \
    curl \
    iproute2 \
    iputils-ping \
    mininet \
    net-tools \
    openvswitch-switch \
    openvswitch-testcontroller \
    tcpdump \
 && apt-get install -y --no-install-recommends python make g++ \
 && apt-get install -y --no-install-recommends mininet \
 && apt-get install -y --no-install-recommends openssl ffmpeg \
 && npm config set strict-ssl false \
 && yarn config set strict-ssl false \
 && service openvswitch-switch start

EXPOSE 80
