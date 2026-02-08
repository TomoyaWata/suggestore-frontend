# 開発環境用Dockerfile（Vite開発サーバー）
FROM node:20-alpine

WORKDIR /app

# パッケージファイルをコピーして依存関係をインストール
COPY package*.json ./
RUN npm install

# ソースコードをコピー
COPY . .

# Vite開発サーバーを起動
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
