-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "codigo_acesso" TEXT NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "codigo_rastreio" TEXT,
ADD COLUMN     "status_rastreio_atual" TEXT,
ADD COLUMN     "ultimo_evento_rastreio" TEXT;

-- CreateTable
CREATE TABLE "rastreio_eventos" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "codigo_evento" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "local" TEXT,
    "data_evento" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rastreio_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_codigo_acesso_key" ON "pedidos"("codigo_acesso");

-- AddForeignKey
ALTER TABLE "rastreio_eventos" ADD CONSTRAINT "rastreio_eventos_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
