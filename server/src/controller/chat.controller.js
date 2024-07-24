import db from "../../db.config.js";
import {
  findUserEmailQuery,
  getFileDataQuery,
  getMessagesQuery,
  getUserStatusQuery,
  updateUserDataQuery,
} from "../queries/chat.queries.js";
import { socketService } from "../../index.js";
import { uploadOnCloudinary } from "../../services/cloudinary.js";

export const generateSocketId = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const client = await db().connect();

  try {
    const query = findUserEmailQuery;
    const result = await client.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const socketId = socketService._io.engine.generateId();

    const updateQuery = updateUserDataQuery;
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
};

export const messageController = async (req, res) => {
  const client = await db().connect();
  try {
    const result = await client.query(getMessagesQuery);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send("Server error");
  }
};

export const userStatusController = async (req, res) => {
  const client = await db().connect();
  try {
    const result = await client.query(getUserStatusQuery);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send("Server error");
  }
};

export const getFilesDataController = async (req, res) => {
  const client = await db().connect();
  try {
    const result = await client.query(getFileDataQuery);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send("Server error");
  }
};

export const fileUpload = async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "File not uploaded" });
  }

  const localFilePath = file.path;

  console.log("localFilePath is: ", localFilePath);

  try {
    const cloudinaryResult = await uploadOnCloudinary(localFilePath);

    if (!cloudinaryResult) {
      return res
        .status(500)
        .json({ message: "Failed to upload file to Cloudinary" });
    }

    return res.status(200).json({ filePath: cloudinaryResult.secure_url });
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
