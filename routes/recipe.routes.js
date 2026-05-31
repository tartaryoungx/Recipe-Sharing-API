const express = require("express");
const router = express.Router();
const { getConn } = require("../db");
const authMiddleware = require("../middlewares/auth");
const { v4: uuidv4 } = require("uuid");

async function attachIngredients(conn, recipeId, ingredients, userId) {
  for (const item of ingredients) {
    const [existingIngredients] = await conn.query(
      "SELECT id FROM ingredients WHERE name = ?",
      [item.name],
    );

    let ingredientId;

    if (existingIngredients.length === 0) {
      ingredientId = uuidv4();

      const ingredientData = {
        id: ingredientId,
        name: item.name,
        category: item.category,
        created_by_user_id: userId,
      };

      await conn.query("INSERT INTO ingredients SET ?", ingredientData);
    } else {
      ingredientId = existingIngredients[0].id;
    }

    const recipeIngredientData = {
      recipe_id: recipeId,
      ingredient_id: ingredientId,
      quantity: item.quantity,
      unit: item.unit,
    };

    await conn.query(
      "INSERT INTO recipe_ingredients SET ?",
      recipeIngredientData,
    );
  }
}

async function attachTags(conn, recipeId, tags) {
  for (const tag of tags) {
    const [existingTag] = await conn.query(
      `
                SELECT id from tags 
                where name = ?
                `,
      [tag.name],
    );
    let tagId;

    if (existingTag.length === 0) {
      tagId = uuidv4();
      const tagData = {
        id: tagId,
        name: tag.name,
        slug: tag.slug,
        type: tag.type,
      };
      await conn.query("INSERT INTO tags SET ?", tagData);
    } else {
      tagId = existingTag[0].id;
    }

    await conn.query(
      `
                INSERT INTO recipe_tags
                (recipe_id, tag_id)
                VALUES (?, ?)
                `,
      [recipeId, tagId],
    );
  }
}

router.post("/", authMiddleware, async (req, res, next) => {
  let conn;
  try {
    conn = getConn();
    await conn.beginTransaction();
    const user_id = req.user.id;
    const {
      name,
      description,
      instruction,
      difficulty,
      ingredients = [],
      tags = [],
    } = req.body;

    const recipeData = {
      id: uuidv4(),
      name,
      description,
      instruction,
      difficulty,
      user_id,
    };

    const [results] = await conn.query("INSERT INTO recipes SET ?", recipeData);

    await attachIngredients(conn, recipeData.id, ingredients, user_id);
    await attachTags(conn, recipeData.id, tags);

    await conn.commit();
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
});

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const conn = getConn();
    const [recipes] = await conn.query(
      `
            SELECT
                r.id,
                r.name
            FROM recipes r
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        `,
      [user_id],
    );

    for (const recipe of recipes) {
      const [ingredients] = await conn.query(
        `
          SELECT
            i.id,
            i.name,
            i.category,
            ri.quantity,
            ri.unit
          FROM recipe_ingredients ri
          JOIN ingredients i
          ON i.id = ri.ingredient_id
          WHERE ri.recipe_id = ?
        `,
        [recipe.id],
      );
       const [tags] = await conn.query(`
        SELECT
          t.id,
          t.name,
          t.slug,
          t.type
        FROM recipe_tags rt
        JOIN tags t
          ON t.id = rt.tag_id
        WHERE rt.recipe_id = ?
      `, [recipe.id]);

      recipe.ingredients = ingredients;
      recipe.tags = tags;
    }
    res.json({
      recipes,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/favorite", authMiddleware, async (req, res, next) => {
  try {
    const conn = getConn();
    const user_id = req.user.id;
    const [results] = await conn.query(
      `
        SELECT r.id,
        r.name 
        FROM recipes r
        join fav_recipes f
        on r.id = f.recipe_id
        join users u
        on u.id = f.user_id
        WHERE u.id = ?
        `,
      [user_id],
    );

    res.status(200).json({
      results,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/search", authMiddleware, async (req, res, next) => {
  try {
    const keyword = req.query.keyword;
    const conn = getConn();
    const [result] = await conn.query(
      `
                SELECT * from recipes
                where name like ?
                `,
      [`%${keyword}%`],
    );

    res.json({
      result,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const conn = getConn();
    const id = req.params.id;
    const [result] = await conn.query(
      `
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
             `,
      [id, user_id],
    );

    if (result.length === 0) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    res.json({
      recipe: result[0],
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authMiddleware, async (req, res, next) => {
  try {
    const conn = getConn();
    const id = req.params.id;
    const { name } = req.body;

    const [result] = await conn.query(
      "UPDATE recipes SET name = ? WHERE id = ? AND user_id = ?",
      [name, id, req.user.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    res.json({
      message: "Recipe updated",
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const conn = getConn();

    const id = req.params.id;

    const [result] = await conn.query(
      "DELETE FROM recipes WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    res.json({
      message: "Recipe deleted",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/favorite", authMiddleware, async (req, res, next) => {
  try {
    const conn = getConn();
    const user_id = req.user.id;
    const recipe_id = req.params.id;

    const favdata = {
      recipe_id,
      user_id,
    };

    const [recipeCheck] = await conn.query(
      `
            SELECT id 
            FROM recipes
            WHERE id = ?
            `,
      [recipe_id],
    );
    if (recipeCheck.length === 0) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    const [results] = await conn.query(
      `
        INSERT INTO fav_recipes SET ?
        `,
      favdata,
    );

    res.status(201).json({
      message: "Successful",
      results,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/favorite", authMiddleware, async (req, res, next) => {
  try {
    const conn = getConn();
    const user_id = req.user.id;
    const recipe_id = req.params.id;
    const [result] = await conn.query(
      `
        DELETE FROM fav_recipes 
        WHERE user_id = ? AND
        recipe_id = ?
        `,
      [user_id, recipe_id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }
    res.status(200).json({
      message: "Recipe deleted",
      result,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/rating", authMiddleware, async (req, res, next) => {
  try {
    const conn = getConn();
    const user_id = req.user.id;
    const { rating } = req.body;
    const recipe_id = req.params.id;
    const data = {
      recipe_id,
      user_id,
      rating,
    };
    if (rating === undefined) {
      return res.status(400).json({
        message: "rating is required",
      });
    }
    if (typeof rating !== "number") {
      return res.status(400).json({
        message: "rating must be a number",
      });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "rating must be between 1 and 5",
      });
    }
    const [result] = await conn.query(
      `
      INSERT INTO rates SET ?
      `,
      data,
    );
    res.status(201).json({
      message: "add rating success",
      result,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "you already rated this recipe",
      });
    }
    next(error);
  }
});

router.get("/:id/rating", async (req, res, next) => {
  try {
    const conn = getConn();
    const recipe_id = req.params.id;

    const [results] = await conn.query(
      `
      SELECT 
        COUNT(*) as total_rating,
        AVG(rating) as avg_rating
      FROM rates
      WHERE recipe_id = ?
    `,
      [recipe_id],
    );

    res.status(200).json({
      rating: results[0],
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/comment", authMiddleware, async (req, res, next) => {
  try {
    const conn = getConn();
    const user_id = req.user.id;
    const { content } = req.body;
    const recipe_id = req.params.id;
    const id = uuidv4();
    const data = {
      id,
      recipe_id,
      user_id,
      content,
    };
    if (!content?.trim()) {
      return res.status(400).json({
        message: "Content is required",
      });
    }
    const [result] = await conn.query(
      `
      INSERT INTO comments SET ?
      `,
      data,
    );
    res.status(201).json({
      message: "add comment success",
      result,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/comments", async (req, res, next) => {
  try {
    const conn = getConn();
    const recipe_id = req.params.id;

    const [results] = await conn.query(
      `
      SELECT 
        c.id,
        c.content,
        c.created_at,
        u.id as user_id,
        u.username
      FROM comments c
      JOIN users u
      ON c.user_id = u.id
      WHERE c.recipe_id = ?
      ORDER BY c.created_at DESC
    `,
      [recipe_id],
    );

    res.status(200).json({
      comments: results,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/share", authMiddleware, async (req, res, next) => {
  try {
    const conn = getConn();

    const recipe_id = req.params.id;
    const sender_user_id = req.user.id;

    const { platform, target, message } = req.body;

    const share_id = require("uuid").v4();

    await conn.query("INSERT INTO shares SET ?", {
      id: share_id,
      recipe_id,
      sender_user_id,
      platform,
      target,
      message: message || null,
    });

    res.status(201).json({
      message: "shared",
      share_id,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
