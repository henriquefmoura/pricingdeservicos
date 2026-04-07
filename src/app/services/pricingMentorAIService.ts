/**
 * Pricing Mentor AI Service
 *
 * Architecture for connecting to an external AI model (e.g. OpenAI GPT-4).
 * Falls back to a rich local knowledge engine when no API key is configured.
 *
 * To enable external AI:
 *   1. Set VITE_OPENAI_API_KEY in your .env
 *   2. The service will automatically use the external model
 */

import type { MentorMessage, MentorCategory, PricingAnalysisContext, UserLevel } from '../types/pricingMentor';

// ─── Configuration ────────────────────────────────────────────────────────────

const AI_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_API_KEY) || '';
const AI_MODEL = 'gpt-4';
const AI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `Você é o Pricing Mentor, um assistente inteligente especializado em precificação de serviços.

Personalidade:
- Tom: simples, humano, direto e acessível
- Estilo: professor + amigo + mentor de negócios
- Comunicação: sem termos complexos, sempre explicando com exemplos reais
- Proativo: antecipa dúvidas e provoca reflexões
- Nunca julga o usuário
- Sempre orienta para melhorar decisões

Você pode responder sobre:
1. Precificação e formação de preços
2. Margem de lucro e rentabilidade
3. Custos fixos e variáveis
4. Concorrência e posicionamento
5. Fluxo de caixa
6. Estratégia de negócios
7. Finanças básicas
8. Marketing e vendas
9. Economia e mercado
10. Qualquer dúvida geral do usuário

Regras:
- Sempre simplificar a explicação
- Usar exemplos práticos do dia a dia
- Conectar teoria com prática
- Quando possível, usar dados do contexto do usuário
- Usar emojis com moderação para tornar a conversa mais amigável
- Ser encorajador e positivo`;

// ─── Broad Knowledge Base (Local Fallback) ────────────────────────────────────

interface KnowledgeEntry {
  patterns: string[];
  responses: string[];
  category: MentorCategory;
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ─── Pricing & Margin ─────────────────────────────────────────────────
  {
    patterns: ['o que é margem', 'margem de lucro', 'como calcular margem', 'margem ideal'],
    responses: [
      '📊 **Margem de lucro** é a porcentagem do preço que sobra como lucro depois de pagar todos os custos.\n\n**Fórmula:** Margem = (Preço - Custo) / Preço × 100\n\n**Exemplo:** Se você cobra R$200 e seu custo é R$140:\nMargem = (200 - 140) / 200 × 100 = **30%**\n\n🎯 O ideal para serviços é ter uma margem entre **25% e 40%**. Abaixo de 20% é perigoso — pode não cobrir seus custos fixos.',
      '💚 Margem de lucro é o que sobra pra VOCÊ depois de pagar tudo.\n\nPense assim: de cada R$100 que entra, quanto realmente é seu?\n\nSe sua margem é 30%, a cada R$100 você ganha R$30.\n\nDica: muitos prestadores de serviço trabalham com margem de 10-15% achando que está bom, mas esquecem dos custos invisíveis (desgaste de ferramentas, tempo de deslocamento, impostos).\n\n🎯 **Meta:** busque pelo menos 30% de margem.',
    ],
    category: 'margem',
  },
  {
    patterns: ['margem negativa', 'prejuízo', 'perdendo dinheiro', 'vendendo abaixo do custo'],
    responses: [
      '🚨 **Margem negativa é sinal de perigo!** Significa que você está pagando pra trabalhar.\n\nIsso acontece quando:\n1. Você não calculou todos os custos\n2. Deu desconto demais\n3. O preço foi copiado da concorrência sem analisar SEUS custos\n\n**O que fazer:**\n- Revise todos os custos (material + mão de obra + deslocamento + fixos)\n- Recalcule o preço mínimo\n- Não tenha medo de ajustar\n\n💡 É melhor perder um cliente que não paga o justo do que trabalhar no prejuízo.',
    ],
    category: 'margem',
  },
  {
    patterns: ['como formar preço', 'como precificar', 'formação de preço', 'calcular preço', 'quanto cobrar'],
    responses: [
      '🎯 **Formação de preço em 4 passos:**\n\n**1. Some todos os custos:**\n- Material direto\n- Mão de obra (sua hora de trabalho)\n- Deslocamento\n- Custos fixos proporcionais\n\n**2. Defina sua margem desejada** (ex: 35%)\n\n**3. Aplique a fórmula:**\nPreço = Custo Total ÷ (1 - Margem)\nExemplo: R$100 ÷ (1 - 0,35) = **R$153,85**\n\n**4. Compare com o mercado:**\nSe está muito acima, veja onde reduzir custos.\nSe está abaixo, ótimo — mais margem pra você!\n\n💡 Nunca chute preço. Sempre calcule.',
      '💰 Precificar parece complicado, mas é simples:\n\n**Custo + Lucro = Preço**\n\nO segredo está em conhecer TODOS os seus custos:\n✅ Material\n✅ Hora de trabalho\n✅ Transporte/deslocamento\n✅ Desgaste de ferramentas\n✅ Parte dos custos fixos (aluguel, internet, etc.)\n✅ Impostos\n\nSome tudo → adicione a margem que quer → pronto!\n\nDica: se for difícil calcular hora de trabalho, faça assim:\nSalário desejado mensal ÷ horas trabalhadas no mês = Valor/hora.\n\nExemplo: R$6.000 ÷ 176h = **R$34,09/hora**',
    ],
    category: 'formacao_preco',
  },
  // ─── Costs ─────────────────────────────────────────────────────────────
  {
    patterns: ['custo fixo', 'custo variável', 'custos fixos e variáveis', 'tipos de custo'],
    responses: [
      '🏗️ **Custos fixos vs variáveis:**\n\n**Fixos** — não mudam com a quantidade de serviços:\n- Aluguel: R$1.500/mês\n- Internet/telefone: R$200/mês\n- Seguro: R$150/mês\n- Ferramentas (depreciação)\n\n**Variáveis** — mudam conforme o trabalho:\n- Material direto\n- Combustível/transporte\n- Ajudantes eventuais\n\n**Dica de ouro:** divida seus custos fixos mensais pela quantidade de serviços que faz no mês.\n\nExemplo: R$2.000 de custos fixos ÷ 20 serviços = **R$100 de custo fixo por serviço**\n\nIsso precisa estar no seu preço!',
    ],
    category: 'custos',
  },
  {
    patterns: ['custo invisível', 'custos ocultos', 'custos que esqueço', 'esqueço de incluir'],
    responses: [
      '👻 **Custos invisíveis que comem sua margem:**\n\n1. **Tempo de deslocamento** — ir e voltar é trabalho!\n2. **Desgaste de ferramentas** — furadeira, serra, etc.\n3. **Tempo de orçamento** — horas visitando clientes\n4. **Retrabalho** — quando precisa voltar\n5. **Impostos** — MEI, INSS, ISS\n6. **Inadimplência** — clientes que não pagam\n7. **Ociosidade** — dias sem trabalho\n8. **Manutenção do veículo** — se usa carro/moto\n\n💡 Dica: adicione 10-15% ao custo total como "margem de segurança" para cobrir esses custos ocultos.',
    ],
    category: 'custos',
  },
  // ─── Competition ───────────────────────────────────────────────────────
  {
    patterns: ['concorrência', 'concorrente', 'preço do mercado', 'preço da concorrência', 'competidor'],
    responses: [
      '🔍 **Usar a concorrência a seu favor:**\n\n1. **Pesquise preços** de pelo menos 3-5 concorrentes\n2. **Posicione-se:** não precisa ser o mais barato\n3. **Diferencie-se:** qualidade, prazo, atendimento, garantia\n\n**Exemplo:**\nMercado cobra R$150 a R$200.\nVocê pode cobrar R$190 oferecendo:\n✅ Garantia de 6 meses\n✅ Pontualidade\n✅ Limpeza pós-serviço\n\n💡 Preço baixo atrai cliente que só quer preço baixo. Preço justo com valor agregado atrai clientes melhores que pagam sem reclamar.\n\n**Lembre:** preço mais barato ≠ mais clientes ≠ mais lucro',
    ],
    category: 'concorrencia',
  },
  // ─── Psychology ────────────────────────────────────────────────────────
  {
    patterns: ['preço psicológico', 'terminar em 9', 'percepção de preço', 'preço atrativo'],
    responses: [
      '🧠 **Precificação psicológica funciona mesmo!**\n\nO cérebro humano lê preços da esquerda pra direita:\n- R$200,00 → "duzentos reais"\n- R$197,00 → "cento e noventa e poucos"\n\nA diferença é de R$3, mas a percepção muda muito!\n\n**Técnicas que funcionam:**\n\n1. **Preço .97 ou .99:** R$297 parece bem menos que R$300\n2. **Ancoragem:** mostre o preço "cheio" riscado e o novo preço\n3. **Pacotes:** em vez de cobrar por item, venda pacotes\n4. **Parcelamento:** "10x de R$29,90" parece mais leve que R$299\n\n🎯 Teste: mude um serviço de R$200 pra R$197 e observe a reação dos clientes.',
    ],
    category: 'psicologico',
  },
  // ─── Seasonality ───────────────────────────────────────────────────────
  {
    patterns: ['sazonalidade', 'época do ano', 'alta temporada', 'baixa temporada', 'demanda sazonal'],
    responses: [
      '📅 **Sazonalidade — ajuste preços conforme a demanda:**\n\n**Alta demanda (preço sobe 10-20%):**\n- Verão: ar-condicionado, piscinas, pinturas\n- Fim de ano: reformas, instalações\n- Pré-mudança: consertos gerais\n\n**Baixa demanda (promoções estratégicas):**\n- Inverno: manutenção preventiva com desconto\n- Início do ano: pacotes de fidelidade\n\n**Estratégia:**\n1. Em alta demanda → aumente preços naturalmente\n2. Em baixa demanda → ofereça pacotes com desconto leve\n3. Nunca dê desconto "porque sim" → sempre vincule a um benefício\n\n💡 Lembre: alta demanda + seu tempo limitado = você pode (e deve) cobrar mais!',
    ],
    category: 'sazonalidade',
  },
  // ─── Cash Flow ─────────────────────────────────────────────────────────
  {
    patterns: ['fluxo de caixa', 'dinheiro entrando', 'recebimento', 'pagamento', 'caixa'],
    responses: [
      '💰 **Fluxo de caixa — o termômetro do seu negócio:**\n\nLucro no papel ≠ dinheiro no bolso!\n\n**Exemplo:**\nVocê faturou R$10.000 no mês.\nMas só recebeu R$6.000 (o resto é a prazo).\nSeus custos são R$7.000.\nResultado: faltou R$1.000! 😰\n\n**Dicas práticas:**\n1. **Peça entrada** — 50% na contratação, 50% na entrega\n2. **Evite prazos longos** — 30 dias no máximo\n3. **Use planilha simples** — anote toda entrada e saída\n4. **Reserve fundo** — guarde 10% de tudo que recebe\n5. **Cobre inadimplentes** — não tenha vergonha\n\n🎯 Regra de ouro: dinheiro na conta > nota promissória',
    ],
    category: 'fluxo_caixa',
  },
  // ─── Elasticity ────────────────────────────────────────────────────────
  {
    patterns: ['elasticidade', 'sensibilidade a preço', 'aumentar preço', 'subir preço', 'cliente vai aceitar'],
    responses: [
      '📈 **Elasticidade de preço — quando subir sem perder clientes:**\n\nServiço **inelástico** (pode subir):\n- Urgências (encanador no domingo)\n- Especializado (poucos fazem)\n- Sem alternativa fácil\n\nServiço **elástico** (cuidado ao subir):\n- Muitos concorrentes\n- Fácil de substituir\n- Cliente compara bastante\n\n**Teste gradual:**\n1. Suba 5% em serviços inelásticos\n2. Monitore por 1 mês\n3. Se a demanda se manteve → suba mais 5%\n4. Repita até encontrar o ponto ideal\n\n💡 Se aumentar 10% e perder só 5% dos clientes, você GANHA mais dinheiro no total!\n\nFaça as contas: 90 clientes × R$110 = R$9.900\nvs 100 clientes × R$100 = R$10.000\n\nA diferença é mínima, mas o esforço é menor!',
    ],
    category: 'elasticidade',
  },
  // ─── Strategy ──────────────────────────────────────────────────────────
  {
    patterns: ['estratégia', 'como crescer', 'plano de negócio', 'planejamento', 'escalar', 'expandir'],
    responses: [
      '🚀 **Estratégia para crescer com precificação inteligente:**\n\n**1. Especialização**\nEscolha 2-3 serviços que dão mais margem e foque neles.\n\n**2. Posicionamento Premium**\nNão compita por preço baixo. Compita por valor:\n- Garantia\n- Pontualidade\n- Atendimento\n- Pós-serviço\n\n**3. Receita Recorrente**\nCrie planos de manutenção mensal (ex: R$150/mês).\nIsso gera previsibilidade no caixa.\n\n**4. Escala**\n- Contrate ajudantes conforme cresce\n- Padronize processos\n- Documente tudo\n\n**5. Presença Online**\n- Google Meu Negócio (grátis)\n- Fotos de antes/depois\n- Depoimentos de clientes\n\n💡 Crescer não é fazer mais do mesmo. É fazer melhor e cobrar mais.',
    ],
    category: 'estrategia',
  },
  {
    patterns: ['valor agregado', 'como justificar preço', 'cobrar mais caro', 'diferenciar'],
    responses: [
      '💎 **Como agregar valor e cobrar mais:**\n\n**O que justifica preço maior?**\n1. **Garantia** — "Se der problema em 6 meses, volto de graça"\n2. **Pontualidade** — Chegar na hora combinada\n3. **Limpeza** — Deixar o ambiente limpo após o serviço\n4. **Comunicação** — Avisar o cliente sobre cada etapa\n5. **Fotos** — Mostrar antes e depois\n6. **Orçamento detalhado** — Transparência total\n7. **Uniforme/identificação** — Passar profissionalismo\n\n📌 **Exemplo real:**\nDois eletricistas fazem o mesmo serviço.\nUm cobra R$150, chega atrasado, não limpa.\nOutro cobra R$250, é pontual, limpa tudo, dá garantia.\n\nQual você contrataria? 😊\n\n🎯 Valor percebido > Preço cobrado',
    ],
    category: 'estrategia',
  },
  // ─── Finance ───────────────────────────────────────────────────────────
  {
    patterns: ['imposto', 'mei', 'nota fiscal', 'cnpj', 'tributação', 'inss'],
    responses: [
      '📋 **Impostos e formalização — o básico:**\n\n**MEI (Microempreendedor Individual):**\n- Faturamento até R$81.000/ano\n- Taxa fixa mensal: ~R$70\n- Pode emitir nota fiscal\n- Tem CNPJ\n\n**Simples Nacional (ME):**\n- Faturamento até R$360.000/ano (ME)\n- Alíquota inicial: 6-15% dependendo do serviço\n\n**Dica para precificação:**\nSempre inclua o imposto no seu preço!\n\nExemplo MEI:\nCusto do serviço: R$100\nImposto estimado: R$5\nCusto real: R$105\nPreço com margem 30%: R$105 ÷ 0,70 = R$150\n\n⚠️ Muitos esquecem de incluir impostos no preço e acabam pagando do próprio bolso.',
    ],
    category: 'financas',
  },
  {
    patterns: ['investimento', 'investir', 'guardar dinheiro', 'reserva', 'poupar'],
    responses: [
      '🏦 **Finanças pessoais para prestadores de serviço:**\n\n**Regra 50-30-20 adaptada:**\n- **50%** para custos do negócio (material, transporte)\n- **30%** para você (salário, despesas pessoais)\n- **20%** para reserva + investimento\n\n**Reserva de emergência:**\nGuarde o equivalente a 3-6 meses de custos fixos.\nIsso te protege em meses fracos.\n\n**Investir no negócio:**\n- Ferramentas novas = mais eficiência\n- Curso técnico = cobra mais caro\n- Marketing = mais clientes\n\n💡 Dica: separe conta pessoal da conta do negócio. Isso muda completamente sua organização financeira.',
    ],
    category: 'financas',
  },
  // ─── Market ────────────────────────────────────────────────────────────
  {
    patterns: ['inflação', 'economia', 'recessão', 'crise', 'mercado atual'],
    responses: [
      '📊 **Como o cenário econômico afeta seus preços:**\n\n**Em tempos de inflação alta:**\n- Reajuste preços pelo menos a cada 3-6 meses\n- Use índices como IPCA como referência\n- Comunique ao cliente: "Reajuste anual de X% para manter a qualidade"\n\n**Em recessão:**\n- Não baixe preços desesperadamente\n- Crie pacotes mais acessíveis\n- Foque em serviços essenciais\n- Ofereça parcelamento\n\n**Em crescimento econômico:**\n- Momento de aumentar preços\n- Investir em marketing\n- Expandir serviços\n\n💡 Regra: seus preços PRECISAM acompanhar a inflação. Se a inflação é 5% ao ano e você não reajusta, está perdendo 5% de margem.',
    ],
    category: 'mercado',
  },
  // ─── Business General ──────────────────────────────────────────────────
  {
    patterns: ['como conseguir clientes', 'marketing', 'divulgar', 'propaganda', 'vender mais'],
    responses: [
      '📢 **Como atrair mais clientes:**\n\n**Grátis e eficiente:**\n1. **Google Meu Negócio** — apareça quando alguém pesquisar\n2. **WhatsApp Business** — catálogo de serviços\n3. **Boca a boca** — peça indicações (ofereça desconto por indicação)\n4. **Fotos antes/depois** — poste em redes sociais\n5. **Avaliações** — peça para clientes avaliarem no Google\n\n**Investimento baixo:**\n1. **Instagram/Facebook** — posts semanais\n2. **Cartão de visita** — sempre tenha com você\n3. **Parcerias** — lojas de material, síndicos, imobiliárias\n\n💡 O melhor marketing é fazer um serviço excelente. Cliente satisfeito indica pra 3 pessoas. Cliente insatisfeito reclama pra 10.',
    ],
    category: 'negocios',
  },
  {
    patterns: ['negociar', 'negociação', 'cliente quer desconto', 'pechinchar', 'baixar preço'],
    responses: [
      '🤝 **Como negociar sem perder margem:**\n\n**Nunca diga "não posso dar desconto" direto.**\n\nTécnicas:\n1. **Troca:** "Posso fazer por menos se pagar à vista"\n2. **Escopo:** "Por esse valor, faço o serviço básico. O completo é X"\n3. **Pacote:** "Se fechar 3 serviços, faço 10% no total"\n4. **Prazo:** "Por esse preço, posso agendar para a próxima semana"\n\n**O que NÃO fazer:**\n❌ Baixar preço sem tirar algo\n❌ Dar desconto por medo de perder o cliente\n❌ Aceitar qualquer condição para fechar\n\n💡 Se o cliente só quer preço baixo e não valoriza qualidade, ele não é seu cliente ideal. Deixe para o concorrente!',
    ],
    category: 'negocios',
  },
  // ─── Simulation ────────────────────────────────────────────────────────
  {
    patterns: ['simular', 'simulação', 'e se', 'se eu aumentar', 'se eu diminuir', 'cenário'],
    responses: [
      '🔬 **Vamos simular!** Use a aba "Simular" para testar cenários de preço.\n\nVocê pode ver:\n- Como a margem muda se ajustar o preço\n- Quanto ganharia vendendo X unidades\n- Se um desconto vale a pena\n\n💡 Dica: sempre simule antes de mudar um preço. Melhor testar no papel do que descobrir na prática que deu errado!\n\nMe passa o preço atual, o custo e o novo preço que quer testar que eu calculo pra você.',
    ],
    category: 'simulacao',
  },
  // ─── General ───────────────────────────────────────────────────────────
  {
    patterns: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'eai', 'e aí'],
    responses: [
      'Olá! 😊 Tô aqui pra te ajudar! Pode perguntar sobre precificação, margem, custos, estratégia de negócio ou qualquer dúvida que tiver.\n\n💡 **Sugestões rápidas:**\n- "Como formar meu preço?"\n- "Minha margem está boa?"\n- "Como negociar com clientes?"',
      'E aí! 👋 Como posso te ajudar hoje?\n\nPosso te ajudar com:\n🎯 Precificação\n📊 Margem de lucro\n💰 Fluxo de caixa\n🔍 Concorrência\n🚀 Estratégia de negócio\n\nO que precisa?',
    ],
    category: 'geral',
  },
  {
    patterns: ['obrigado', 'valeu', 'brigado', 'thanks', 'agradecido'],
    responses: [
      'Por nada! 😊 Tô sempre aqui quando precisar. Lembre: decisão boa é decisão informada!\n\n💡 Tem mais alguma dúvida?',
      'Imagina! 🎯 Fico feliz em ajudar. Volte sempre que tiver dúvida sobre preço, margem ou qualquer coisa do negócio!',
    ],
    category: 'geral',
  },
  {
    patterns: ['ajuda', 'o que você faz', 'como funciona', 'o que pode fazer'],
    responses: [
      '🤖 **Sou o Pricing Mentor!** Posso te ajudar com:\n\n📊 **Precificação** — Calcular preços, margem, markup\n💰 **Finanças** — Fluxo de caixa, impostos, investimentos\n🔍 **Concorrência** — Análise de mercado, posicionamento\n📈 **Estratégia** — Crescimento, valor agregado, escala\n🧠 **Preço psicológico** — Técnicas de precificação\n📅 **Sazonalidade** — Ajustes conforme a demanda\n🔬 **Simulações** — Testar cenários de preço\n📚 **Micro aulas** — Aprenda conceitos importantes\n\n**E também posso responder perguntas gerais** sobre negócios, economia, marketing e mais!\n\n💡 Experimente perguntar algo!',
    ],
    category: 'geral',
  },
];

// ─── General Knowledge (for questions outside pricing) ────────────────────────

const GENERAL_KNOWLEDGE: KnowledgeEntry[] = [
  {
    patterns: ['o que é roi', 'retorno sobre investimento', 'roi'],
    responses: [
      '📊 **ROI — Retorno sobre Investimento:**\n\n**Fórmula:** ROI = (Ganho - Investimento) / Investimento × 100\n\n**Exemplo:** Investiu R$1.000 em marketing e gerou R$3.000 em vendas.\nROI = (3.000 - 1.000) / 1.000 × 100 = **200%**\n\nOu seja: cada R$1 investido voltou R$3.\n\n💡 Use o ROI para decidir onde investir seu dinheiro no negócio.',
    ],
    category: 'financas',
  },
  {
    patterns: ['o que é markup', 'markup', 'mark up'],
    responses: [
      '📊 **Markup vs Margem:**\n\n**Markup** é o multiplicador aplicado sobre o custo:\nPreço = Custo × Markup\n\n**Margem** é a porcentagem do preço que é lucro:\nMargem = (Preço - Custo) / Preço\n\n**Exemplo:**\nCusto: R$100\nMarkup de 2x → Preço: R$200 → Margem: 50%\nMarkup de 1.5x → Preço: R$150 → Margem: 33%\n\n⚠️ Cuidado: markup de 30% NÃO é o mesmo que margem de 30%!\nMarkup 30%: R$100 × 1.3 = R$130 → Margem real: 23%\n\n💡 Use margem para análise. Use markup para cálculo rápido.',
    ],
    category: 'formacao_preco',
  },
  {
    patterns: ['ponto de equilíbrio', 'break even', 'breakeven', 'empatar'],
    responses: [
      '⚖️ **Ponto de Equilíbrio (Break-even):**\n\nÉ quando seu faturamento cobre exatamente todos os custos. Zero lucro, zero prejuízo.\n\n**Fórmula:** PE = Custos Fixos ÷ (Preço - Custo Variável por unidade)\n\n**Exemplo:**\nCustos fixos: R$3.000/mês\nPreço do serviço: R$200\nCusto variável: R$80\n\nPE = 3.000 ÷ (200 - 80) = **25 serviços/mês**\n\nOu seja: precisa fazer pelo menos 25 serviços pra não ter prejuízo.\n\n💡 Tudo acima de 25 é lucro! Use isso pra definir metas.',
    ],
    category: 'financas',
  },
  {
    patterns: ['ticket médio', 'ticket medio', 'valor médio', 'media de vendas'],
    responses: [
      '🎫 **Ticket Médio:**\n\nÉ o valor médio que cada cliente gasta com você.\n\n**Fórmula:** Faturamento Total ÷ Número de Clientes\n\n**Exemplo:** Faturou R$8.000 com 40 clientes\nTicket médio = R$200\n\n**Como aumentar o ticket médio:**\n1. **Venda serviços adicionais** — "Quer que eu faça X também?"\n2. **Crie pacotes** — serviço básico + premium\n3. **Upsell** — "Por mais R$50, incluo garantia estendida"\n\n💡 Aumentar o ticket médio em 20% é mais fácil que conseguir 20% mais clientes!',
    ],
    category: 'negocios',
  },
  {
    patterns: ['o que é b2b', 'b2b', 'empresa para empresa'],
    responses: [
      '🏢 **B2B — Business to Business:**\n\nÉ quando você vende serviços para outras empresas (não para pessoas físicas).\n\n**Vantagens:**\n- Contratos maiores\n- Pagamento mais regular\n- Demanda recorrente\n\n**Como entrar no B2B:**\n1. Ofereça planos de manutenção mensal\n2. Procure condomínios e empresas\n3. Tenha CNPJ e emita nota\n4. Faça propostas profissionais\n\n💡 Um contrato B2B de manutenção mensal pode valer mais que 10 clientes avulsos.',
    ],
    category: 'negocios',
  },
];

// ─── Engine ───────────────────────────────────────────────────────────────────

let msgCounter = 0;
function createId(): string {
  msgCounter += 1;
  return `ai-${Date.now()}-${msgCounter}`;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function findBestMatch(text: string): KnowledgeEntry | undefined {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const allKnowledge = [...KNOWLEDGE_BASE, ...GENERAL_KNOWLEDGE];

  let bestMatch: KnowledgeEntry | undefined;
  let bestScore = 0;

  for (const entry of allKnowledge) {
    let score = 0;
    for (const pattern of entry.patterns) {
      const normalizedPattern = pattern.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(normalizedPattern)) {
        score += normalizedPattern.length; // longer match = better
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return bestScore > 0 ? bestMatch : undefined;
}

function getDefaultResponse(_userLevel: UserLevel): string {
  const responses = [
    '🤔 Boa pergunta! Deixa eu te explicar de um jeito simples...\n\nPosso te ajudar com precificação, margem, custos, estratégia ou qualquer dúvida de negócio.\n\n💡 Tenta me perguntar algo como:\n- "Como calcular meu preço?"\n- "O que é margem de lucro?"\n- "Como negociar com cliente?"',
    'Interessante! 🎯 Me conta mais detalhes pra eu poder te ajudar melhor.\n\nPosso responder sobre:\n📊 Preços e margem\n💰 Custos e finanças\n🔍 Concorrência\n🚀 Estratégia de negócio\n📚 Conceitos gerais',
    'Hmm, deixa eu pensar... 🤓\n\nNão encontrei uma resposta específica pra isso, mas posso te ajudar com muita coisa! Tenta reformular sua pergunta ou me pergunte sobre:\n\n- Precificação\n- Margem de lucro\n- Fluxo de caixa\n- Concorrência\n- Estratégia',
  ];
  return pickRandom(responses);
}

// ─── External AI Call ─────────────────────────────────────────────────────────

async function callExternalAI(
  userText: string,
  context?: PricingAnalysisContext,
  _userLevel?: UserLevel,
): Promise<string | null> {
  if (!AI_API_KEY) return null;

  const contextInfo = context
    ? `\nContexto do usuário: Serviço "${context.serviceName || 'N/A'}", Preço: R$${context.currentPrice ?? 'N/A'}, Custo: R$${context.costPrice ?? 'N/A'}, Margem: ${context.margin ?? 'N/A'}%, Concorrente: R$${context.competitorPrice ?? 'N/A'}, Praça: ${context.plaza || 'N/A'}`
    : '';

  try {
    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + contextInfo },
          { role: 'user', content: userText },
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate an AI-powered response. Tries external AI first, falls back to local knowledge.
 */
export async function generateAIResponse(
  userText: string,
  context?: PricingAnalysisContext,
  userLevel: UserLevel = 'iniciante',
): Promise<MentorMessage> {
  // Try external AI first
  const aiResponse = await callExternalAI(userText, context, userLevel);
  if (aiResponse) {
    return {
      id: createId(),
      role: 'mentor',
      content: aiResponse,
      timestamp: Date.now(),
      category: findBestMatch(userText)?.category || 'geral',
    };
  }

  // Fall back to local knowledge base
  const match = findBestMatch(userText);
  let content: string;

  if (match) {
    content = pickRandom(match.responses);
  } else {
    content = getDefaultResponse(userLevel);
  }

  // Enrich with platform context
  if (context) {
    content = enrichWithContext(content, context);
  }

  return {
    id: createId(),
    role: 'mentor',
    content,
    timestamp: Date.now(),
    category: match?.category || 'geral',
  };
}

function enrichWithContext(content: string, context: PricingAnalysisContext): string {
  let enriched = content;

  if (context.currentPrice && context.costPrice) {
    const margin = ((context.currentPrice - context.costPrice) / context.currentPrice) * 100;
    if (margin < 0) {
      enriched += `\n\n🚨 **ALERTA:** ${context.serviceName || 'Seu serviço'} está com margem NEGATIVA (${margin.toFixed(1)}%). Você está pagando pra trabalhar!`;
    } else if (margin < 20) {
      enriched += `\n\n⚠️ Olhando seus dados: ${context.serviceName || 'seu serviço'} tem margem de ${margin.toFixed(1)}%. O ideal é pelo menos 30%.`;
    } else if (margin >= 30) {
      enriched += `\n\n✅ ${context.serviceName || 'Seu serviço'} está com margem de ${margin.toFixed(1)}%. Saudável!`;
    }
  }

  if (context.competitorPrice && context.currentPrice) {
    const diff = ((context.competitorPrice - context.currentPrice) / context.currentPrice) * 100;
    if (diff > 10) {
      enriched += `\n\n💡 Seu concorrente cobra ${diff.toFixed(0)}% a mais. Pode ser oportunidade de aumentar seu preço!`;
    } else if (diff < -10) {
      enriched += `\n\n📊 Seu preço está ${Math.abs(diff).toFixed(0)}% acima da concorrência. Certifique-se de entregar valor que justifique.`;
    }
  }

  return enriched;
}

/**
 * Check if external AI is available
 */
export function isExternalAIAvailable(): boolean {
  return !!AI_API_KEY;
}

/**
 * Get all knowledge entries (for search/autocomplete)
 */
export function getKnowledgeTopics(): { label: string; category: MentorCategory }[] {
  return [...KNOWLEDGE_BASE, ...GENERAL_KNOWLEDGE].map((entry) => ({
    label: entry.patterns[0],
    category: entry.category,
  }));
}
