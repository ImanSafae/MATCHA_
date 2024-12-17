FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 5173

RUN npm run prepare

CMD ["npm", "run", "dev", "--", "--host"]
