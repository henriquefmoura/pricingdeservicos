import type {
  MentorMessage,
  MentorCategory,
  MentorNudge,
  MicroLesson,
  SimulationResult,
  PricingAnalysisContext,
  QuickAction,
} from '../types/pricingMentor';
import { generateAIResponse } from './pricingMentorAIService';

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
  // ─── New Lessons ─────────────────────────────────────────────────────────
  {
    id: 'estrategia-1',
    title: 'Precificação por valor vs por custo',
    explanation:
      'Precificar por custo é somar seus gastos + margem. Precificar por valor é cobrar pelo resultado que você entrega ao cliente.',
    example:
      'Um eletricista que instala iluminação pode cobrar pelo serviço (R$200) ou pelo projeto de iluminação que valoriza o imóvel (R$500+).',
    application:
      'Pense: quanto o cliente GANHA com seu serviço? Se ele ganha muito, você pode cobrar mais.',
    category: 'estrategia',
  },
  {
    id: 'negocios-1',
    title: 'Como fidelizar clientes',
    explanation:
      'Clientes fiéis são mais baratos de manter do que conquistar novos. Um bom pós-serviço gera indicações e receita recorrente.',
    example:
      'Após um serviço, mande uma mensagem: "Tudo certo com o serviço? Se precisar, pode contar comigo!" Isso cria vínculo.',
    application:
      'Crie um plano de manutenção mensal ou trimestral. Clientes fiéis pagam sem negociar.',
    category: 'negocios',
  },
  {
    id: 'financas-1',
    title: 'Separando conta pessoal e empresarial',
    explanation:
      'Misturar dinheiro pessoal com o do negócio é o erro número 1 de prestadores de serviço. Separe as contas!',
    example:
      'Abra uma conta PJ (MEI é grátis em vários bancos). Pague-se um "salário" fixo todo mês.',
    application:
      'Defina quanto é seu salário mensal e só retire esse valor. O resto fica no negócio.',
    category: 'financas',
  },
];

// ─── Keyword → Category Mapping ──────────────────────────────────────────────

const KEYWORD_MAP: { keywords: string[]; category: MentorCategory }[] = [
  { keywords: ['margem', 'lucro', 'rentabilidade', 'lucratividade'], category: 'margem' },
  { keywords: ['preço', 'preco', 'precificar', 'formar preço', 'formação', 'calcular'], category: 'formacao_preco' },
  { keywords: ['calculadora', 'repasse', 'venda', 'ferramenta', 'plataforma'], category: 'formacao_preco' },
  { keywords: ['praça', 'praca', 'região', 'replicar', 'replicação', 'correlação'], category: 'concorrencia' },
  { keywords: ['custo', 'gasto', 'despesa', 'fixo', 'variavel', 'variável'], category: 'custos' },
  { keywords: ['concorrente', 'concorrência', 'mercado', 'competidor'], category: 'concorrencia' },
  { keywords: ['psicológico', 'psicologico', '99', '9,90', 'percepção'], category: 'psicologico' },
  { keywords: ['sazonalidade', 'época', 'temporada', 'estação', 'verão', 'inverno'], category: 'sazonalidade' },
  { keywords: ['elasticidade', 'demanda', 'sensibilidade', 'inelástico'], category: 'elasticidade' },
  { keywords: ['fluxo', 'caixa', 'recebimento', 'pagamento'], category: 'fluxo_caixa' },
  { keywords: ['simular', 'simulação', 'simulacao', 'se eu', 'e se', 'aumentar', 'diminuir'], category: 'simulacao' },
  { keywords: ['estratégia', 'estrategia', 'crescer', 'escalar', 'expandir', 'plano'], category: 'estrategia' },
  { keywords: ['imposto', 'mei', 'nota fiscal', 'cnpj', 'tributação', 'inss'], category: 'financas' },
  { keywords: ['investimento', 'investir', 'reserva', 'poupar', 'roi', 'retorno'], category: 'financas' },
  { keywords: ['cliente', 'marketing', 'vender', 'divulgar', 'negociar', 'desconto'], category: 'negocios' },
  { keywords: ['inflação', 'economia', 'recessão', 'crise', 'pib'], category: 'mercado' },
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

// ─── Quick Actions ────────────────────────────────────────────────────────────

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'qa-1', label: 'Calcular margem', emoji: '📊', message: 'Como calcular minha margem de lucro?', category: 'margem' },
  { id: 'qa-2', label: 'Formar preço', emoji: '🎯', message: 'Como formar o preço do meu serviço?', category: 'formacao_preco' },
  { id: 'qa-3', label: 'Custos ocultos', emoji: '👻', message: 'Quais custos eu posso estar esquecendo?', category: 'custos' },
  { id: 'qa-4', label: 'Concorrência', emoji: '🔍', message: 'Como me posicionar frente à concorrência?', category: 'concorrencia' },
  { id: 'qa-5', label: 'Negociação', emoji: '🤝', message: 'Como negociar sem perder margem?', category: 'negocios' },
  { id: 'qa-6', label: 'Crescer', emoji: '🚀', message: 'Qual a melhor estratégia para crescer?', category: 'estrategia' },
  { id: 'qa-7', label: 'Usar calculadora', emoji: '🧮', message: 'Como funciona a calculadora de pricing?', category: 'formacao_preco' },
  { id: 'qa-8', label: 'Comparar praças', emoji: '🗺️', message: 'Como comparar preços entre praças?', category: 'concorrencia' },
];

// ─── Response Generator ───────────────────────────────────────────────────────

const GREETING_RESPONSES = [
  'Olá! 👋 Sou o **Pricing Mentor**, seu assistente inteligente de precificação.\n\nPosso te ajudar com:\n🎯 Preços e margem\n💰 Custos e finanças\n🔍 Concorrência e mercado\n🚀 Estratégia de negócio\n🧠 Qualquer dúvida geral!\n\nComo posso te ajudar hoje?',
  'E aí! 😊 Sou o **Pricing Mentor**, seu parceiro de precificação.\n\nPergunte sobre preços, margem, custos, estratégia ou qualquer dúvida — estou aqui pra te ajudar a ganhar mais!\n\nO que precisa?',
  'Opa! 🎯 Sou o **Pricing Mentor** e estou pronto pra te ajudar.\n\nPosso responder sobre precificação, negócios, finanças, mercado e muito mais.\n\n💡 Dica: use os botões rápidos abaixo ou me pergunte qualquer coisa!',
];

const NUDGE_MESSAGES: MentorNudge[] = [
  // ─── Warnings ─────────────────────────────────────────────────────────
  {
    id: 'nudge-low-margin',
    type: 'warning',
    message: 'Sua margem está abaixo de 20%. Isso pode não cobrir seus custos fixos. Quer ajuda pra ajustar?',
    timestamp: Date.now(),
    dismissed: false,
    actionLabel: 'Ajustar margem',
  },
  // ─── Tips ─────────────────────────────────────────────────────────────
  {
    id: 'nudge-psychological',
    type: 'tip',
    message: 'Dica: use preço psicológico! Em vez de R$200, tente R$197 ou R$199,90. A percepção muda muito. 🧠',
    timestamp: Date.now(),
    dismissed: false,
  },
  {
    id: 'nudge-cost-reminder',
    type: 'tip',
    message: 'Lembrete: custos de deslocamento, ferramentas e tempo são frequentemente esquecidos na precificação. 👻',
    timestamp: Date.now(),
    dismissed: false,
  },
  {
    id: 'nudge-valor-agregado',
    type: 'tip',
    message: 'Dica: adicionar garantia e pós-serviço pode justificar preços 20-30% maiores! 💎',
    timestamp: Date.now(),
    dismissed: false,
  },
  // ─── Provocations (Behavioral Nudges) ──────────────────────────────────
  {
    id: 'nudge-provocation-1',
    type: 'provocation',
    message: 'Você está ganhando dinheiro ou só vendendo? 🤔',
    timestamp: Date.now(),
    dismissed: false,
    actionLabel: 'Analisar margem',
  },
  {
    id: 'nudge-provocation-2',
    type: 'provocation',
    message: 'Se aumentar 10%, seu cliente realmente deixaria de comprar? 📈',
    timestamp: Date.now(),
    dismissed: false,
    actionLabel: 'Simular aumento',
  },
  {
    id: 'nudge-provocation-3',
    type: 'provocation',
    message: 'Você conhece sua margem ideal? A maioria dos prestadores não conhece... 🎯',
    timestamp: Date.now(),
    dismissed: false,
    actionLabel: 'Descobrir agora',
  },
  {
    id: 'nudge-provocation-4',
    type: 'provocation',
    message: 'Se vender mais com esse preço, você lucra ou perde? Nem sempre mais vendas = mais lucro. 💡',
    timestamp: Date.now(),
    dismissed: false,
    actionLabel: 'Entender por quê',
  },
  {
    id: 'nudge-provocation-5',
    type: 'provocation',
    message: 'Quanto vale sua hora de trabalho? Se não sabe, pode estar cobrando pouco... ⏰',
    timestamp: Date.now(),
    dismissed: false,
    actionLabel: 'Calcular agora',
  },
  // ─── Questions ────────────────────────────────────────────────────────
  {
    id: 'nudge-question-1',
    type: 'question',
    message: 'Já revisou seus preços este mês? A inflação pode estar comendo sua margem sem você perceber. 📊',
    timestamp: Date.now(),
    dismissed: false,
    actionLabel: 'Revisar preços',
  },
  {
    id: 'nudge-question-2',
    type: 'question',
    message: 'Sabia que uma micro aula de 2 minutos pode mudar sua forma de precificar? 📚',
    timestamp: Date.now(),
    dismissed: false,
    actionLabel: 'Aprender agora',
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

/**
 * Generate a response using the AI service (async, with fallback).
 */
export async function generateResponseAsync(
  userText: string,
  context?: PricingAnalysisContext,
): Promise<MentorMessage> {
  return generateAIResponse(userText, context);
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
  if (newMargin < 0) {
    recommendation = '🚨 PERIGO! Margem negativa! Você está pagando pra trabalhar. Revise urgentemente.';
  } else if (newMargin < 15) {
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
