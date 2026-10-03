# Pi coding agent (@earendil-works/pi-coding-agent)
# Based on the official guide: packages/coding-agent/docs/containerization.md
# Pi requires Node >= 22.19.0; node:24 satisfies that.
FROM node:24-bookworm-slim

# Tools Pi's built-in tools rely on (bash, git, ripgrep) plus CA certs for HTTPS.
RUN apt-get update \
    && apt-get install -y --no-install-recommends bash ca-certificates git ripgrep \
    && rm -rf /var/lib/apt/lists/*

# Pin a version for reproducible builds, e.g.:
#   docker build --build-arg PI_VERSION=0.80.10 ...
ARG PI_VERSION=latest
RUN npm install -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_VERSION}

# Run as the unprivileged "node" user (UID 1000) that ships with the base image.
# Pre-create the config dir so a named volume inherits the right ownership.
RUN mkdir -p /home/node/.pi/agent /workspace \
    && chown -R node:node /home/node/.pi /workspace
USER node
WORKDIR /workspace

ENTRYPOINT ["pi"]