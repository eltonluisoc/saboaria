const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const cupomController = require("../controllers/cupomController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", cupomController.criar);
router.get("/", cupomController.listar);
router.put("/:id", cupomController.editar);
router.post("/:id/alternar-ativo", cupomController.alternarAtivo);

module.exports = router;
