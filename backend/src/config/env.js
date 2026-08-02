require("dotenv").config();

const required = ["DATABASE_URL", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${key}`);
  }
}

const port = process.env.PORT || 3333;

module.exports = {
  port,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  backendUrl: process.env.BACKEND_URL || `http://localhost:${port}`,
  mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || null,
  mercadoPagoWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || null,
};
