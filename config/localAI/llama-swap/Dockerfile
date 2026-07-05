# Start from AMD's official llama.cpp ROCm image   gives us llama-server at /app/llama-server
FROM ghcr.io/ggml-org/llama.cpp:server-rocm

# Download the llama-swap binary (single Go binary, no dependencies)
ARG LLAMASWAP_VERSION=latest
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && ARCH=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/') \
    && curl -fsSL "https://github.com/mostlygeek/llama-swap/releases/latest/download/llama-swap-linux-${ARCH}" \
       -o /usr/local/bin/llama-swap \
    && chmod +x /usr/local/bin/llama-swap \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# llama-swap reads its config from here; we mount config.yaml into this path
ENTRYPOINT ["/usr/local/bin/llama-swap"]
CMD ["--config", "/config/config.yaml", "--listen", "0.0.0.0:8080"]
