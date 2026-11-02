const { nodeEnv } = require("../config/env");

// Frontend (Vercel) e backend (Render) sao dominios diferentes em producao -
// isso e "cross-site" pra fins de cookie, entao precisa de SameSite=None
// (que por sua vez exige Secure=true, ja garantido pelo HTTPS em producao).
// Em dev, frontend e backend sao ambos localhost; Lax funciona e evita
// exigir HTTPS local.
function cookieOptions(maxAgeMs) {
  const emProducao = nodeEnv === "production";
  return {
    httpOnly: true,
    sameSite: emProducao ? "none" : "lax",
    secure: emProducao,
    maxAge: maxAgeMs,
  };
}

module.exports = { cookieOptions };
