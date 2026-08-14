const express = require("express");
const webhookController = require("../controllers/webhookController");

const router = express.Router();

router.post("/mercadopago", webhookController.mercadoPago);
router.post("/seurastreio", webhookController.seuRastreio);

module.exports = router;
