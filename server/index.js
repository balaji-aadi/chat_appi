import express from "express";
import http from "http";
import bodyParser from "body-parser";
import SocketService from "./services/socket.js";
import db from "./db.config.js";
import cors from "cors";

const app = express();
const socketService = new SocketService();

function init() {
  const port = 8001;
  const httpServer = http.createServer(app);

  socketService._io.attach(httpServer);

  httpServer.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });

  socketService.initListeners();

  db();
}

app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "GET,POST",
    credentials: true,
  })
);

app.post("/generate-socket-id", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const client = await db().connect();

  try {
    const query = "SELECT * FROM account_customuser WHERE email = $1";
    const result = await client.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const socketId = socketService._io.engine.generateId();

    const updateQuery =
      "UPDATE account_customuser SET socket_id = $1 WHERE email = $2";
    await client.query(updateQuery, [socketId, email]);

    return res.status(200).json({
      message: "Socket ID generated and updated successfully",
      socketId,
    });
  } catch (error) {
    console.error("Error generating socket ID:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

app.get("/api/messages", async (req, res) => {
  const client = await db().connect();
  try {
    const result = await client.query(
      "SELECT * FROM messages ORDER BY created_at ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send("Server error");
  }
});

app.get("/api/status", async (req, res) => {
  const client = await db().connect();
  try {
    const result = await client.query("SELECT * FROM status");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send("Server error");
  }
});

init();
