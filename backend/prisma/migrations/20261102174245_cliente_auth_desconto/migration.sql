-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "aceita_marketing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "senha_hash" TEXT;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "desconto_percentual" DECIMAL(5,2) DEFAULT 0;
