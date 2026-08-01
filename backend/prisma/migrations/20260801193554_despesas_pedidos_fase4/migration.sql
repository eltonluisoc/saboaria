-- AlterTable
ALTER TABLE "despesas_gerais" ADD COLUMN     "categoria" TEXT,
ADD COLUMN     "recorrente" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "origem" TEXT NOT NULL DEFAULT 'manual',
ALTER COLUMN "cliente_id" DROP NOT NULL;
