FROM ghcr.io/puppeteer/puppeteer
WORKDIR /src/
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run migration:generate
CMD ["npm", "start"]
