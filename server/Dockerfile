FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install -g nodemon
RUN npm install

COPY . .
RUN chmod +x ./database/download-pictures.sh

EXPOSE 3000

CMD ["node", "index.js"]

# CMD ["nodemon", "index.js"]