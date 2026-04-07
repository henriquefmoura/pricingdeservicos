export interface MentorMessage {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  timestamp: number;
  category?: MentorCategory;
  isLoading?: boolean;
}

export type MentorCategory =
  | 'margem'
  | 'formacao_preco'
  | 'custos'
  | 'concorrencia'
  | 'psicologico'
  | 'sazonalidade'
  | 'elasticidade'
  | 'fluxo_caixa'
  | 'simulacao'
  | 'estrategia'
  | 'financas'
  | 'mercado'
  | 'negocios'
  | 'geral';

export type MentorExpression = 'happy' | 'thinking' | 'alert' | 'wink' | 'surprised' | 'pointing';

export interface MentorNudge {
  id: string;
  type: 'warning' | 'tip' | 'question' | 'alert' | 'provocation';
  message: string;
  timestamp: number;
  dismissed: boolean;
  actionLabel?: string;
  context?: string;
}

export interface MicroLesson {
  id: string;
  title: string;
  explanation: string;
  example: string;
  application: string;
  category: MentorCategory;
}

export interface SimulationResult {
  currentPrice: number;
  newPrice: number;
  currentMargin: number;
  newMargin: number;
  currentProfit: number;
  newProfit: number;
  percentChange: number;
  recommendation: string;
}

export interface PricingAnalysisContext {
  serviceCode?: string;
  serviceName?: string;
  currentPrice?: number;
  costPrice?: number;
  margin?: number;
  competitorPrice?: number;
  plaza?: string;
}

export type UserLevel = 'iniciante' | 'intermediario' | 'avancado';

export interface UserBehavior {
  topicFrequency: Partial<Record<MentorCategory, number>>;
  totalQuestions: number;
  lastActiveTimestamp: number;
  preferredTopics: MentorCategory[];
  sessionCount: number;
}

export interface QuickAction {
  id: string;
  label: string;
  emoji: string;
  message: string;
  category: MentorCategory;
}
