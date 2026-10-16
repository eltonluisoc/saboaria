-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "eh_kit" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "kit_itens" (
    "id" SERIAL NOT NULL,
    "kit_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "kit_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kit_itens_kit_id_produto_id_key" ON "kit_itens"("kit_id", "produto_id");

-- AddForeignKey
ALTER TABLE "kit_itens" ADD CONSTRAINT "kit_itens_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit_itens" ADD CONSTRAINT "kit_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
