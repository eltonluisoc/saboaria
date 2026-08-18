const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const relatorioController = require("../controllers/relatorioController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", relatorioController.vendasDespesas);
router.get("/produtos-mais-vendidos", relatorioController.produtosMaisVendidos);
router.get("/alertas", relatorioController.alertas);

module.exports = router;
