export function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-brand-brown/60">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-olive/30 border-t-brand-gold" />
      Carregando...
    </div>
  );
}
