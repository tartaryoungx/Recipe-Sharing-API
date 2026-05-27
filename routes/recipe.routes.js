const express = require('express')
const router = express.Router()
const { getConn } = require("../db");
const authMiddleware = require("../middlewares/auth");
const { v4: uuidv4 } = require("uuid");


router.post('/recipes', authMiddleware, async (req, res, next) => {
    let conn;
    try {
        conn = getConn()
        await conn.beginTransaction()
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

        for (const item of ingredients) {
            const [existingIngredients] = await conn.query(
                'SELECT id from ingredients where name = ?', 
                [item.name]
            );
        let ingredientId

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

    }   await conn.commit()
        res.status(201).json({
            message: "Successful",
            results,
        });
        
    } catch (error) {
        if (conn) {
            await conn.rollback();
        }
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
            WHERE r.user_id = ?
            GROUP BY r.id, r.name
        `, [user_id]);
        res.json({
            recipes: result,
        });

    } catch (error) {
        next(error);
    }

})


router.get('/recipes/favorite', authMiddleware, async (req, res, next) => {
    try {
        const conn = getConn()
        const user_id = req.user.id;
        const [results] = await conn.query(`
        SELECT r.id,
        r.name 
        FROM recipes r
        join fav_recipes f
        on r.id = f.recipe_id
        join users u
        on u.id = f.user_id
        WHERE u.id = ?
        `, [user_id]);

        res.status(200).json({
            results,
        });
    } catch (error) {
        next(error);
    }

})


router.get('/recipes/search', authMiddleware, async (req, res, next) => {
    try {
            const keyword = req.query.keyword
            const conn = getConn()
            const [result] = await conn.query(`
                SELECT * from recipes
                where name like ?
                `, [`%${keyword}%`])

            res.json({
                result
            })
        } catch (error) {
            next(error)
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

router.post('/recipes/:id/favorite', authMiddleware, async (req, res, next) => {
    try {
        const conn = getConn()
        const user_id = req.user.id;
        const recipe_id = req.params.id;

        const favdata = {
            recipe_id, 
            user_id
        }

        const [recipeCheck] = await conn.query(`
            SELECT id 
            FROM recipes
            WHERE id = ?
            `, [recipe_id]
        );
        if (recipeCheck.length === 0) {
            return res.status(404).json({
            message: "Recipe not found"
        });
        }

        
        const [results] = await conn.query(`
        INSERT INTO fav_recipes SET ?
        `, favdata
        );

        res.status(201).json({
            message: "Successful",
            results,
        });

    } catch (error) {
        next(error);
    }

})

router.delete('/recipes/:id/favorite', authMiddleware, async (req, res, next) => {
    try {
        const conn = getConn()
        const user_id = req.user.id;
        const recipe_id = req.params.id;
        const [result] = await conn.query(`
        DELETE FROM fav_recipes 
        WHERE user_id = ? AND
        recipe_id = ?
        `, [user_id, recipe_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Recipe not found"
            })
        }
        res.status(200).json({
            message: "Recipe deleted",
            result,
        });
    } catch (error) {
        next(error);
    }

})



module.exports = router