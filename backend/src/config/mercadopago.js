const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const { mercadoPagoAccessToken } = require("./env");

let client = null;

function getClient() {
  if (!mercadoPagoAccessToken) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN nao configurado no .env - necessario para pagamentos"
    );
  }
  if (!client) {
    client = new MercadoPagoConfig({ accessToken: mercadoPagoAccessToken });
  }
  return client;
}

module.exports = {
  preference: () => new Preference(getClient()),
  payment: () => new Payment(getClient()),
};
