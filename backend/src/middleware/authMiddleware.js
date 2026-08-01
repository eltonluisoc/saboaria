const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

function authMiddleware(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Nao autenticado" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.admin = { id: payload.sub, email: payload.email };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalido ou expirado" });
  }
}

module.exports = authMiddleware;
