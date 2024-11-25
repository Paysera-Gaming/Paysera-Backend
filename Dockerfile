# Use Node.js image
FROM node:18-alpine

# Install tzdata to configure timezone
RUN apk add --no-cache tzdata

# Set the timezone to Asia/Manila
ENV TZ=Asia/Manila

# Create and set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Compile TypeScript files
RUN npm run build

# Expose the port specified in your .env file
EXPOSE ${PORT}

# Run the app
CMD ["node", "./dist/src/index.js"]
