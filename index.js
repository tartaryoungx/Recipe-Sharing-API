const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const { initMySQL } = require("./db");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const recipeRoutes = require('./routes/recipe.routes')

const app = express();
const port = 8000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use('/api', recipeRoutes)

app.listen(port, async () => {
  await initMySQL();
  console.log(`Server started on port ${port}`);
  console.log('Database started on: http://localhost:8080')
});

