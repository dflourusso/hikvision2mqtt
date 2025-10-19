# Use the official Node.js 18 LTS image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for better caching)
COPY package*.json ./

# Install dependencies
RUN yarn install --production

# Copy the entire project files
COPY . .

# Expose the application port
EXPOSE 3000
EXPOSE 5060

# Define the command to start the app
CMD ["node", "src/index.js"]