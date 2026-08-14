import { useParams } from "react-router-dom";
import { usePedidoPublico } from "../hooks/usePedidoPublico";
import { Loading } from "../components/Loading";
import { Sprig } from "../components/Sprig";

const STATUS_LABELS: Record<string, string> = {
  pendente: "Aguardando pagamento",
  pago: "Pagamento confirmado",
  enviado: "Enviado",
  concluido: "Entregue",
  cancelado: "Cancelado",
};

export function PedidoAcompanhamentoPage() {
  const { codigoAcesso } = useParams();
  const { data: pedido, isLoading, error } = usePedidoPublico(codigoAcesso);

  if (isLoading) {
    return <Loading />;
  }

  if (error || !pedido) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <Sprig className="mx-auto h-16 w-auto text-brand-olive/40" />
        <h1 className="mt-4 font-serif-brand text-3xl text-red-700">Pedido não encontrado</h1>
        <p className="mt-3 text-brand-brown/80">Confira se o link está completo e correto.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <Sprig className="mx-auto h-14 w-auto text-brand-olive/40" />
        <h1 className="mt-4 font-serif-brand text-3xl text-brand-dark">Pedido #{pedido.id}</h1>
        <p className="mt-2 text-sm text-brand-brown/70">
          {new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}
        </p>
        <span className="mt-4 inline-block rounded-full bg-brand-gold/20 px-4 py-1 text-sm font-semibold text-brand-dark">
          {STATUS_LABELS[pedido.status] ?? pedido.status}
        </span>
      </div>

      <div className="mt-10 rounded-lg border border-brand-brown/10 bg-white p-6">
        <h2 className="font-serif-brand text-xl text-brand-dark">Itens</h2>
        <ul className="mt-3 space-y-1 text-sm text-brand-brown/80">
          {pedido.itens.map((item, i) => (
            <li key={i}>
              {item.quantidade}x {item.nome}
            </li>
          ))}
        </ul>
      </div>

      {pedido.statusRastreioAtual && (
        <div className="mt-6 rounded-lg border border-brand-brown/10 bg-white p-6">
          <h2 className="font-serif-brand text-xl text-brand-dark">Rastreio</h2>
          <p className="mt-2 text-sm text-brand-brown/80">{pedido.statusRastreioAtual}</p>

          {pedido.eventos.length > 0 && (
            <ol className="mt-4 space-y-4 border-l-2 border-brand-gold/40 pl-4">
              {pedido.eventos.map((evento, i) => (
                <li key={i}>
                  <p className="text-sm font-medium text-brand-dark">{evento.descricao}</p>
                  <p className="text-xs text-brand-brown/60">
                    {new Date(evento.dataEvento).toLocaleString("pt-BR")}
                    {evento.local && ` · ${evento.local}`}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
