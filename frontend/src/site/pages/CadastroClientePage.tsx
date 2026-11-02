import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClienteAuth } from "../context/ClienteAuthContext";
import { ApiError } from "../../lib/api";

const inputClass =
  "w-full rounded-md border border-brand-olive/30 bg-white px-4 py-2 text-sm text-brand-brown outline-none focus:border-brand-gold";

export function CadastroClientePage() {
  const { cadastrar } = useClienteAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [aceitaMarketing, setAceitaMarketing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await cadastrar({ nome, email, senha, telefone: telefone || undefined, aceitaMarketing });
      navigate("/catalogo");
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao criar conta");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-center font-serif-brand text-3xl text-brand-dark">Criar conta</h1>
      <p className="mt-2 text-center text-sm text-brand-brown/70">
        Ganhe 5% de desconto em todas as compras a partir de agora.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {erro && (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{erro}</p>
        )}
        <input
          className={inputClass}
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
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
          placeholder="Senha (mínimo 6 caracteres)"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          minLength={6}
          required
        />
        <input
          className={inputClass}
          placeholder="Telefone (opcional)"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />

        <label className="flex items-start gap-2 text-sm text-brand-brown">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={aceitaMarketing}
            onChange={(e) => setAceitaMarketing(e.target.checked)}
          />
          Quero receber novidades e promoções por email
        </label>

        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-full bg-brand-gold px-8 py-3 text-xs font-semibold uppercase tracking-widest text-brand-dark transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {carregando ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-brown/70">
        Já tem conta?{" "}
        <Link to="/entrar" className="font-medium text-brand-olive hover:text-brand-gold">
          Entrar
        </Link>
      </p>
    </div>
  );
}
