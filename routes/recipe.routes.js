const express = require('express')
const router = express.Router()
const { getConn } = require("../db");
const authMiddleware = require("../middlewares/auth");
const { v4: uuidv4 } = require("uuid");


router.post('/recipes', authMiddleware, async (req, res, next) => {
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
        next(error);
    }

})

router.get('/recipes', authMiddleware, async (req, res, next) => {
    try {
        const conn = getConn()
        const [result] = await conn.query("SELECT id,name FROM recipes");
        res.json({
            recipes: result,
        });

    } catch (error) {
        next(error);
    }

})

router.get('/recipes/:id', authMiddleware, async (req, res, next) => {
    try {
        const conn = getConn()
        const id = req.params.id
        const [result] = await conn.query("SELECT name FROM recipes WHERE id = ? AND user_id = ?", [id, req.user.id]);
         if (result.length === 0) {
            return res.status(404).json({
                message: "Recipe not found"
            });
        }

        res.json({
            recipe: result[0],
        });
        
    } catch (error) {
        next(error);
    }
})

router.put('/recipes/:id', authMiddleware, async (req, res, next) => {
    try {
        const conn = getConn()
        const id = req.params.id
        const { name } = req.body

        const [result] = await conn.query(
            "UPDATE recipes SET name = ? WHERE id = ? AND user_id = ?",
            [name, id, req.user.id]
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Recipe not found"
            })
        }

        res.json({
            message: "Recipe updated"
        })
    } catch (error) {
        next(error);
    }
})

router.delete('/recipes/:id', authMiddleware, async (req, res, next) => {
    try {
        const conn = getConn()

        const id = req.params.id

        const [result] = await conn.query(
            "DELETE FROM recipes WHERE id = ? AND user_id = ?",
            [id, req.user.id]
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Recipe not found"
            })
        }

        res.json({
            message: "Recipe deleted"
        })
        
    } catch (error) {
        next(error);
    }
})

module.exports = router