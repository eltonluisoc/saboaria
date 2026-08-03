const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const pedidoController = require("../controllers/pedidoController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", pedidoController.listar);
router.get("/:id", pedidoController.detalhe);

module.exports = router;
