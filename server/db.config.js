import pkg from "pg";
const { Pool } = pkg;

const db = () => {
  const pool = new Pool({
    user: "postgres",
    host: "127.0.0.1",
    database: "practice",
    password: "2580",
    port: 5433,
  });

  pool.connect((err, client, release) => {
    if (err) {
      return console.error("Error acquiring client", err.stack);
    }
    console.log("Connected to PostgreSQL database");
    release(); // Release the client back to the pool
  });

  return pool;
};

export default db;
