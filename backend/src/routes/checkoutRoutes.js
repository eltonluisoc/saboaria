const express = require("express");
const checkoutController = require("../controllers/checkoutController");

const router = express.Router();

router.post("/", checkoutController.criar);
router.post("/confirmar", checkoutController.confirmar);
router.get("/:id/status", checkoutController.statusPedido);

module.exports = router;
