FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     bash ca-certificates git ripgrep ffmpeg libpulse0 iproute2 curl procps \
  && rm -rf /var/lib/apt/lists/*

ENV HOME=/home/pi
# mic access: host Pulse/PipeWire socket mounted at /run/pw/pulse (see docker-compose.yaml)
ENV PULSE_SERVER=unix:/run/pw/pulse/native
ENV NPM_CONFIG_PREFIX=/home/pi/.npm-global
ENV PATH=/home/pi/.npm-global/bin:$PATH

# --ignore-scripts: don't run npm lifecycle scripts of pi or its dependencies
# at build time. Remove if pi needs a postinstall step and fails at runtime.
# No user account needed (the node base image already owns uid 1000);
# make /home/pi owned by numeric 1000:1000 to match the host user
# (PI_UID/PI_GID in .env) so bind mounts and the pi-npm volume stay
# owned by the host user.
RUN mkdir -p /home/pi/.pi/agent /home/pi/.npm-global \
  && npm install -g --ignore-scripts @earendil-works/pi-coding-agent \
  && chown -R 1000:1000 /home/pi

WORKDIR /workspace
ENTRYPOINT ["pi"]
