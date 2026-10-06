FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates git ripgrep \
  && rm -rf /var/lib/apt/lists/*

ENV HOME=/home/pi
ENV NPM_CONFIG_PREFIX=/home/pi/.npm-global
ENV PATH=/home/pi/.npm-global/bin:$PATH

# --ignore-scripts: don't run npm lifecycle scripts of pi or its dependencies
# at build time. Remove if pi needs a postinstall step and fails at runtime.
RUN mkdir -p /home/pi/.pi/agent /home/pi/.npm-global \
  && npm install -g --ignore-scripts @earendil-works/pi-coding-agent \
  && chmod -R 777 /home/pi

WORKDIR /workspace
ENTRYPOINT ["pi"]
