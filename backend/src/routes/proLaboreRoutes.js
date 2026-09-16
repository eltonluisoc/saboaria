const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const proLaboreController = require("../controllers/proLaboreController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", proLaboreController.obter);
router.post("/", proLaboreController.criar);
router.put("/", proLaboreController.atualizar);

module.exports = router;
