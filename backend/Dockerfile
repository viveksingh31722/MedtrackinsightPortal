FROM node:18-alpine

WORKDIR /app

# Install openssl for Prisma compatibility on Alpine
RUN apk add --no-cache openssl curl

COPY package*.json ./
RUN npm ci

# Copy Prisma files to generate client
COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["node", "entrypoint.js"]
