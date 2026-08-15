require("dotenv").config();

const required = ["DATABASE_URL", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${key}`);
  }
}

const port = process.env.PORT || 3333;

// FRONTEND_URL aceita uma ou mais origens separadas por virgula (ex: o
// dominio proprio + o dominio *.vercel.app que o Vercel sempre mantem
// ativo por baixo) - precisa listar todas que devem passar no CORS.
const frontendUrls = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

module.exports = {
  port,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: frontendUrls[0],
  frontendUrls,
  backendUrl: process.env.BACKEND_URL || `http://localhost:${port}`,
  mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || null,
  mercadoPagoWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || null,
  resendApiKey: process.env.RESEND_API_KEY || null,
  emailFrom: process.env.EMAIL_FROM || null,
  seuRastreioApiKey: process.env.SEURASTREIO_API_KEY || null,
  seuRastreioWebhookSecret: process.env.SEURASTREIO_WEBHOOK_SECRET || null,
};
