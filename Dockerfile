FROM jrottenberg/ffmpeg:4.2-ubuntu1804

LABEL maintainer="NHibiki"

# Builder

WORKDIR /server
COPY . .

RUN apt update \
 && apt install -y --no-install-recommends \
    wget \
    curl \
    gnupg \
    gcc \
    g++ \
    make \
    iproute2 \
    iputils-ping \
    mininet \
    net-tools \
    openvswitch-switch \
    openvswitch-testcontroller \
    tcpdump \
 && curl -sL https://deb.nodesource.com/setup_12.x | bash - \
 && apt install -y --no-install-recommends nodejs \
 && rm -rf /var/lib/apt/lists/* \
 && npm i -g yarn \
 && yarn install \
 && mkdir -p /server/keys \
 && mkdir -p /server/media \
 && wget -qO /server/quic/backend https://github.com/NegativeLatency/backend/releases/download/v0.1/backend \
 && chmod +x /server/quic/backend

EXPOSE 1935
EXPOSE 8087
EXPOSE 8088
EXPOSE 8089

ENTRYPOINT ["npx", "ts-node", "src/index.ts"]