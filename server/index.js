require('dotenv').config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require('cookie-parser')
const { createSocket } = require("./socket/socket");
const { configureRoutes } = require("./routes")

global.connectedUsers = new Map();

async function main() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use(cors({
    origin: `${process.env.DOMAIN}:${process.env.CLIENT_PORT}`,
    credentials: true
  }));

  const httpServer = http.createServer(app);

  createSocket(httpServer);
  configureRoutes(app);

  // Pour la SPA mais déjà pourquoi servir des fichiers statiques depuis 
  // le back ? Et apparement si à faire il va falloir passer par nginx ?
  // app.use(express.static('public'));

  // app.get("*", (req, res) => {
  //   res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  // });


  httpServer.listen(process.env.SERVER_PORT, () => {
    // console.log(`Server listening on ${process.env.DOMAIN}:${process.env.SERVER_PORT}`);
  });
}

main();
