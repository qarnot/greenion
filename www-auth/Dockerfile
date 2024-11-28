FROM node:18-bullseye

# Builder stage

FROM node AS builder

# Use /app as the CWD
WORKDIR /app            

# Copy package.json and yarn.lock to /app
COPY package.json ./   
COPY yarn.lock ./   

# Install all dependencies
RUN yarn

# Copy the rest of the code
COPY . .                

# Invoke the build script to transpile code to js
RUN npm run build       


# Final stage


FROM node AS final

# Prepare a destination directory for js files
RUN mkdir -p /app/dist                  

# Use /app as CWD
WORKDIR /app                            

# Copy package.json and package-lock.json
COPY package.json ./   
COPY yarn.lock ./   

# Install only production dependencies
RUN yarn --production             

# Copy transpiled js from builder stage into the final image
COPY --from=builder /app/dist ./dist

# Open desired port
EXPOSE 3002
ENV LOG_DESTINATION stdout

COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD npm run preview -- --port 3002 --host
