
//register & login
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { getConn } = require("../db");

const router = express.Router();

const secret = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
  try {
    const conn = getConn();

    const { email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const userData = {
      id: uuidv4(),
      email,
      password: passwordHash,
    };

    const [results] = await conn.query("INSERT INTO users SET ?", userData);

    res.status(201).json({
      message: "Successful",
      results,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed",
      error: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const conn = getConn();

    const { email, password } = req.body;
    const [result] = await conn.query("SELECT * FROM users WHERE email = ?", [email]);

    const user = result[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, email }, secret, { expiresIn: "1h" });

    res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed",
      error: error.message,
    });
  }
});

module.exports = router;