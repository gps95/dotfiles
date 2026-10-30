FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     bash ca-certificates git ripgrep ffmpeg libpulse0 iproute2 curl procps libnotify-bin \
  && rm -rf /var/lib/apt/lists/*

ENV HOME=/home/pi
# mic access: host Pulse/PipeWire socket mounted at /run/pw/pulse (see docker-compose.yaml)
ENV PULSE_SERVER=unix:/run/pw/pulse/native
ENV NPM_CONFIG_PREFIX=/home/pi/.npm-global
ENV PATH=/home/pi/.npm-global/bin:$PATH

RUN mkdir -p /home/pi/.pi/agent /home/pi/.npm-global \
  && npm install -g --ignore-scripts @earendil-works/pi-coding-agent \
  && chown -R 1000:1000 /home/pi

WORKDIR /workspace
ENTRYPOINT ["pi"]
