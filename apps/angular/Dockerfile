FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Ensure the generation script is executable
RUN chmod +x /app/generate-env.sh

# Run the environment generation script and start the dev server
CMD ["/bin/sh", "-c", "/app/generate-env.sh && npm run dev -- --host 0.0.0.0"]
