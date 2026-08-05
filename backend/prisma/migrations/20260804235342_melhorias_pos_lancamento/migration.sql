-- AlterTable
ALTER TABLE "despesas_gerais" ADD COLUMN     "data_fim_recorrencia" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "insumos" ADD COLUMN     "estoque_atual" DECIMAL(12,4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "estoque_atual" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "lotes_producao" (
    "id" SERIAL NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "quantidade_produzida" INTEGER NOT NULL,
    "data_producao" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lotes_producao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lotes_producao" ADD CONSTRAINT "lotes_producao_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
