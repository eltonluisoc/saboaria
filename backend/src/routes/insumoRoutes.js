const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const insumoController = require("../controllers/insumoController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", insumoController.criar);
router.get("/", insumoController.listar);
router.get("/:id", insumoController.detalhe);
router.put("/:id", insumoController.editar);
router.delete("/:id", insumoController.remover);

router.post("/:id/compras", insumoController.registrarCompra);
router.get("/:id/compras", insumoController.listarCompras);
router.put("/:id/compras/:compraId", insumoController.editarCompra);
router.delete("/:id/compras/:compraId", insumoController.removerCompra);

module.exports = router;
