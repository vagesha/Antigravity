# Use the official Node.js Alpine image for a small footprint
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Only copy package files to optimize Docker cache
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Bundle the rest of the application source code
COPY . .

# Environment port mapping fallback (Render/Cloud Run usually provide PORT env)
ENV PORT=8080
EXPOSE 8080

# Command to start the application
CMD [ "npm", "start" ]
