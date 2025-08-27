# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the app port
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
