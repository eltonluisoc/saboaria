import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface CartItem {
  produtoId: number;
  quantidade: number;
}

interface CartContextValue {
  itens: CartItem[];
  adicionar: (produtoId: number, quantidade?: number) => void;
  remover: (produtoId: number) => void;
  atualizarQuantidade: (produtoId: number, quantidade: number) => void;
  limpar: () => void;
  totalItens: number;
}

const STORAGE_KEY = "saboraria_carrinho";
const CartContext = createContext<CartContextValue | undefined>(undefined);

function lerCarrinhoInicial(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => typeof item?.produtoId === "number" && typeof item?.quantidade === "number"
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<CartItem[]>(lerCarrinhoInicial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  }, [itens]);

  function adicionar(produtoId: number, quantidade = 1) {
    setItens((atual) => {
      const existente = atual.find((item) => item.produtoId === produtoId);
      if (existente) {
        return atual.map((item) =>
          item.produtoId === produtoId ? { ...item, quantidade: item.quantidade + quantidade } : item
        );
      }
      return [...atual, { produtoId, quantidade }];
    });
  }

  function remover(produtoId: number) {
    setItens((atual) => atual.filter((item) => item.produtoId !== produtoId));
  }

  function atualizarQuantidade(produtoId: number, quantidade: number) {
    if (quantidade <= 0) {
      remover(produtoId);
      return;
    }
    setItens((atual) => atual.map((item) => (item.produtoId === produtoId ? { ...item, quantidade } : item)));
  }

  function limpar() {
    setItens([]);
  }

  const totalItens = itens.reduce((soma, item) => soma + item.quantidade, 0);

  return (
    <CartContext.Provider value={{ itens, adicionar, remover, atualizarQuantidade, limpar, totalItens }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }
  return ctx;
}
