const express = require('express')
const router = express.Router()
const { getConn } = require("../db");
const authMiddleware = require("../middlewares/auth");
const { v4: uuidv4 } = require("uuid");


router.post('/recipes', authMiddleware, async (req, res) => {
    try {
        const conn = getConn()
        const user_id = req.user.id;
        const {
            name,
            description,
            instruction,
            meal_type,
            cuisine_type,
            difficulty,
        } = req.body;

        const userData = {
            id: uuidv4(),
            name,
            description,
            instruction,
            meal_type,
            cuisine_type,
            difficulty,
            user_id
        }

        const [results] = await conn.query("INSERT INTO recipes SET ?", userData);
        res.status(201).json({
            message: "Successful",
            results,
        });


    } catch (error) {
        res.status(500).json({
            message: "Can not add recipe",
            error
        })
    }

})

router.get('/recipes', async (req, res) => {

})

router.get('/recipes/:id', async (req, res) => {

})

router.put('/recipes/:id', async (req, res) => {

})

router.delete('/recipes/:id', async (req, res) => {

})

module.exports = router