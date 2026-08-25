-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "frete_abonado_motivo" TEXT,
ADD COLUMN     "nome_comprador" TEXT;

-- AlterTable
ALTER TABLE "despesas_gerais" ADD COLUMN     "compra_insumo_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "despesas_gerais_compra_insumo_id_key" ON "despesas_gerais"("compra_insumo_id");

-- AddForeignKey
ALTER TABLE "despesas_gerais" ADD CONSTRAINT "despesas_gerais_compra_insumo_id_fkey" FOREIGN KEY ("compra_insumo_id") REFERENCES "compras_insumo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
