import { Server } from 'socket.io';
import db from '../db.config.js';
import {
  updateStatusDisconnectQuery,
  updateStatusConnectionQuery,
  messageInsertQuery,
  fileInsertQuery,
  getMessagesQuery,
} from '../src/queries/chat.queries.js';
// import { Redis } from "ioredis";

// const pub = new Redis({
//   host: "caching-2a45750e-balajiaade2000-6af0.i.aivencloud.com",
//   port: 10231,
//   username: "default",
//   password: "AVNS_BVnT6Mqj8-oXIHPBHAv",
// });

// const sub = new Redis({
//   host: "caching-2a45750e-balajiaade2000-6af0.i.aivencloud.com",
//   port: 10231,
//   username: "default",
//   password: "AVNS_BVnT6Mqj8-oXIHPBHAv",
// });

class SocketService {
  constructor() {
    console.log('Init socket server...');

    const io = new Server({
      cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this._io = io;
    // sub.subscribe("MESSAGES");
  }

  initListeners = async () => {
    const io = this._io;

    console.log('Init socket listeners....');
    // const client = await db().connect();

    io.on('connect', socket => {
      socket.on('joined', async ({ user, storedSocketId, userId }) => {
        const client = await db().connect();

        try {
          const res = await client.query(getMessagesQuery);
          io.emit('get-all-messages', res.rows);
          console.log(
            `${user} has joined now with socket id ${storedSocketId}`
          );
          io.emit('user-connected', { userId });

          const query = updateStatusConnectionQuery;
          await client.query(query, [userId, true]);
          console.log(`User ${userId} status set to active`);
        } catch (err) {
          console.log(`Error setting user ${userId} status to active:`, err);
        } finally {
          client.release();
        }

        socket.on('disconnect', async () => {
          const disconnectClient = await db().connect();

          try {
            console.log(`User with id ${userId} is currently disconnected!!`);
            io.emit('user-disconnected', { userId });

            const query = updateStatusDisconnectQuery;
            await disconnectClient.query(query, [false, userId]);
            console.log(`User ${userId} status set to inactive`);
          } catch (err) {
            console.log(
              `Error setting user ${userId} status to inactive:`,
              err
            );
          } finally {
            disconnectClient.release();
          }
        });
      });

      socket.on(
        'message',
        async ({
          senderSocketId,
          senderId,
          receiverSocketId,
          receiverId,
          message,
        }) => {
          const messageClient = await db().connect();

          // publish this message to redis
          // await pub.publish(
          //   "MESSAGES",
          //   JSON.stringify({
          //     senderSocketId,
          //     senderId,
          //     receiverSocketId,
          //     receiverId,
          //     message,
          //   })
          // );

          try {
            console.log(
              `Message send by sender Id ${senderId} with socket id ${senderSocketId} and receiver id is ${receiverId} and socket id ${receiverSocketId} and message is ${message}`
            );
            io.emit('receive-message', {
              senderId,
              receiverId,
              message,
            });

            const query = messageInsertQuery;
            await messageClient.query(query, [senderId, receiverId, message]);
            console.log('Message stored in database');

            const res = await messageClient.query(getMessagesQuery);

            io.emit('get-all-messages', res.rows);
          } catch (err) {
            console.error('Error storing message in database:', err);
          } finally {
            messageClient.release();
          }
        }
      );

      socket.on('file-upload', async fileData => {
        const { receiverId, senderId, filePath } = fileData;
        const fileClient = await db().connect();

        try {
          console.log(
            `user from id -> ${senderId} send the file to id -> ${receiverId} the file is ${filePath} `
          );

          io.emit('file-received', {
            senderId,
            receiverId,
            filePath,
          });

          await fileClient.query(fileInsertQuery, [
            senderId,
            receiverId,
            filePath,
          ]);
          console.log('File info stored in database');

          const res = await fileClient.query(getMessagesQuery);

          io.emit('get-all-messages', res.rows);
        } catch (err) {
          console.log(err);
        } finally {
          fileClient.release();
        }
      });

      socket.on('typing', ({ sender, receiver }) => {
        io.emit('typing', { user: sender, receiver: receiver });
      });

      socket.on('start-call', async ({ userId, receiverId }) => {
        try {
          const token = generateZegoToken(userId);
          io.to(receiverId).emit('incoming-call', { userId, token });
        } catch (err) {
          console.error('Error initiating call:', err);
        }
      });

      socket.on('accept-call', async ({ userId, callerId }) => {
        try {
          const token = generateZegoToken(userId);
          io.to(callerId).emit('call-accepted', { userId, token });
        } catch (err) {
          console.error('Error accepting call:', err);
        }
      });
    });

    // sub.on("message", (channel, message) => {
    //   if (channel === "MESSAGES") {
    //     const parsedMessage = JSON.parse(message);
    //     io.emit("receive-message", parsedMessage);
    //   }
    // });
  };
}

export default SocketService;
