//middleware

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const user = jwt.verify(token, process.env.JWT_SECRET);

    req.user = user;

    next();
  } catch (error) {
    next(error)
  }
};

module.exports = authMiddleware;