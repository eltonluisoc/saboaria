const MENSAGEM_PADRAO = "Olá! Vim do site da Lud'E e queria saber mais sobre os produtos.";

function WhatsAppIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.5 1.34 5.02L2 22l5.12-1.35a9.96 9.96 0 0 0 4.92 1.3h.01c5.52 0 10-4.48 10-10s-4.49-9.95-10.01-9.95Zm0 18.1h-.01a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-3.04.8.81-2.96-.2-.3a8.26 8.26 0 0 1-1.27-4.4c0-4.58 3.73-8.3 8.32-8.3 2.22 0 4.31.87 5.88 2.44a8.24 8.24 0 0 1 2.43 5.87c0 4.58-3.73 8.3-8.39 8.3Zm4.56-6.22c-.25-.13-1.47-.73-1.7-.81-.23-.08-.39-.13-.56.12-.17.25-.64.81-.78.98-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.21-.73-.65-1.23-1.46-1.37-1.71-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08s.9 2.41 1.02 2.58c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}

export function WhatsAppButton() {
  const numero = import.meta.env.VITE_WHATSAPP_NUMERO as string | undefined;
  if (!numero) return null;

  const link = `https://wa.me/${numero}?text=${encodeURIComponent(MENSAGEM_PADRAO)}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
    >
      <WhatsAppIcon />
    </a>
  );
}
