import { Reveal } from "../components/Reveal";

interface ItemHistoria {
  nome: string;
  imagem: string;
  paragrafos: [string, string];
  porQueUsar: [string, string, string];
}

const ITENS_HISTORIA: ItemHistoria[] = [
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
  {
    nome: "Vela Aromatizada",
    imagem: "/produtos/vela-aromatizada-lude.jpg",
    paragrafos: [
      "A vela chegou como um jeito de sentir a Lud'E sem precisar passar pelo banho — cera de soja (vegetal, queima mais limpo que parafina comum) com óleos essenciais, num pote de cerâmica com tampa de madeira que também serve de descanso depois de usar.",
      "É pensada pra ficar na sala, no quarto, na mesa de trabalho — um gesto pequeno, acender e deixar queimar devagar, que perfuma o ambiente por horas, do mesmo jeito que a Lud'E já perfuma o banho.",
    ],
    porQueUsar: [
      "Cera de soja vegetal, queima mais limpa que parafina comum",
      "Pote de cerâmica reutilizável, com tampa de madeira",
      "Perfuma o ambiente por horas a cada vez que acende",
    ],
  },
  {
    nome: "Difusor Aromático Ambientes",
    imagem: "/produtos/difusor-aromatico-ambientes.jpg",
    paragrafos: [
      "O difusor de varetas é o jeito mais discreto de manter um cheiro constante em casa — sem fogo, sem tomada, sem precisar lembrar de nada todo dia. As varetas de bambu absorvem o perfume e devolvem aos poucos pro ar.",
      "Pensado pra sala, quarto ou banheiro — qualquer ambiente fechado que você queira perfumado o dia inteiro, só virando as varetas de vez em quando pra renovar o aroma.",
    ],
    porQueUsar: [
      "Sem fogo nem tomada — só virar as varetas de vez em quando",
      "Perfume constante e gradual, por semanas",
      "Vidro elegante que também decora o ambiente",
    ],
  },
  {
    nome: "Difusor Aromático Carros",
    imagem: "/produtos/difusor-aromatico-carros.jpg",
    paragrafos: [
      "Versão compacta do difusor de ambientes, pensada pro trajeto do dia a dia — pendura no retrovisor e libera aos poucos a mesma fragrância natural da Lud'E, sem enjoar.",
      "Pequeno o suficiente pra não atrapalhar a visão, discreto o suficiente pra não chamar atenção — só perfumar o carro com o mesmo cuidado artesanal de sempre.",
    ],
    porQueUsar: [
      "Formato compacto, pendura no retrovisor",
      "Fragrância natural, sem enjoar",
      "Dura semanas de uso diário",
    ],
  },
  {
    nome: "Spray Aromático para Carros",
    imagem: "/produtos/spray-aromatico-carros.jpg",
    paragrafos: [
      "Pra quem quer o cheiro na hora, sem esperar — um borrifo rápido no banco ou no ar já perfuma o carro imediatamente, com o mesmo cuidado Lud'E de sempre.",
      "Cabe no porta-luvas ou na bolsa, pronto pra usar antes de uma viagem, depois de levar alguém no carro, ou só porque bateu vontade de sentir aquele cheiro de novo.",
    ],
    porQueUsar: [
      "Efeito imediato, sem precisar esperar",
      "Tamanho compacto (60ml), cabe em qualquer lugar do carro",
      "Mesmo cuidado artesanal da linha Lud'E",
    ],
  },
  {
    nome: "Perfume em Óleo",
    imagem: "/produtos/perfume-em-oleo.jpg",
    paragrafos: [
      "Fragrância natural concentrada em óleo, sem álcool — aplicação direto na pele, com um aplicador roll-on que facilita usar ao longo do dia, onde quiser.",
      "Por ser óleo, e não álcool, o perfume gruda mais na pele e dura mais tempo que um perfume comum — um toque no pulso de manhã já segura o aroma até o fim do dia.",
    ],
    porQueUsar: [
      "Sem álcool — não resseca a pele",
      "Dura mais que perfume comum, por ser óleo concentrado",
      "Aplicador roll-on, fácil de levar na bolsa",
    ],
  },
  {
    nome: "SPA dos Pés",
    imagem: "/produtos/spa-dos-pes.jpg",
    paragrafos: [
      "Um escalda-pés com sal e os mesmos ingredientes naturais da Lud'E — lavanda e alecrim entre os grãos, pensado pra fechar o dia com um ritual de cuidado que normalmente só se faz no salão.",
      "Basta dissolver numa bacia de água morna e deixar os pés de molho — um jeito simples de desacelerar, sentir o aroma, e terminar o dia mais relaxado.",
    ],
    porQueUsar: [
      "Sal com lavanda e alecrim, ingredientes naturais",
      "Ritual rápido de relaxamento, em casa mesmo",
      "Ideal pra fechar o dia depois de muito tempo em pé",
    ],
  },
  {
    nome: "Body Splash",
    imagem: "/produtos/body-splash.jpg",
    paragrafos: [
      "Uma hidratação leve pro corpo com o perfume Lud'E — refrescante, de absorção rápida, pensado pra usar todo dia, não só em ocasião especial.",
      "Borrifa depois do banho, ou direto na pele seca ao longo do dia — um jeito rápido de sentir o cuidado Lud'E em qualquer momento, sem pesar.",
    ],
    porQueUsar: [
      "Absorção rápida, não deixa a pele pegajosa",
      "Pode usar todo dia, não só em ocasião especial",
      "Refrescante, ótimo pros dias quentes",
    ],
  },
  {
    nome: "Sachê Aromático",
    imagem: "/produtos/sache-aromatico.jpg",
    paragrafos: [
      "Um sachê perfumado pra pendurar ou guardar na gaveta, no guarda-roupa ou na bolsa — perfuma suavemente as peças de roupa com o mesmo cuidado artesanal da Lud'E, sem precisar de nenhum gesto além de colocar e deixar lá.",
      "É o jeito mais discreto de ter o perfume Lud'E até onde ele normalmente não chegaria — entre as roupas, dentro da bolsa, na gaveta da cômoda.",
    ],
    porQueUsar: [
      "Perfuma roupas e ambientes fechados, sem contato direto",
      "Não precisa de nenhum gesto — só colocar e deixar",
      "Dura semanas, perfume suave e constante",
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
                Abaixo, contamos a história por trás de cada ingrediente e de cada produto da coleção:
                de onde vem, por que escolhemos, e o que ele faz por você.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-brand-cream px-6 pb-16 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-16">
            {ITENS_HISTORIA.map((item, i) => (
              <Reveal key={item.nome} delay={(i % 6) * 120}>
                <article className="group flex h-full flex-col overflow-hidden rounded-lg bg-white/40">
                  <div className="aspect-[16/10] w-full overflow-hidden rounded-md">
                    <img
                      src={item.imagem}
                      alt={item.nome}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-4 pt-6">
                    <h2 className="font-serif-brand text-2xl text-brand-dark">{item.nome}</h2>

                    <div className="flex flex-col gap-3">
                      {item.paragrafos.map((paragrafo, idx) => (
                        <p key={idx} className="text-sm leading-relaxed text-brand-brown/75">
                          {paragrafo}
                        </p>
                      ))}
                    </div>

                    <ul className="mt-2 flex flex-col gap-2 border-t border-brand-olive/15 pt-4">
                      {item.porQueUsar.map((texto) => (
                        <li key={texto} className="flex items-start gap-2.5 text-sm text-brand-brown/80">
                          <span
                            className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-brand-gold"
                            aria-hidden="true"
                          />
                          {texto}
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
