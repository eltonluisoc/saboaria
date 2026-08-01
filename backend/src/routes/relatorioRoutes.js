const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const relatorioController = require("../controllers/relatorioController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", relatorioController.vendasDespesas);

module.exports = router;
