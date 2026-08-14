const express = require("express");
const rastreioPublicoController = require("../controllers/rastreioPublicoController");

const router = express.Router();

router.get("/:codigoAcesso", rastreioPublicoController.detalhe);

module.exports = router;
