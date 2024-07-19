import { Server } from "socket.io";
import db from "../db.config.js";

class SocketService {
  constructor() {
    console.log("Init socket server...");

    const io = new Server({
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this._io = io;
  }

  initListeners = async () => {
    const io = this._io;

    console.log("Init socket listeners....");
    const client = await db().connect();

    io.on("connect", (socket) => {
      socket.on("joined", async ({ user, storedSocketId, userId }) => {
        console.log(`${user} has joined now with socket id ${storedSocketId}`);

        try {
          const query = `
            INSERT INTO status (user_id, is_active) VALUES ($1, $2)
            ON CONFLICT (user_id) 
            DO UPDATE SET is_active = EXCLUDED.is_active;
          `;
          io.emit("user-connected", { userId });
          await client.query(query, [userId, true]);
          console.log(`User ${userId} status set to active`);
        } catch (err) {
          console.log(`Error setting user ${userId} status to active:`, err);
        }

        socket.on("disconnect", async () => {
          console.log(`User with id ${userId} is currently disconnected!!`);

          try {
            const query = "UPDATE status SET is_active = $1 WHERE user_id = $2";
            io.emit("user-disconnected", { userId });
            await client.query(query, [false, userId]);
            console.log(`User ${userId} status set to inactive`);
          } catch (err) {
            console.log(
              `Error setting user ${userId} status to inactive:`,
              err
            );
          }
        });
      });

      socket.on(
        "message",
        async ({
          senderSocketId,
          senderId,
          receiverSocketId,
          receiverId,
          message,
        }) => {
          console.log(
            `Message send by sender Id ${senderId} with socket id ${senderSocketId} and receiver id is ${receiverId} and socket id ${receiverSocketId} and message is ${message}`
          );
          io.emit("receive-message", {
            senderSocketId,
            senderId,
            receiverSocketId,
            receiverId,
            message,
          });

          try {
            const query =
              "INSERT INTO messages (sender_id, receiver_id, message) VALUES ($1, $2, $3)";
            await client.query(query, [senderId, receiverId, message]);
            console.log("Message stored in database");
          } catch (err) {
            console.error("Error storing message in database:", err);
          }
        }
      );
    });
  };
}

export default SocketService;
