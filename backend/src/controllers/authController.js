const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { jwtSecret, nodeEnv } = require("../config/env");

const TOKEN_COOKIE = "token";
const TOKEN_TTL = "8h";
const TOKEN_MAX_AGE_MS = 8 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: nodeEnv === "production",
    maxAge: TOKEN_MAX_AGE_MS,
  };
}

async function login(req, res) {
  const { email, senha } = req.body || {};

  if (!email || !senha) {
    return res.status(400).json({ error: "Email e senha sao obrigatorios" });
  }

  const admin = await prisma.adminUsuario.findUnique({ where: { email } });

  const senhaValida = admin
    ? await bcrypt.compare(senha, admin.senhaHash)
    : false;

  if (!admin || !senhaValida) {
    return res.status(401).json({ error: "Credenciais invalidas" });
  }

  const token = jwt.sign({ sub: admin.id, email: admin.email }, jwtSecret, {
    expiresIn: TOKEN_TTL,
  });

  res.cookie(TOKEN_COOKIE, token, cookieOptions());
  return res.json({ message: "Login realizado com sucesso" });
}

function logout(req, res) {
  res.clearCookie(TOKEN_COOKIE, cookieOptions());
  return res.json({ message: "Logout realizado com sucesso" });
}

function me(req, res) {
  return res.json({ admin: req.admin });
}

module.exports = { login, logout, me };
