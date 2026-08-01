export interface Admin {
  id: number;
  email: string;
}

export interface Insumo {
  id: number;
  nome: string;
  unidadeMedida: string;
  custoUnitarioAtual: string;
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
  precoVenda: string;
  custoMedio: string;
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
  dataPedido: string;
  createdAt: string;
  updatedAt: string;
  itens: ItemPedido[];
  cliente?: Cliente | null;
}

export interface Relatorio {
  periodo: { de: string; ate: string };
  totalVendas: string;
  totalDespesas: string;
  lucro: string;
}
