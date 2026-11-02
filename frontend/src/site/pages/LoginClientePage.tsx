import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClienteAuth } from "../context/ClienteAuthContext";
import { ApiError } from "../../lib/api";

const inputClass =
  "w-full rounded-md border border-brand-olive/30 bg-white px-4 py-2 text-sm text-brand-brown outline-none focus:border-brand-gold";

export function LoginClientePage() {
  const { login } = useClienteAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await login(email, senha);
      navigate("/catalogo");
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao entrar");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-center font-serif-brand text-3xl text-brand-dark">Entrar</h1>
      <p className="mt-2 text-center text-sm text-brand-brown/70">
        Entre na sua conta e ganhe 5% de desconto em todas as compras.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {erro && (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{erro}</p>
        )}
        <input
          className={inputClass}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={inputClass}
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-full bg-brand-gold px-8 py-3 text-xs font-semibold uppercase tracking-widest text-brand-dark transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-brown/70">
        Ainda não tem conta?{" "}
        <Link to="/cadastro" className="font-medium text-brand-olive hover:text-brand-gold">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
