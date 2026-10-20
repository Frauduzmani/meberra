# Meberra — üretim imajı
# Node.js 24 LTS gerekir (yerleşik node:sqlite modülü kullanılır).
# bookworm-slim seçildi: glibc tabanlı, node:sqlite ile sorunsuz.
FROM node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production \
    DATA_DIR=/data \
    PORT=3000 \
    HOST=0.0.0.0 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false

# Önce yalnızca bağımlılık tanımlarını kopyala (katman önbelleği için).
# package-lock.json yoksa da çalışır: npm ci başarısız olursa npm install'a düşer.
COPY package*.json ./
RUN (npm ci --omit=dev || npm install --omit=dev) \
    && npm cache clean --force

# Uygulama dosyaları (.dockerignore gereksizleri dışarıda bırakır)
COPY --chown=node:node . .

# Kalıcı veri klasörü: SQLite (meberra.db, -wal, -shm), yüklemeler, yedekler
RUN mkdir -p /data \
    && chown -R node:node /data /app

VOLUME ["/data"]

# Root olmayan kullanıcı
USER node

EXPOSE 3000

# Sağlık kontrolü: GET /api/health -> 200
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
