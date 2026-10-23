const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const iaController = require("../controllers/iaController");

const router = express.Router();

router.use(authMiddleware);

router.post("/interpretar-venda", iaController.interpretarVenda);

module.exports = router;
