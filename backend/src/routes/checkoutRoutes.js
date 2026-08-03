const express = require("express");
const checkoutController = require("../controllers/checkoutController");

const router = express.Router();

router.post("/", checkoutController.criar);
router.post("/confirmar", checkoutController.confirmar);

module.exports = router;
