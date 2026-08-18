-- AlterTable
ALTER TABLE "despesas_gerais" ADD COLUMN     "data_vencimento" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "insumos" ADD COLUMN     "estoque_minimo" DECIMAL(12,4);
