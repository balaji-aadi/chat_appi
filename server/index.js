import express from "express";
import http from "http";
import bodyParser from "body-parser";
import SocketService from "./services/socket.js";
import db from "./db.config.js";
import cors from "cors";
import "dotenv/config";

const app = express();
export const socketService = new SocketService();

function init() {
  const port = process.env.PORT || 8002;
  const httpServer = http.createServer(app);

  socketService._io.attach(httpServer);

  httpServer.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });

  socketService.initListeners();

  db();
}

init();

app.use(bodyParser.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "GET,POST",
    credentials: true,
  })
);
express.static("uploads");

// routes import
import chatRoutes from "./src/routes/index.route.js";

// routes declaration
app.use(chatRoutes);
