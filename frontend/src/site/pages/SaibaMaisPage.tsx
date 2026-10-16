import { Reveal } from "../components/Reveal";

interface Ingrediente {
  nome: string;
  imagem: string;
  paragrafos: [string, string];
  porQueUsar: [string, string, string];
}

const INGREDIENTES: Ingrediente[] = [
  {
    nome: "Alecrim",
    imagem: "/produtos/alecrim.jpeg",
    paragrafos: [
      "Presente em rituais de banho há séculos, o alecrim é reconhecido por seu aroma herbal intenso e revigorante — uma planta que desperta os sentidos e traz uma sensação imediata de energia e clareza.",
      "Na saboaria, ele entra na receita justamente por essa dupla função: perfuma naturalmente o banho e ajuda a deixar a pele com sensação de limpeza e frescor, sem ressecar.",
    ],
    porQueUsar: [
      "Aroma natural, sem fragrância sintética",
      "Sensação revigorante, ideal pro banho da manhã",
      "Uso tradicional em rituais de cuidado há gerações",
    ],
  },
  {
    nome: "Argila Verde",
    imagem: "/produtos/argilaverde.jpeg",
    paragrafos: [
      "De origem mineral, a argila verde é uma das argilas mais usadas na cosmética natural — valorizada há muito tempo por sua textura suave e por sua capacidade de absorver impurezas.",
      "No sabonete, ela age suavemente sobre a pele, ajudando a remover o excesso de oleosidade e deixando uma sensação de equilíbrio e frescor após o banho — sem agredir.",
    ],
    porQueUsar: [
      "Ação absorvente, ajuda a controlar a oleosidade",
      "Textura mineral suave, sem irritar a pele",
      "Tradição no uso cosmético natural",
    ],
  },
  {
    nome: "Cereja com Avelã",
    imagem: "/produtos/cereja-com-avela.jpeg",
    paragrafos: [
      "Cereja e avelã formam uma combinação clássica de aconchego e sofisticação — a fruta traz um toque adocicado natural, enquanto a avelã contribui com uma nota amadeirada que arredonda o aroma, sem depender de fragrância sintética.",
      "Na receita, o extrato natural dessa dupla entra pelo cuidado com a pele: ajuda na hidratação e deixa um toque nutritivo, prevenindo o ressecamento — uma experiência de banho mais aconchegante do início ao fim.",
    ],
    porQueUsar: [
      "Aroma adocicado natural, sem fragrância sintética",
      "Toque nutritivo da avelã, ajuda a não ressecar",
      "Combinação pensada pra uma experiência mais aconchegante no banho",
    ],
  },
];

export function SaibaMaisPage() {
  return (
    <div>
      <section className="bg-brand-cream px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold">
              Nossa história
            </span>
            <h1 className="mt-3 font-serif-brand text-4xl text-brand-dark sm:text-5xl">
              Por trás de cada produto, uma história
            </h1>
            <div className="mx-auto mt-6 flex max-w-xl flex-col gap-4 text-left text-sm leading-relaxed text-brand-brown/80 sm:text-base">
              <p>
                A Lud&apos;E nasceu da vontade de transformar gestos simples do dia a dia em pequenos
                rituais — e todo ritual carrega uma história por trás.
              </p>
              <p>
                Cada receita une ingredientes que atravessam gerações: plantas, argilas e extratos que
                a sabedoria popular já usava muito antes de virarem tendência. Nenhum está ali por
                acaso — e queremos que você conheça o motivo.
              </p>
              <p>
                Abaixo, contamos a história de cada ingrediente que usamos: de onde vem, por que
                escolhemos, e o que ele faz por você.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-brand-cream px-6 pb-16 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-16">
            {INGREDIENTES.map((ingrediente, i) => (
              <Reveal key={ingrediente.nome} delay={i * 120}>
                <article className="group flex h-full flex-col overflow-hidden rounded-lg bg-white/40">
                  <div className="aspect-[16/10] w-full overflow-hidden rounded-md">
                    <img
                      src={ingrediente.imagem}
                      alt={ingrediente.nome}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-4 pt-6">
                    <h2 className="font-serif-brand text-2xl text-brand-dark">{ingrediente.nome}</h2>

                    <div className="flex flex-col gap-3">
                      {ingrediente.paragrafos.map((paragrafo, idx) => (
                        <p key={idx} className="text-sm leading-relaxed text-brand-brown/75">
                          {paragrafo}
                        </p>
                      ))}
                    </div>

                    <ul className="mt-2 flex flex-col gap-2 border-t border-brand-olive/15 pt-4">
                      {ingrediente.porQueUsar.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-brand-brown/80">
                          <span
                            className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-brand-gold"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
