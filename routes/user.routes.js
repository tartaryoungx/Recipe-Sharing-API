const express = require("express");
const jwt = require("jsonwebtoken");
const { getConn } = require("../db");
const authMiddleware = require("../middlewares/auth");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

const secret = process.env.JWT_SECRET;
const emailroot = process.env.ADMIN_EMAIL;


router.get("/", authMiddleware, async (req, res) => {
  try {
    const conn = getConn();
    const user = req.user.email

    const [checkResults] = await conn.query(
      "SELECT * FROM users WHERE email = ?",
      [user]
    );

    if (checkResults.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (checkResults[0].role !== "admin") {
      return res.status(403).json({
        message: "forbidden"
      })
    }
    
    const [result] = await conn.query("SELECT email FROM users");
      return res.status(200).json({
      users: result,
    });

    


  } catch (error) {
    res.status(500).json({
      message: "Failed",
      error: error.message,
    });
  }
});


router.get("/profile", authMiddleware, async (req, res, next) => {
  try {
    const conn = getConn();
    const user_id = req.user.id

    const [checkResults] = await conn.query(
      "SELECT * FROM users WHERE id = ?",
      [user_id]
    );

    if (!checkResults[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    const [result] = await conn.query("SELECT * FROM users where id = ?", user_id);

    res.json({
      users: result,
    });
  } catch (error) {
      next(error);
  }
});

router.patch("/profile", authMiddleware, async (req, res, next) => {
  try {
    const conn = getConn();
    const user_id = req.user.id
    const {
      username,
      role
    } = req.body
    const updateData = {}

    if (username !== undefined) {
      if (!username?.trim()) {
        return res.status(400).json({
          message: 'username cannot be empty'
        })
      }
      updateData.username = username.trim()
    }

    if (role !== undefined) {

      if (!role?.trim()) {
        return res.status(400).json({
          message: 'role cannot be empty'
        })
      }

      updateData.role = role.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: 'no fields to update'
      })
    }

    const [result] = await conn.query(`
      UPDATE users
      SET ?
      WHERE id = ?
    `, [updateData, user_id])

    res.status(200).json({
      message: 'update profile success',
      result
    })

  } catch (error) {
      next(error);
  }
});

router.get('/follow', authMiddleware, async (req, res, next) => {
  try {
    const conn = getConn()
    const user_id = req.user.id
    const [result] = await conn.query(`
      SELECT 
        u.id,
        u.username
      FROM users u
      JOIN user_follows f
      ON u.id = f.following_id
      where f.follower_id = ?
      `, [user_id])

    res.status(200).json({
      message : "success",
      result
    })
    
  } catch (error) {
    next(error);
  }
})

router.post('/follow/:id', authMiddleware, async (req, res, next) => {
  try {
    const conn = getConn()
    const follower_id = req.user.id
    const following_id = req.params.id
    const followData = {
      follower_id,
      following_id
    }
    const [result] = await conn.query(`
      INSERT INTO user_follows SET ?
      `, followData)
    res.status(201).json({
      message : "following",
      result
    })
  } catch (error) {
    next(error);
  }
})

router.delete('/follow/:id', authMiddleware, async (req, res, next) => {
  try {
    const conn = getConn()
    const follower_id = req.user.id
    const following_id = req.params.id
    const [result] = await conn.query(`
      DELETE FROM user_follows 
      WHERE follower_id = ?
      AND following_id = ?
      `, [follower_id, following_id])
    res.status(200).json({
      message : "unfollowing complete",
      result
    })
  } catch (error) {
    next(error);
  }
})



module.exports = router;