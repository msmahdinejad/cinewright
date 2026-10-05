# pure-code-video in a box: Node + Chromium + ffmpeg + the skill. No install on your machine, same result on Windows, macOS and Linux.
#
#   docker build -t pure-code-video .
#   docker run --rm -v "$PWD/film:/work" pure-code-video scaffold /work --template showreel
#   docker run --rm -v "$PWD/film:/work" pure-code-video render            # → film/out/video.mp4
#   docker run --rm pure-code-video doctor
#
# Rendering uses Chromium's software GL (SwiftShader) inside the container: correct but slower than a real GPU.
FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium ffmpeg fonts-noto-core ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV PCV_GPU=off \
    CHROME_PATH=/usr/bin/chromium \
    NODE_ENV=production
COPY skills/pure-code-video /opt/pure-code-video
COPY docker/entrypoint.sh /usr/local/bin/pcv
RUN chmod +x /usr/local/bin/pcv && mkdir -p /work
WORKDIR /work
ENTRYPOINT ["pcv"]
CMD ["doctor"]
