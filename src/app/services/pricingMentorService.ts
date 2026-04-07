import type {
  MentorMessage,
  MentorCategory,
  MentorNudge,
  MicroLesson,
  SimulationResult,
  PricingAnalysisContext,
} from '../types/pricingMentor';

// ─── Knowledge Base ───────────────────────────────────────────────────────────

const MICRO_LESSONS: MicroLesson[] = [
  {
    id: 'margem-1',
    title: 'O que é margem de lucro?',
    explanation:
      'Margem de lucro é a diferença entre o preço que você cobra e o custo do serviço. É o que sobra pra você depois de pagar tudo.',
    example:
      'Se você cobra R$200 por um serviço e gasta R$140, sua margem é de R$60 — ou seja, 30%.',
    application:
      'Sempre confira se sua margem cobre seus custos fixos (aluguel, ferramentas, transporte) e ainda deixa lucro.',
    category: 'margem',
  },
  {
    id: 'formacao-1',
    title: 'Como formar o preço de um serviço?',
    explanation:
      'Preço = Custo + Margem desejada. Primeiro some tudo que gasta (material, mão de obra, deslocamento). Depois adicione o lucro que quer ter.',
    example:
      'Custo total: R$100. Quer margem de 35%? Preço = R$100 / (1 - 0,35) = R$153,85.',
    application:
      'Nunca chute o preço. Calcule sempre a partir dos seus custos reais.',
    category: 'formacao_preco',
  },
  {
    id: 'custos-1',
    title: 'Custo fixo vs custo variável',
    explanation:
      'Custos fixos são os que você paga todo mês (aluguel, internet). Custos variáveis mudam conforme o trabalho (material, transporte).',
    example:
      'Aluguel de R$1.000/mês é fixo. Tinta para pintura de R$80 por obra é variável.',
    application:
      'Distribua os custos fixos entre todos os serviços do mês para não ter surpresas.',
    category: 'custos',
  },
  {
    id: 'concorrencia-1',
    title: 'Como usar a concorrência a seu favor?',
    explanation:
      'Saber quanto seus concorrentes cobram ajuda a se posicionar. Não precisa ser o mais barato — precisa entregar valor.',
    example:
      'Se o mercado cobra R$150–R$200, cobrar R$180 com atendimento premium pode atrair mais clientes.',
    application:
      'Compare preços, mas foque no que te diferencia: qualidade, prazo, garantia.',
    category: 'concorrencia',
  },
  {
    id: 'psicologico-1',
    title: 'Preço psicológico funciona?',
    explanation:
      'Sim! Preços que terminam em 9 ou 7 parecem mais baratos pro cérebro. R$99,90 parece muito menos que R$100.',
    example:
      'Em vez de cobrar R$200, use R$197 ou R$199,90. A percepção muda.',
    application:
      'Teste preços terminados em 7 ou 9 nos seus serviços mais populares.',
    category: 'psicologico',
  },
  {
    id: 'sazonalidade-1',
    title: 'O que é sazonalidade?',
    explanation:
      'São épocas do ano em que a demanda sobe ou desce. No verão há mais demanda por manutenção. No fim do ano, mais reformas.',
    example:
      'Serviços de ar-condicionado: preço sobe 20-30% no verão porque a demanda explode.',
    application:
      'Ajuste seus preços conforme a demanda da época. Alta demanda = oportunidade de margem maior.',
    category: 'sazonalidade',
  },
  {
    id: 'elasticidade-1',
    title: 'Elasticidade de preço (simples)',
    explanation:
      'É o quanto a demanda muda quando você mexe no preço. Se subir 10% e perder poucos clientes, o serviço é "inelástico" — você ganha mais.',
    example:
      'Um encanador de emergência pode cobrar mais porque o cliente precisa urgente (inelástico).',
    application:
      'Serviços urgentes ou especializados toleram preços maiores. Teste aumentos graduais.',
    category: 'elasticidade',
  },
  {
    id: 'fluxo-1',
    title: 'O que é fluxo de caixa?',
    explanation:
      'É o dinheiro que entra e sai do seu negócio ao longo do tempo. Ter lucro no papel não adianta se o dinheiro não cai na conta.',
    example:
      'Você faturou R$10.000 no mês, mas só recebeu R$6.000. Seus custos são R$7.000. Mesmo com lucro teórico, faltou dinheiro.',
    application:
      'Controle prazos de recebimento. Cobre adiantamento quando possível.',
    category: 'fluxo_caixa',
  },
];

// ─── Keyword → Category Mapping ──────────────────────────────────────────────

const KEYWORD_MAP: { keywords: string[]; category: MentorCategory }[] = [
  { keywords: ['margem', 'lucro', 'rentabilidade', 'lucratividade'], category: 'margem' },
  { keywords: ['preço', 'preco', 'precificar', 'formar preço', 'formação', 'calcular'], category: 'formacao_preco' },
  { keywords: ['custo', 'gasto', 'despesa', 'fixo', 'variavel', 'variável'], category: 'custos' },
  { keywords: ['concorrente', 'concorrência', 'mercado', 'competidor'], category: 'concorrencia' },
  { keywords: ['psicológico', 'psicologico', '99', '9,90', 'percepção'], category: 'psicologico' },
  { keywords: ['sazonalidade', 'época', 'temporada', 'estação', 'verão', 'inverno'], category: 'sazonalidade' },
  { keywords: ['elasticidade', 'demanda', 'sensibilidade', 'inelástico'], category: 'elasticidade' },
  { keywords: ['fluxo', 'caixa', 'recebimento', 'pagamento'], category: 'fluxo_caixa' },
  { keywords: ['simular', 'simulação', 'simulacao', 'se eu', 'e se', 'aumentar', 'diminuir'], category: 'simulacao' },
];

function detectCategory(text: string): MentorCategory {
  const lower = text.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.category;
    }
  }
  return 'geral';
}

// ─── Response Generator ───────────────────────────────────────────────────────

const GREETING_RESPONSES = [
  'Olá! 👋 Sou o Pricing Mentor, seu assistente de precificação. Como posso te ajudar hoje?',
  'E aí! 😊 Tô aqui pra te ajudar a precificar melhor. O que precisa?',
  'Opa! 🎯 Pronto pra te ajudar com preços. Me conta o que tá precisando!',
];

const CATEGORY_RESPONSES: Record<MentorCategory, string[]> = {
  margem: [
    'Margem de lucro é o coração do seu negócio! 💚 Quer que eu explique como calcular a sua?',
    'Boa pergunta sobre margem! A regra de ouro: nunca trabalhe com margem abaixo de 25-30%. Quer saber por quê?',
    'Margem baixa é cilada! Vamos olhar seus números e ver onde dá pra melhorar. Me conta mais detalhes.',
  ],
  formacao_preco: [
    'Pra formar um bom preço, a fórmula é simples: Custo Total ÷ (1 - Margem desejada). Quer que eu calcule pra você?',
    'Nunca chute preço! 🎯 Vamos montar juntos: some seus custos e defina a margem. Me conta seus custos.',
    'Formação de preço é a base de tudo. Primeiro: você sabe exatamente quanto custa cada serviço que oferece?',
  ],
  custos: [
    'Custos são a fundação do preço! 🏗️ Não esqueça: material + mão de obra + deslocamento + custos fixos proporcionais.',
    'Dica de ouro: muita gente esquece de incluir deslocamento, desgaste de ferramenta e tempo de deslocamento. Esses custos invisíveis comem sua margem!',
    'Vamos separar seus custos em fixos e variáveis? Assim fica mais fácil precificar corretamente.',
  ],
  concorrencia: [
    'Olhar a concorrência é importante, mas não se prenda a isso! 🔍 Preço baixo demais pode queimar seu negócio.',
    'A concorrência cobra X? Ótimo. Mas a pergunta é: o que VOCÊ oferece de diferente? Valor > Preço.',
    'Use a concorrência como referência, não como meta. Se seu serviço é melhor, seu preço pode (e deve) ser maior.',
  ],
  psicologico: [
    'Preço psicológico é poderoso! 🧠 R$197 parece MUITO mais barato que R$200. Teste isso nos seus serviços.',
    'Sabia que preços terminados em 7 passam sensação de desconto? Experimente: R$147, R$197, R$297...',
    'O cérebro processa preços da esquerda pra direita. R$99,90 é lido como "noventa e pouco". Use isso!',
  ],
  sazonalidade: [
    'Sazonalidade é sua aliada! 📅 Na alta demanda, aumente preços. Na baixa, crie promoções estratégicas.',
    'Cada época do ano tem suas oportunidades. Verão = manutenção, Fim de ano = reformas. Já ajustou seus preços?',
    'Não tenha medo de cobrar mais na alta temporada. É assim que negócios saudáveis funcionam!',
  ],
  elasticidade: [
    'Elasticidade é simples: se você sobe o preço e não perde clientes, pode subir mais! 📈 Teste gradualmente.',
    'Serviços urgentes e especializados são inelásticos — o cliente paga o que for. Valorize sua expertise!',
    'Dica: suba 5-10% e veja o que acontece. Se a demanda se mantém, você estava cobrando pouco!',
  ],
  fluxo_caixa: [
    'Fluxo de caixa > Lucro no papel! 💰 De nada adianta faturar muito se o dinheiro não entra a tempo.',
    'Dica prática: peça 50% de entrada em serviços grandes. Isso protege seu fluxo de caixa.',
    'Cuidado com prazos longos de recebimento. Negocie sempre condições que favoreçam seu caixa.',
  ],
  simulacao: [
    'Vamos simular! 🔬 Me diz o preço atual, o custo e a quantidade que vende. Eu calculo cenários pra você.',
    'Simulação é a melhor forma de tomar decisão. Quer testar um aumento de preço? Me conta os números!',
    'Boa ideia simular antes de decidir! Me passa os dados e eu monto os cenários.',
  ],
  geral: [
    'Boa pergunta! 🤔 Me conta mais detalhes pra eu poder te ajudar melhor.',
    'Tô aqui pra isso! Me explica mais sobre sua dúvida que eu te oriento.',
    'Posso te ajudar com margem, formação de preço, custos, concorrência e muito mais. O que precisa?',
  ],
};

const NUDGE_MESSAGES: MentorNudge[] = [
  {
    id: 'nudge-low-margin',
    type: 'warning',
    message: 'Sua margem está abaixo de 20%. Isso pode não cobrir seus custos fixos. Quer ajuda pra ajustar?',
    timestamp: Date.now(),
    dismissed: false,
    actionLabel: 'Ajustar margem',
  },
  {
    id: 'nudge-psychological',
    type: 'tip',
    message: 'Dica: use preço psicológico! Em vez de R$200, tente R$197 ou R$199,90. A percepção muda muito.',
    timestamp: Date.now(),
    dismissed: false,
  },
  {
    id: 'nudge-question-1',
    type: 'question',
    message: 'Você está ganhando dinheiro ou só vendendo? 🤔 Clique pra analisar sua margem real.',
    timestamp: Date.now(),
    dismissed: false,
    actionLabel: 'Analisar margem',
  },
  {
    id: 'nudge-question-2',
    type: 'question',
    message: 'Se vender mais com esse preço, você lucra ou perde? Nem sempre mais vendas = mais lucro.',
    timestamp: Date.now(),
    dismissed: false,
  },
  {
    id: 'nudge-cost-reminder',
    type: 'tip',
    message: 'Lembrete: custos de deslocamento, ferramentas e tempo são frequentemente esquecidos na precificação.',
    timestamp: Date.now(),
    dismissed: false,
  },
];

// ─── Public API ───────────────────────────────────────────────────────────────

let msgCounter = 0;

function createMentorId(): string {
  msgCounter += 1;
  return `mentor-${Date.now()}-${msgCounter}`;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getGreetingMessage(): MentorMessage {
  return {
    id: createMentorId(),
    role: 'mentor',
    content: pickRandom(GREETING_RESPONSES),
    timestamp: Date.now(),
    category: 'geral',
  };
}

export function generateResponse(
  userText: string,
  context?: PricingAnalysisContext,
): MentorMessage {
  const category = detectCategory(userText);
  let content = pickRandom(CATEGORY_RESPONSES[category]);

  // Enrich with context if available
  if (context) {
    if (context.currentPrice && context.costPrice) {
      const margin = ((context.currentPrice - context.costPrice) / context.currentPrice) * 100;
      if (margin < 20) {
        content += `\n\n⚠️ Olha, analisando seus dados: o serviço ${context.serviceName || ''} está com margem de apenas ${margin.toFixed(1)}%. O ideal é pelo menos 30%.`;
      } else if (margin >= 30) {
        content += `\n\n✅ Boa notícia! A margem de ${margin.toFixed(1)}% está saudável. Continue assim!`;
      }
    }
    if (context.competitorPrice && context.currentPrice) {
      const diff = ((context.competitorPrice - context.currentPrice) / context.currentPrice) * 100;
      if (diff > 10) {
        content += `\n\n💡 Seu concorrente está cobrando ${diff.toFixed(0)}% a mais. Pode ser uma oportunidade de aumentar seu preço.`;
      }
    }
  }

  return {
    id: createMentorId(),
    role: 'mentor',
    content,
    timestamp: Date.now(),
    category,
  };
}

export function getMicroLesson(category: MentorCategory): MicroLesson | undefined {
  const lessons = MICRO_LESSONS.filter((l) => l.category === category);
  return lessons.length > 0 ? pickRandom(lessons) : undefined;
}

export function getAllMicroLessons(): MicroLesson[] {
  return MICRO_LESSONS;
}

export function getRandomNudge(): MentorNudge {
  return { ...pickRandom(NUDGE_MESSAGES), id: createMentorId(), timestamp: Date.now() };
}

export function simulatePrice(
  currentPrice: number,
  costPrice: number,
  newPrice: number,
  quantity: number = 1,
): SimulationResult {
  const currentMargin = ((currentPrice - costPrice) / currentPrice) * 100;
  const newMargin = ((newPrice - costPrice) / newPrice) * 100;
  const currentProfit = (currentPrice - costPrice) * quantity;
  const newProfit = (newPrice - costPrice) * quantity;
  const percentChange = ((newPrice - currentPrice) / currentPrice) * 100;

  let recommendation: string;
  if (newMargin < 15) {
    recommendation = '⚠️ Cuidado! Essa margem é muito baixa. Pode não cobrir seus custos fixos.';
  } else if (newMargin < 25) {
    recommendation = '🟡 Margem razoável, mas tente buscar pelo menos 30% para ter mais segurança.';
  } else if (newMargin < 40) {
    recommendation = '✅ Boa margem! Esse preço parece saudável para o negócio.';
  } else {
    recommendation = '🎯 Margem excelente! Só confirme se o preço é competitivo no mercado.';
  }

  return {
    currentPrice,
    newPrice,
    currentMargin,
    newMargin,
    currentProfit,
    newProfit,
    percentChange,
    recommendation,
  };
}

export function analyzePricingContext(context: PricingAnalysisContext): MentorNudge[] {
  const nudges: MentorNudge[] = [];

  if (context.currentPrice && context.costPrice) {
    const margin = ((context.currentPrice - context.costPrice) / context.currentPrice) * 100;

    if (margin < 0) {
      nudges.push({
        id: createMentorId(),
        type: 'alert',
        message: `🚨 ALERTA: Você está vendendo ${context.serviceName || 'este serviço'} abaixo do custo! Preço: R$${context.currentPrice.toFixed(2)}, Custo: R$${context.costPrice.toFixed(2)}. Margem: ${margin.toFixed(1)}%.`,
        timestamp: Date.now(),
        dismissed: false,
        actionLabel: 'Corrigir agora',
        context: context.serviceCode,
      });
    } else if (margin < 15) {
      nudges.push({
        id: createMentorId(),
        type: 'warning',
        message: `⚠️ Margem baixa (${margin.toFixed(1)}%) em ${context.serviceName || 'este serviço'}. Preço: R$${context.currentPrice.toFixed(2)}, Custo: R$${context.costPrice.toFixed(2)}. O ideal é pelo menos 30%.`,
        timestamp: Date.now(),
        dismissed: false,
        actionLabel: 'Ajustar preço',
        context: context.serviceCode,
      });
    }

    // Psychological pricing hint
    const roundCheck = context.currentPrice % 10;
    if (roundCheck === 0) {
      const psychPrice = context.currentPrice - 0.10;
      nudges.push({
        id: createMentorId(),
        type: 'tip',
        message: `💡 Dica: em vez de R$${context.currentPrice.toFixed(2)}, use R$${psychPrice.toFixed(2)}. Preço psicológico pode aumentar suas vendas!`,
        timestamp: Date.now(),
        dismissed: false,
        context: context.serviceCode,
      });
    }
  }

  if (context.competitorPrice && context.currentPrice) {
    const diff = ((context.competitorPrice - context.currentPrice) / context.currentPrice) * 100;
    if (diff > 15) {
      nudges.push({
        id: createMentorId(),
        type: 'tip',
        message: `📊 Seu concorrente está ${diff.toFixed(0)}% acima do seu preço para ${context.serviceName || 'este serviço'}. Você pode testar um preço maior.`,
        timestamp: Date.now(),
        dismissed: false,
        actionLabel: 'Ver concorrência',
        context: context.serviceCode,
      });
    }
  }

  return nudges;
}

export function formatLessonAsMessage(lesson: MicroLesson): string {
  return `📚 **${lesson.title}**\n\n${lesson.explanation}\n\n📌 **Exemplo:** ${lesson.example}\n\n🎯 **Na prática:** ${lesson.application}`;
}
