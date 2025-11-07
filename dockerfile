# Build stage
FROM node:lts AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the files
COPY . .

# Command to start the development application
CMD ["npm", "run", "dev"]
