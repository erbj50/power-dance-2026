FROM node:18-slim

# Instala o yt-dlp, ffmpeg e dependências do sistema
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    curl \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copia os ficheiros de dependências da subpasta bot-render
COPY bot-render/package*.json ./

# Instala apenas as dependências do bot
RUN npm install

# Copia todo o código da subpasta bot-render
COPY bot-render/ .

EXPOSE 10000

CMD ["node", "index.js"]