const express = require("express");
const dotenv = require("dotenv");
const errorMiddleware = require("./middlewares/error");
const path = require("path");

dotenv.config();

const { initMySQL } = require("./db");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const recipeRoutes = require('./routes/recipe.routes')
const ingredientRoutes = require('./routes/ingredient.routes')

const app = express();
const port = 8000;

app.use(express.json());
app.use(express.static("frontend"));

app.get("/recipes/create", (req, res) => {
  res.sendFile(
    path.join(__dirname, "frontend/recipes/create.html")
  );
});

app.get("/auth/signin", (req, res) => {
  res.sendFile(
    path.join(__dirname, "frontend/auth/signin.html")
  );
});

app.get("/auth/signup", (req, res) => {
  res.sendFile(
    path.join(__dirname, "frontend/auth/signup.html")
  );
});

app.get("/admin/dashboard", (req, res) => {
  res.sendFile(
    path.join(__dirname, "frontend/admin/dashboard.html")
  );
});

app.get("/recipes/:slug", (req, res) => {

  const slug = req.params.slug;

  res.sendFile(
    path.join(
      __dirname,
      "frontend",
      "recipes",
      "detail.html"
    )
  );
});

app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use('/api/recipes', recipeRoutes)
app.use('/api/ingredients', ingredientRoutes)
app.use(errorMiddleware);

app.listen(port, async () => {
  await initMySQL();
  console.log(`Server started on port ${port}`);
  console.log('Database started on: http://localhost:8080')
});

