const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const produtoController = require("../controllers/produtoController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", produtoController.criar);
router.get("/", produtoController.listar);
router.get("/:id", produtoController.detalhe);
router.put("/:id", produtoController.editar);
router.delete("/:id", produtoController.remover);

router.put("/:id/receita", produtoController.substituirReceita);

module.exports = router;
