import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../../lib/api";

export interface ClientePublico {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  aceitaMarketing: boolean;
}

interface CadastroInput {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  aceitaMarketing?: boolean;
}

interface ClienteAuthContextValue {
  cliente: ClientePublico | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: CadastroInput) => Promise<void>;
  logout: () => Promise<void>;
}

const ClienteAuthContext = createContext<ClienteAuthContextValue | undefined>(undefined);

export function ClienteAuthProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<ClientePublico | null>(null);
  const [loading, setLoading] = useState(true);

  async function checkAuth() {
    try {
      const data = await api.get<{ cliente: ClientePublico }>("/api/clientes/me");
      setCliente(data.cliente);
    } catch {
      setCliente(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  async function login(email: string, senha: string) {
    const data = await api.post<{ cliente: ClientePublico }>("/api/clientes/login", { email, senha });
    setCliente(data.cliente);
  }

  async function cadastrar(dados: CadastroInput) {
    const data = await api.post<{ cliente: ClientePublico }>("/api/clientes/cadastro", dados);
    setCliente(data.cliente);
  }

  async function logout() {
    await api.post("/api/clientes/logout");
    setCliente(null);
  }

  return (
    <ClienteAuthContext.Provider value={{ cliente, loading, login, cadastrar, logout }}>
      {children}
    </ClienteAuthContext.Provider>
  );
}

export function useClienteAuth() {
  const ctx = useContext(ClienteAuthContext);
  if (!ctx) {
    throw new Error("useClienteAuth deve ser usado dentro de ClienteAuthProvider");
  }
  return ctx;
}
