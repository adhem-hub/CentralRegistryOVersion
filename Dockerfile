FROM node:20

WORKDIR /app

# Install local dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

EXPOSE 4201

CMD ["npm", "start"]
