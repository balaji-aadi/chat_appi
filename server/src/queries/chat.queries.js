export const findUserEmailQuery =
  "SELECT * FROM account_customuser WHERE email = $1";

export const updateUserDataQuery =
  "UPDATE account_customuser SET socket_id = $1 WHERE email = $2";

export const getMessagesQuery =
  "SELECT * FROM messages ORDER BY created_at ASC";

export const getUserStatusQuery = "SELECT * FROM status";

export const getFileDataQuery = "SELECT * FROM files ORDER BY created_at ASC";

export const updateStatusConnectionQuery = `
            INSERT INTO status (user_id, is_active) VALUES ($1, $2)
            ON CONFLICT (user_id) 
            DO UPDATE SET is_active = EXCLUDED.is_active;
          `;

export const updateStatusDisconnectQuery =
  "UPDATE status SET is_active = $1 WHERE user_id = $2";

export const messageInsertQuery =
  "INSERT INTO messages (sender_id, receiver_id, message) VALUES ($1, $2, $3)";

export const fileInsertQuery =
  "INSERT INTO files (senderId, receiverId, file) VALUES ($1, $2, $3)";
