FROM jrottenberg/ffmpeg:4.2-ubuntu1804

LABEL maintainer="NHibiki"

# Builder

WORKDIR /server
COPY . .

RUN apt update \
 && apt install -y --no-install-recommends \
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
 && yarn build

EXPOSE 80

ENTRYPOINT ["node", "dist/index.js"]