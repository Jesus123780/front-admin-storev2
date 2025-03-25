# Base image for building
FROM node:lts-alpine AS base
WORKDIR /app

# Copy only package.json and package-lock.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install pkg-components npm-pkg-hook
RUN npm install -g npm && npm ci

# Copy the rest of the source code
COPY . .

# Build the application
RUN npm run build

# Final production image
FROM node:lts-alpine AS production
ENV PORT=3000
WORKDIR /app

# Copy artifacts from the build stage
COPY --from=base /app/nginx/default.conf /etc/nginx/sites-available/default
COPY --from=base /app/package*.json ./
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public

# Install production dependencies
RUN npm install -g npm && npm install next

EXPOSE 3000
CMD npm run start
