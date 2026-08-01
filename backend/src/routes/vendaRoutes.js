const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const vendaController = require("../controllers/vendaController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", vendaController.criar);
router.get("/", vendaController.listar);
router.get("/:id", vendaController.detalhe);

module.exports = router;
