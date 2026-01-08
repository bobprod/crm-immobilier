# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Générer Prisma Client
RUN npx prisma generate

# Build de l'application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Copier package.json et installer uniquement les dépendances de production
COPY package*.json ./
RUN npm ci --only=production

# Copier les fichiers Prisma pour la génération
COPY prisma ./prisma
RUN npx prisma generate

# Copier le build depuis l'étape builder
COPY --from=builder /app/dist ./dist

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

USER nestjs

# Exposer le port
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Commande de démarrage
CMD ["node", "dist/main"]
