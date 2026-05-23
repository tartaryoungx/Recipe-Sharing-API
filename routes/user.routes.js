const express = require("express");
const jwt = require("jsonwebtoken");
const { getConn } = require("../db");

const router = express.Router();

const secret = process.env.JWT_SECRET;
const emailroot = process.env.ADMIN_EMAIL;

router.get("/", async (req, res) => {
  try {
    const conn = getConn();

    const authHeader = req.headers["authorization"];
    const authToken = authHeader?.split(" ")[1];

    if (!authToken) {
      return res.status(401).json({ message: "No token" });
    }

    const user = jwt.verify(authToken, secret);

    if (user.email !== emailroot) {
      return res.status(403).json({ message: "Access Denied" });
    }

    const [checkResults] = await conn.query(
      "SELECT * FROM users WHERE email = ?",
      [user.email]
    );

    if (!checkResults[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    const [result] = await conn.query("SELECT email FROM users");

    res.json({
      users: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed",
      error: error.message,
    });
  }
});

module.exports = router;