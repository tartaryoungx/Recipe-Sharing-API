const mysql = require("mysql2/promise");

let conn = null;

const initMySQL = async () => {
  conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log("MySQL Connected");
};

const getConn = () => conn;

module.exports = {
  initMySQL,
  getConn,
};