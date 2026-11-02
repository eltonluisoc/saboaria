const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

// Usado no checkout - nunca bloqueia (visitante continua comprando
// normalmente). So preenche req.cliente quando o cookie existe e e valido.
function clienteAuthOpcional(req, res, next) {
  const token = req.cookies?.cliente_token;
  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.cliente = { id: payload.sub, email: payload.email };
  } catch (err) {
    // token invalido/expirado - segue como visitante, sem erro
  }
  return next();
}

module.exports = clienteAuthOpcional;
