/**
 * Supabase-generated types for the Pricing de Serviços database.
 *
 * These types mirror the SQL schema defined in supabase/schema.sql and are used
 * by the Supabase JS client for type-safe queries.
 */

export type UserRole = 'master' | 'admin' | 'user';

export type PricingCodeTipo =
  | 'Visita Técnica'
  | 'Serviço'
  | 'Inst + Pague -'
  | 'Emergencial'
  | 'Complementar'
  | 'Deslocamento'
  | 'Reforma';

export type PricingCodeStatus = 'pendente' | 'em_andamento' | 'concluido';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type NotificationType =
  | 'support_request'
  | 'plaza_pricing_complete'
  | 'new_codes_to_price'
  | 'codes_from_admin'
  | 'support_reply';

export type NotificationPriority = 'low' | 'medium' | 'high';

export type SupportThreadStatus = 'open' | 'closed';

export type PriceHistoryAction = 'added' | 'removed' | 'updated';

export type PricingStrategy = 'below_market' | 'match_market' | 'above_market';

export type ActivityAction =
  | 'login'
  | 'price_set'
  | 'price_approved'
  | 'price_rejected'
  | 'analysis_viewed'
  | 'market_research';

// ─── Row types ───────────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plaza: string | null;
  created_at: string;
}

export interface DbPricingCode {
  id: string;
  grupo_servico: string | null;
  tipo: PricingCodeTipo;
  descricao: string;
  unidade: string;
  codigo_atrelado: string | null;
  codigo_avulso: string | null;
  prazo: string;
  status: PricingCodeStatus;
  created_at: string;
  created_by: string;
  target_plazas: string[] | null;
}

export interface DbPricingPrice {
  id: string;
  code_id: string;
  plaza: string;
  repasse: number;
  venda: number;
  margem: number;
  preenchido_por: string | null;
  preenchido_em: string | null;
}

export interface DbApproval {
  id: string;
  codigo: string;
  descricao: string;
  grupo: string;
  plaza: string;
  current_repasse: number;
  current_venda: number;
  current_margem: number;
  proposed_repasse: number;
  proposed_venda: number;
  proposed_margem: number;
  variation: number;
  is_new_service: boolean;
  status: ApprovalStatus;
  requested_by: string;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  comments: string | null;
}

export interface DbPriceAdjustment {
  id: string;
  approval_id: string;
  codigo: string;
  descricao: string;
  grupo: string;
  plaza: string;
  suggested_repasse: number;
  suggested_venda: number;
  suggested_margem: number;
  adjusted_repasse: number;
  adjusted_venda: number;
  adjusted_margem: number;
  variation_percent: number;
  adjusted_by: string;
  adjusted_at: string;
}

export interface DbNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  from_user_id: string;
  from_user_name: string;
  from_user_role: UserRole;
  to_role: UserRole;
  to_plaza: string | null;
  plaza: string | null;
  priority: NotificationPriority;
  read: boolean;
  created_at: string;
  metadata: Record<string, string | number> | null;
}

export interface DbSupportThread {
  id: string;
  subject: string;
  from_user_id: string;
  from_user_name: string;
  from_user_role: UserRole;
  to_role: UserRole;
  plaza: string | null;
  status: SupportThreadStatus;
  created_at: string;
  updated_at: string;
}

export interface DbSupportMessage {
  id: string;
  thread_id: string;
  from_user_id: string;
  from_user_name: string;
  from_user_role: UserRole;
  to_role: UserRole;
  to_plaza: string | null;
  message: string;
  created_at: string;
  read: boolean;
}

export interface DbActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  plaza: string;
  action: ActivityAction;
  details: string | null;
  created_at: string;
}

export interface DbMarketResearch {
  id: string;
  codigo_avulso: string;
  descricao: string;
}

export interface DbCompetitorPrice {
  id: string;
  research_id: string;
  concorrente: string;
  preco: number;
  adicionado_em: string;
  adicionado_por: string;
}

export interface DbPriceHistory {
  id: string;
  codigo_avulso: string;
  descricao: string;
  concorrente: string;
  preco: number;
  preco_anterior: number | null;
  acao: PriceHistoryAction;
  timestamp: string;
  registrado_por: string;
}

export interface DbReplicationRule {
  id: string;
  replicator_plaza: string;
  target_plazas: string[];
  is_active: boolean;
  created_at: string;
}

export interface DbPlazaCorrelation {
  id: string;
  plaza_name: string;
  score: number;
  dependent_plazas: {
    name: string;
    avgVariationRepasse: number;
    avgVariationVenda: number;
    avgVariationMargem: number;
    consistency: number;
  }[];
}

export interface DbMlSalesSnapshot {
  id: string;
  uploaded_at: string;
  uploaded_by: string;
  semana_referencia: string;
  row_count: number;
}

export interface DbMlSalesRow {
  id: string;
  snapshot_id: string;
  grupo_servico: string;
  plaza: string;
  semana: string;
  total_os: number;
  os_convertidas: number;
  taxa_conversao: number;
  adesoes: number;
  taxa_adesao: number;
  preco_medio_venda: number;
  preco_medio_repasse: number;
  prestadores_ativos: number;
  rede_concorrentes: number;
  capacidade_compra_regional: number;
  receita_total: number | null;
  observacoes: string | null;
}

export interface DbMlBehaviorLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  plaza: string;
  grupo_servico: string;
  code_id: string | null;
  action: string;
  suggested_venda: number;
  suggested_repasse: number;
  actual_venda: number | null;
  actual_repasse: number | null;
  venda_delta_percent: number | null;
}

export interface DbMlWeights {
  id: string;
  grupo_servico: string;
  plaza: string;
  w_historico_preco: number;
  w_conversao: number;
  w_adesao: number;
  w_prestadores: number;
  w_concorrentes: number;
  w_capacidade_compra: number;
  bias_correcao: number;
  n_samples: number;
  updated_at: string;
}

// ─── Database type map (for createClient<Database>) ──────────────────────────

export interface Database {
  public: {
    Tables: {
      users: { Row: DbUser; Insert: Omit<DbUser, 'created_at'>; Update: Partial<DbUser> };
      pricing_codes: { Row: DbPricingCode; Insert: Omit<DbPricingCode, 'id' | 'created_at' | 'status'>; Update: Partial<DbPricingCode> };
      pricing_prices: { Row: DbPricingPrice; Insert: Omit<DbPricingPrice, 'id'>; Update: Partial<DbPricingPrice> };
      approvals: { Row: DbApproval; Insert: Omit<DbApproval, 'id' | 'status' | 'requested_at'>; Update: Partial<DbApproval> };
      price_adjustment_log: { Row: DbPriceAdjustment; Insert: Omit<DbPriceAdjustment, 'id'>; Update: Partial<DbPriceAdjustment> };
      notifications: { Row: DbNotification; Insert: Omit<DbNotification, 'id' | 'created_at'>; Update: Partial<DbNotification> };
      support_threads: { Row: DbSupportThread; Insert: Omit<DbSupportThread, 'id' | 'created_at' | 'updated_at' | 'status'>; Update: Partial<DbSupportThread> };
      support_messages: { Row: DbSupportMessage; Insert: Omit<DbSupportMessage, 'id' | 'created_at'>; Update: Partial<DbSupportMessage> };
      activity_logs: { Row: DbActivityLog; Insert: Omit<DbActivityLog, 'id' | 'created_at'>; Update: Partial<DbActivityLog> };
      market_research: { Row: DbMarketResearch; Insert: Omit<DbMarketResearch, 'id'>; Update: Partial<DbMarketResearch> };
      competitor_prices: { Row: DbCompetitorPrice; Insert: Omit<DbCompetitorPrice, 'id'>; Update: Partial<DbCompetitorPrice> };
      price_history: { Row: DbPriceHistory; Insert: Omit<DbPriceHistory, 'id'>; Update: Partial<DbPriceHistory> };
      replication_rules: { Row: DbReplicationRule; Insert: Omit<DbReplicationRule, 'id' | 'created_at'>; Update: Partial<DbReplicationRule> };
      plaza_correlations: { Row: DbPlazaCorrelation; Insert: Omit<DbPlazaCorrelation, 'id'>; Update: Partial<DbPlazaCorrelation> };
      ml_sales_snapshots: { Row: DbMlSalesSnapshot; Insert: Omit<DbMlSalesSnapshot, 'id' | 'uploaded_at'>; Update: Partial<DbMlSalesSnapshot> };
      ml_sales_rows: { Row: DbMlSalesRow; Insert: Omit<DbMlSalesRow, 'id'>; Update: Partial<DbMlSalesRow> };
      ml_behavior_logs: { Row: DbMlBehaviorLog; Insert: Omit<DbMlBehaviorLog, 'id' | 'timestamp'>; Update: Partial<DbMlBehaviorLog> };
      ml_weights: { Row: DbMlWeights; Insert: Omit<DbMlWeights, 'id' | 'updated_at'>; Update: Partial<DbMlWeights> };
    };
  };
}
