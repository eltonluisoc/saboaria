const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

function clienteAuthMiddleware(req, res, next) {
  const token = req.cookies?.cliente_token;

  if (!token) {
    return res.status(401).json({ error: "Nao autenticado" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.cliente = { id: payload.sub, email: payload.email };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalido ou expirado" });
  }
}

module.exports = clienteAuthMiddleware;
