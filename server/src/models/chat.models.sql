CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  receiver_id INTEGER NOT NULL REFERENCES account_customuser(id),
  sender_id INTEGER NOT NULL REFERENCES account_customuser(id),
  message TEXT,
  file TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
