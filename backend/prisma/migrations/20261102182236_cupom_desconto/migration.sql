-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "cupom_id" INTEGER;

-- CreateTable
CREATE TABLE "cupons" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "percentual_desconto" DECIMAL(5,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "valido_ate" TIMESTAMP(3),
    "uso_maximo" INTEGER,
    "vezes_usado" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cupons_codigo_key" ON "cupons"("codigo");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cupom_id_fkey" FOREIGN KEY ("cupom_id") REFERENCES "cupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
