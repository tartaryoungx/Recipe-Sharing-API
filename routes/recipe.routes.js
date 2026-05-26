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
            ingredients = []
        } = req.body;

        const recipeData = {
            id: uuidv4(),
            name,
            description,
            instruction,
            meal_type,
            cuisine_type,
            difficulty,
            user_id
        }

        const [results] = await conn.query("INSERT INTO recipes SET ?", recipeData);

        let ingredientId

        for (const item of ingredients) {
            const [existingIngredients] = await conn.query(
                'SELECT id from ingredients where name = ?', 
                [item.name]
            );
        if(existingIngredients.length === 0) {
            ingredientId  = uuidv4();

            const ingredientData = {
                id: ingredientId,
                name: item.name,
                category: item.category,
                created_by_user_id: user_id
            }

            await conn.query("INSERT INTO ingredients SET ?", ingredientData);

            const recipeIngredientData = {
                recipe_id: recipeData.id,
                ingredient_id: ingredientId,
                quantity: item.quantity,
                unit: item.unit
            };
            await conn.query("INSERT INTO recipe_ingredients SET ?", recipeIngredientData);
        } else {
             const recipeIngredientData = {
                recipe_id: recipeData.id,
                ingredient_id: existingIngredients[0].id,
                quantity: item.quantity,
                unit: item.unit
            };
            await conn.query("INSERT INTO recipe_ingredients SET ?", recipeIngredientData);

        }

    }
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
        const user_id = req.user.id;
        const conn = getConn()
        const [result] = await conn.query(`
            SELECT
                r.id,
                r.name,
                GROUP_CONCAT(i.name) AS ingredients
            FROM recipes r
            LEFT JOIN recipe_ingredients ri
                ON r.id = ri.recipe_id
            LEFT JOIN ingredients  i
                ON i.id = ri.ingredient_id
            GROUP BY r.id, r.name
            WHERE r.user_id = ?
        `, [user_id]);
        res.json({
            recipes: result,
        });

    } catch (error) {
        next(error);
    }

})

router.get('/recipes/:id', authMiddleware, async (req, res, next) => {
    try {
        const user_id = req.user.id;
        const conn = getConn()
        const id = req.params.id
        const [result] = await conn.query(`
            SELECT 
            r.id,
            r.name,
            GROUP_CONCAT(i.name) AS ingredients
            FROM recipes r
            LEFT JOIN recipe_ingredients ri
                ON r.id = ri.recipe_id
            LEFT JOIN ingredients i
                ON i.id = ri.ingredient_id
            WHERE r.id = ? 
            AND user_id = ?
             GROUP BY r.id, r.name
             `, [id, user_id]);

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