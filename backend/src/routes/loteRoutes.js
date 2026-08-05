const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const loteController = require("../controllers/loteController");

const router = express.Router();
router.use(authMiddleware);

router.post("/", loteController.criar);
router.get("/", loteController.listar);

module.exports = router;
