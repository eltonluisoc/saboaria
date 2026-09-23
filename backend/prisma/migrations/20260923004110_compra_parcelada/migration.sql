-- AlterTable
ALTER TABLE "despesas_gerais" ADD COLUMN     "compra_parcelada_id" INTEGER,
ADD COLUMN     "forma_pagamento" TEXT,
ADD COLUMN     "numero_parcela" INTEGER;

-- CreateTable
CREATE TABLE "compras_parceladas" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor_total" DECIMAL(12,2) NOT NULL,
    "total_parcelas" INTEGER NOT NULL,
    "forma_pagamento" TEXT,
    "categoria" TEXT,
    "data_compra" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compras_parceladas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "despesas_gerais" ADD CONSTRAINT "despesas_gerais_compra_parcelada_id_fkey" FOREIGN KEY ("compra_parcelada_id") REFERENCES "compras_parceladas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
