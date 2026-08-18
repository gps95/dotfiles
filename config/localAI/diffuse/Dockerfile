##### Build stage #####
FROM rocm/dev-ubuntu-24.04:latest AS build

ARG GPU_TARGET=gfx1101
ARG SD_CPP_BRANCH=master

RUN apt-get update && apt-get install -y --no-install-recommends \
    cmake \
    ninja-build \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Node.js + pnpm are needed to build the embedded sdcpp-webui frontend
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g pnpm && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN git clone --recursive --depth 1 --branch ${SD_CPP_BRANCH} \
    https://github.com/leejet/stable-diffusion.cpp.git .

RUN rm -rf build && mkdir build && cd build && \
    cmake .. -G Ninja \
      -DCMAKE_BUILD_TYPE=Release \
      -DSD_HIPBLAS=ON \
      -DAMDGPU_TARGETS=${GPU_TARGET} \
      -DCMAKE_POSITION_INDEPENDENT_CODE=ON && \
    ninja sd-server

##### Runtime stage #####
FROM ubuntu:24.04 AS runtime

ENV ROCM_PATH=/opt/rocm
ENV LD_LIBRARY_PATH=${ROCM_PATH}/lib

COPY --from=build /opt/rocm/lib /opt/rocm/lib

RUN apt-get update && apt-get install -y --no-install-recommends \
    libnuma1 libgomp1 libelf1 libdrm2 libdrm-amdgpu1 \
    adduser \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system render && adduser --system --ingroup render render

WORKDIR /workspace

COPY --from=build /app/build/bin/sd-server /usr/local/bin/sd-server
RUN chmod +x /usr/local/bin/sd-server

EXPOSE 8085
ENTRYPOINT ["/usr/local/bin/sd-server"]
CMD ["--listen-port", "8085"]
