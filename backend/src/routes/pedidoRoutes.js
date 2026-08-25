const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const pedidoController = require("../controllers/pedidoController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", pedidoController.listar);
router.get("/:id", pedidoController.detalhe);
router.post("/:id/cancelar", pedidoController.cancelar);
router.put("/:id/rastreio", pedidoController.atualizarRastreio);
router.post("/:id/avancar-status", pedidoController.avancarStatus);
router.post("/:id/marcar-recebido", pedidoController.marcarComoRecebido);
router.post("/:id/abonar-frete", pedidoController.abonarFrete);

module.exports = router;
