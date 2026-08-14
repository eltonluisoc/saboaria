export interface Admin {
  id: number;
  email: string;
}

export interface Insumo {
  id: number;
  nome: string;
  unidadeMedida: string;
  custoUnitarioAtual: string;
  estoqueAtual: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompraInsumo {
  id: number;
  insumoId: number;
  quantidade: string;
  precoUnitario: string;
  dataCompra: string;
  createdAt: string;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  imagemUrl: string | null;
  precoVenda: string;
  custoMedio: string;
  pesoUnidadeGramas: string | null;
  custoPorKgMassa: number;
  custoIndiretoPorUnidade: number;
  custoUnitarioCompleto: number;
  estoqueAtual: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProdutoInsumoItem {
  id: number;
  produtoId: number;
  insumoId: number;
  quantidadeUsada: string;
  insumo: Insumo;
}

export interface ProdutoDetalhado extends Produto {
  receita: ProdutoInsumoItem[];
}

export interface DespesaGeral {
  id: number;
  descricao: string;
  valor: string;
  categoria: string | null;
  recorrente: boolean;
  dataFimRecorrencia: string | null;
  despesaOrigemId: number | null;
  pago: boolean;
  dataPagamento: string | null;
  dataDespesa: string;
  createdAt: string;
}

export interface Cliente {
  id: number;
  nome: string;
  email: string;
}

export interface ItemPedido {
  id: number;
  pedidoId: number;
  produtoId: number;
  quantidade: number;
  precoUnitario: string;
  subtotal: string;
  produto?: Produto;
}

export interface Venda {
  id: number;
  clienteId: number | null;
  origem: string;
  status: string;
  valorTotal: string;
  formaPagamento: string | null;
  mpPreferenceId?: string | null;
  mpPaymentId?: string | null;
  codigoRastreio?: string | null;
  statusRastreioAtual?: string | null;
  codigoAcesso?: string;
  dataPedido: string;
  createdAt: string;
  updatedAt: string;
  itens: ItemPedido[];
  cliente?: Cliente | null;
}

export interface RastreioEvento {
  descricao: string;
  local: string | null;
  dataEvento: string;
}

export interface PedidoPublico {
  id: number;
  status: string;
  dataPedido: string;
  statusRastreioAtual: string | null;
  itens: { nome: string; quantidade: number }[];
  eventos: RastreioEvento[];
}

export interface LoteProducao {
  id: number;
  produtoId: number;
  quantidadeProduzida: number;
  dataProducao: string;
  createdAt: string;
  produto?: Produto;
}

export interface Relatorio {
  periodo: { de: string; ate: string };
  totalVendas: string;
  totalDespesasPagas: string;
  totalDespesasEmAberto: string;
  lucro: string;
}
