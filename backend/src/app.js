const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const insumoRoutes = require("./routes/insumoRoutes");
const produtoRoutes = require("./routes/produtoRoutes");
const despesaRoutes = require("./routes/despesaRoutes");
const vendaRoutes = require("./routes/vendaRoutes");
const relatorioRoutes = require("./routes/relatorioRoutes");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/admin", authRoutes);
app.use("/api/admin/insumos", insumoRoutes);
app.use("/api/admin/produtos", produtoRoutes);
app.use("/api/admin/despesas", despesaRoutes);
app.use("/api/admin/vendas", vendaRoutes);
app.use("/api/admin/relatorio", relatorioRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "JSON invalido no corpo da requisicao" });
  }
  console.error(err);
  return res.status(500).json({ error: "Erro interno do servidor" });
});

module.exports = app;
