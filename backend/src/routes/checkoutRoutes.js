const express = require("express");
const checkoutController = require("../controllers/checkoutController");
const clienteAuthOpcional = require("../middleware/clienteAuthOpcional");

const router = express.Router();

router.post("/", clienteAuthOpcional, checkoutController.criar);
router.post("/confirmar", checkoutController.confirmar);
router.get("/frete", checkoutController.frete);
router.post("/validar-cupom", checkoutController.validarCupom);

module.exports = router;
