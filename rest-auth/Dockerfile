FROM node:18-bullseye

# Builder stage

FROM node AS builder

# Use /app as the CWD
WORKDIR /app            

# Copy package.json and package-lock.json to /app
COPY package*.json ./   

# Install all dependencies
RUN npm ci               

# Copy the rest of the code
COPY . .                

# COPY config
COPY src/config/config.sample.ts src/config/config.ts

# Invoke the build script to transpile code to js
RUN npm run build       


# Final stage


FROM node AS final

# Prepare a destination directory for js files
RUN mkdir -p /app/dist                  

# Use /app as CWD
WORKDIR /app                            

# Copy package.json and package-lock.json
COPY package*.json ./                   

# Install only production dependencies
RUN npm ci --only=production             

# Copy transpiled js from builder stage into the final image
COPY --from=builder /app/dist ./dist

# Open desired port
EXPOSE 4002
ENV LOG_DESTINATION=stdout

COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD node ./dist/index.js



