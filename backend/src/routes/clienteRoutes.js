const express = require("express");
const rateLimit = require("express-rate-limit");
const { cadastro, login, logout, me } = require("../controllers/clienteAuthController");
const clienteAuthMiddleware = require("../middleware/clienteAuthMiddleware");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Muitas tentativas. Tente novamente mais tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/cadastro", authLimiter, cadastro);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", clienteAuthMiddleware, me);

module.exports = router;
