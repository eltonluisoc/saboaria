-- AlterTable
ALTER TABLE "despesas_gerais" ADD COLUMN     "data_pagamento" TIMESTAMP(3),
ADD COLUMN     "pago" BOOLEAN NOT NULL DEFAULT false;
