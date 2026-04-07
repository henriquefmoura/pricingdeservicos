export interface MentorMessage {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  timestamp: number;
  category?: MentorCategory;
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
  | 'geral';

export interface MentorNudge {
  id: string;
  type: 'warning' | 'tip' | 'question' | 'alert';
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

export type UserLevel = 'iniciante' | 'avancado';
