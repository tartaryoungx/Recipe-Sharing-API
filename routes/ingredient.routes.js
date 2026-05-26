const express = require('express')
const router = express.Router()
const { getConn } = require("../db");
const authMiddleware = require("../middlewares/auth");
const { v4: uuidv4 } = require("uuid");

router.post('/', authMiddleware, async (req, res, next) => {
    const conn = getConn()
    
})

module.exports = router