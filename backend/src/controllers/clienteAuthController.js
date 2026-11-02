const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { jwtSecret } = require("../config/env");
const { cookieOptions: baseCookieOptions } = require("../utils/cookieOptions");

const TOKEN_COOKIE = "cliente_token";
const TOKEN_TTL = "30d";
const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return baseCookieOptions(TOKEN_MAX_AGE_MS);
}

function emitirToken(res, cliente) {
  const token = jwt.sign({ sub: cliente.id, email: cliente.email }, jwtSecret, { expiresIn: TOKEN_TTL });
  res.cookie(TOKEN_COOKIE, token, cookieOptions());
}

function semSenha(cliente) {
  const { senhaHash, ...resto } = cliente;
  return resto;
}

async function cadastro(req, res) {
  const { nome, email, senha, telefone, aceitaMarketing } = req.body || {};

  if (typeof nome !== "string" || !nome.trim()) {
    return res.status(400).json({ error: "Campo 'nome' e obrigatorio" });
  }
  if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ error: "Campo 'email' e obrigatorio" });
  }
  if (typeof senha !== "string" || senha.length < 6) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres" });
  }
  if (telefone !== undefined && telefone !== null && typeof telefone !== "string") {
    return res.status(400).json({ error: "Campo 'telefone' deve ser texto" });
  }
  if (aceitaMarketing !== undefined && typeof aceitaMarketing !== "boolean") {
    return res.status(400).json({ error: "Campo 'aceitaMarketing' deve ser booleano" });
  }

  const emailNormalizado = email.trim().toLowerCase();
  const senhaHash = await bcrypt.hash(senha, 10);

  const existente = await prisma.cliente.findUnique({ where: { email: emailNormalizado } });
  if (existente && existente.senhaHash) {
    return res.status(409).json({ error: "Já existe uma conta com esse email - faça login" });
  }

  const cliente = existente
    ? await prisma.cliente.update({
        where: { id: existente.id },
        data: {
          nome: nome.trim(),
          senhaHash,
          telefone: telefone ? telefone.trim() : existente.telefone,
          aceitaMarketing: aceitaMarketing === undefined ? existente.aceitaMarketing : aceitaMarketing,
        },
      })
    : await prisma.cliente.create({
        data: {
          nome: nome.trim(),
          email: emailNormalizado,
          senhaHash,
          telefone: telefone ? telefone.trim() : null,
          aceitaMarketing: aceitaMarketing === undefined ? false : aceitaMarketing,
        },
      });

  emitirToken(res, cliente);
  return res.status(201).json({ cliente: semSenha(cliente) });
}

async function login(req, res) {
  const { email, senha } = req.body || {};
  if (!email || !senha) {
    return res.status(400).json({ error: "Email e senha sao obrigatorios" });
  }

  const emailNormalizado = String(email).trim().toLowerCase();
  const cliente = await prisma.cliente.findUnique({ where: { email: emailNormalizado } });

  if (!cliente || !cliente.senhaHash) {
    return res.status(401).json({
      error: cliente
        ? "Essa conta ainda não tem senha - cadastre-se pra criar uma"
        : "Credenciais inválidas",
    });
  }

  const senhaValida = await bcrypt.compare(senha, cliente.senhaHash);
  if (!senhaValida) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  emitirToken(res, cliente);
  return res.json({ cliente: semSenha(cliente) });
}

function logout(req, res) {
  res.clearCookie(TOKEN_COOKIE, cookieOptions());
  return res.json({ message: "Logout realizado com sucesso" });
}

async function me(req, res) {
  const cliente = await prisma.cliente.findUnique({ where: { id: req.cliente.id } });
  if (!cliente) {
    return res.status(401).json({ error: "Nao autenticado" });
  }
  return res.json({ cliente: semSenha(cliente) });
}

module.exports = { cadastro, login, logout, me, TOKEN_COOKIE };
