-- AlterTable
ALTER TABLE "despesas_gerais" ADD COLUMN     "despesa_origem_id" INTEGER;

-- AddForeignKey
ALTER TABLE "despesas_gerais" ADD CONSTRAINT "despesas_gerais_despesa_origem_id_fkey" FOREIGN KEY ("despesa_origem_id") REFERENCES "despesas_gerais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
