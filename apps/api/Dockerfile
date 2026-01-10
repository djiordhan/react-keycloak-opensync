FROM node:20-alpine

WORKDIR /app

COPY package.json ./

# Install defaults to pnpm if available, or just use npm for simplicity in demo inside docker
# But we are in a monorepo context. Assuming we copy content.
# For simplicity, we just npm install dependencies for this app.
RUN npm install

# We will mount source code, so usually CMD is dev
CMD ["npm", "run", "dev"]
