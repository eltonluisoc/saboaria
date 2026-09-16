-- AlterTable
ALTER TABLE "despesas_gerais" ADD COLUMN     "pro_labore_id" INTEGER;

-- CreateTable
CREATE TABLE "pro_labore" (
    "id" SERIAL NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "dia_pagamento" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pro_labore_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "despesas_gerais" ADD CONSTRAINT "despesas_gerais_pro_labore_id_fkey" FOREIGN KEY ("pro_labore_id") REFERENCES "pro_labore"("id") ON DELETE SET NULL ON UPDATE CASCADE;
