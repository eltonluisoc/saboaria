const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { nodeEnv, frontendUrls } = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const insumoRoutes = require("./routes/insumoRoutes");
const produtoRoutes = require("./routes/produtoRoutes");
const despesaRoutes = require("./routes/despesaRoutes");
const vendaRoutes = require("./routes/vendaRoutes");
const pedidoRoutes = require("./routes/pedidoRoutes");
const loteRoutes = require("./routes/loteRoutes");
const relatorioRoutes = require("./routes/relatorioRoutes");
const catalogoRoutes = require("./routes/catalogoRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const rastreioPublicoRoutes = require("./routes/rastreioPublicoRoutes");

const app = express();

// Render fica atras de um proxy reverso (o X-Forwarded-For chega com o IP
// real do visitante). Sem isso, o Express nao confia nesse header, e o
// express-rate-limit do login acaba tratando toda requisicao como vinda do
// mesmo IP (o proprio proxy) - juntando o limite de tentativas de todo
// mundo num balde so, em vez de por visitante. "1" = confia exatamente um
// hop de proxy na frente (o edge do Render), nao a cadeia inteira.
if (nodeEnv === "production") {
  app.set("trust proxy", 1);
}

const LOCALHOST_ORIGIN = /^http:\/\/localhost:\d+$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (nodeEnv !== "production" && LOCALHOST_ORIGIN.test(origin)) {
        return callback(null, true);
      }
      if (frontendUrls.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origem nao permitida pelo CORS"));
    },
    credentials: true,
  })
);
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(cookieParser());

app.use("/api/admin", authRoutes);
app.use("/api/admin/insumos", insumoRoutes);
app.use("/api/admin/produtos", produtoRoutes);
app.use("/api/admin/despesas", despesaRoutes);
app.use("/api/admin/vendas", vendaRoutes);
app.use("/api/admin/pedidos", pedidoRoutes);
app.use("/api/admin/lotes", loteRoutes);
app.use("/api/admin/relatorio", relatorioRoutes);
app.use("/api/produtos", catalogoRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/pedidos-publico", rastreioPublicoRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "JSON invalido no corpo da requisicao" });
  }
  console.error(err);
  return res.status(500).json({ error: "Erro interno do servidor" });
});

module.exports = app;
