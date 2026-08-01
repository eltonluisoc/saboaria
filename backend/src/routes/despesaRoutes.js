const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const despesaController = require("../controllers/despesaController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", despesaController.criar);
router.get("/", despesaController.listar);
router.get("/:id", despesaController.detalhe);
router.put("/:id", despesaController.editar);
router.delete("/:id", despesaController.remover);

module.exports = router;
