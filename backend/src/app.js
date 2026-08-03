const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { nodeEnv, frontendUrl, mercadoPagoAccessToken, mercadoPagoWebhookSecret } = require("./config/env");
const authMiddleware = require("./middleware/authMiddleware");
const authRoutes = require("./routes/authRoutes");
const insumoRoutes = require("./routes/insumoRoutes");
const produtoRoutes = require("./routes/produtoRoutes");
const despesaRoutes = require("./routes/despesaRoutes");
const vendaRoutes = require("./routes/vendaRoutes");
const pedidoRoutes = require("./routes/pedidoRoutes");
const relatorioRoutes = require("./routes/relatorioRoutes");
const catalogoRoutes = require("./routes/catalogoRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();

const LOCALHOST_ORIGIN = /^http:\/\/localhost:\d+$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (nodeEnv !== "production" && LOCALHOST_ORIGIN.test(origin)) {
        return callback(null, true);
      }
      if (frontendUrl && origin === frontendUrl) {
        return callback(null, true);
      }
      return callback(new Error("Origem nao permitida pelo CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/admin", authRoutes);
app.use("/api/admin/insumos", insumoRoutes);
app.use("/api/admin/produtos", produtoRoutes);
app.use("/api/admin/despesas", despesaRoutes);
app.use("/api/admin/vendas", vendaRoutes);
app.use("/api/admin/pedidos", pedidoRoutes);
app.use("/api/admin/relatorio", relatorioRoutes);
app.use("/api/produtos", catalogoRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/webhooks", webhookRoutes);

// TEMPORARIO - diagnostico de qual credencial MP o processo esta usando (remover depois)
app.get("/api/admin/_debug/mp-config", authMiddleware, (req, res) => {
  res.json({
    accessTokenTail: mercadoPagoAccessToken ? mercadoPagoAccessToken.slice(-8) : null,
    webhookSecretTail: mercadoPagoWebhookSecret ? mercadoPagoWebhookSecret.slice(-8) : null,
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "JSON invalido no corpo da requisicao" });
  }
  console.error(err);
  return res.status(500).json({ error: "Erro interno do servidor" });
});

module.exports = app;
