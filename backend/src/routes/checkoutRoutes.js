const express = require("express");
const checkoutController = require("../controllers/checkoutController");

const router = express.Router();

router.post("/", checkoutController.criar);
router.post("/confirmar", checkoutController.confirmar);
router.get("/frete", checkoutController.frete);

module.exports = router;
