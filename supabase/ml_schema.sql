-- ============================================================================
-- ML Pricing Schema — Tabelas para o sistema de sugestão de preço por ML
-- ============================================================================
-- Execute este arquivo no seu projeto Supabase após o schema.sql principal.
-- ============================================================================

-- ─── 1. Snapshots de dados de vendas (upload semanal do master) ──────────────

CREATE TABLE IF NOT EXISTS public.ml_sales_snapshots (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by         TEXT NOT NULL,
  semana_referencia   DATE NOT NULL,
  row_count           INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.ml_sales_snapshots ENABLE ROW LEVEL SECURITY;

-- Todos podem ler; só o master insere/exclui
CREATE POLICY ml_snapshots_select ON public.ml_sales_snapshots FOR SELECT USING (true);
CREATE POLICY ml_snapshots_insert ON public.ml_sales_snapshots FOR INSERT WITH CHECK (auth.user_role() = 'master');
CREATE POLICY ml_snapshots_delete ON public.ml_sales_snapshots FOR DELETE USING (auth.user_role() = 'master');

-- ─── 2. Linhas de dados de vendas ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ml_sales_rows (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_id               UUID NOT NULL REFERENCES public.ml_sales_snapshots(id) ON DELETE CASCADE,
  grupo_servico             TEXT NOT NULL,
  plaza                     TEXT NOT NULL,
  semana                    DATE NOT NULL,
  total_os                  INTEGER NOT NULL DEFAULT 0,
  os_convertidas            INTEGER NOT NULL DEFAULT 0,
  taxa_conversao            NUMERIC(6,4) NOT NULL DEFAULT 0,
  adesoes                   INTEGER NOT NULL DEFAULT 0,
  taxa_adesao               NUMERIC(6,4) NOT NULL DEFAULT 0,
  preco_medio_venda         NUMERIC(12,2) NOT NULL DEFAULT 0,
  preco_medio_repasse       NUMERIC(12,2) NOT NULL DEFAULT 0,
  prestadores_ativos        INTEGER NOT NULL DEFAULT 0,
  rede_concorrentes         INTEGER NOT NULL DEFAULT 0,
  capacidade_compra_regional SMALLINT NOT NULL DEFAULT 3 CHECK (capacidade_compra_regional BETWEEN 1 AND 5),
  receita_total             NUMERIC(14,2),
  observacoes               TEXT
);

ALTER TABLE public.ml_sales_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY ml_sales_rows_select ON public.ml_sales_rows FOR SELECT USING (true);
CREATE POLICY ml_sales_rows_insert ON public.ml_sales_rows FOR INSERT WITH CHECK (auth.user_role() = 'master');
CREATE POLICY ml_sales_rows_delete ON public.ml_sales_rows FOR DELETE USING (auth.user_role() = 'master');

CREATE INDEX IF NOT EXISTS ml_sales_rows_group_plaza ON public.ml_sales_rows (grupo_servico, plaza);
CREATE INDEX IF NOT EXISTS ml_sales_rows_semana ON public.ml_sales_rows (semana DESC);

-- ─── 3. Sugestões de preço geradas (auditoria) ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.ml_price_suggestions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  grupo_servico       TEXT NOT NULL,
  plaza               TEXT NOT NULL,
  code_id             UUID REFERENCES public.pricing_codes(id) ON DELETE SET NULL,
  suggested_venda     NUMERIC(12,2) NOT NULL,
  suggested_repasse   NUMERIC(12,2) NOT NULL,
  venda_min           NUMERIC(12,2) NOT NULL,
  venda_max           NUMERIC(12,2) NOT NULL,
  confidence          SMALLINT NOT NULL,
  confidence_level    TEXT NOT NULL CHECK (confidence_level IN ('baixa', 'media', 'alta')),
  estimated_margem    NUMERIC(8,4),
  historico_semanas   INTEGER NOT NULL DEFAULT 0,
  key_factors         JSONB
);

ALTER TABLE public.ml_price_suggestions ENABLE ROW LEVEL SECURITY;

-- Master e admin podem ver; só o sistema (via service role) insere
CREATE POLICY ml_suggestions_select ON public.ml_price_suggestions FOR SELECT USING (
  auth.user_role() IN ('master', 'admin')
);
CREATE POLICY ml_suggestions_insert ON public.ml_price_suggestions FOR INSERT WITH CHECK (
  auth.user_role() IN ('master', 'admin')
);

-- ─── 4. Logs de comportamento dos usuários ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ml_behavior_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id             TEXT NOT NULL,
  user_name           TEXT NOT NULL,
  plaza               TEXT NOT NULL,
  grupo_servico       TEXT NOT NULL,
  code_id             UUID REFERENCES public.pricing_codes(id) ON DELETE SET NULL,
  action              TEXT NOT NULL CHECK (action IN ('suggestion_used', 'suggestion_overridden', 'suggestion_ignored')),
  suggested_venda     NUMERIC(12,2) NOT NULL,
  suggested_repasse   NUMERIC(12,2) NOT NULL,
  actual_venda        NUMERIC(12,2),
  actual_repasse      NUMERIC(12,2),
  venda_delta_percent NUMERIC(8,4)
);

ALTER TABLE public.ml_behavior_logs ENABLE ROW LEVEL SECURITY;

-- Master vê todos; admin vê sua praça
CREATE POLICY ml_behavior_select ON public.ml_behavior_logs FOR SELECT USING (
  auth.user_role() = 'master' OR plaza = auth.user_plaza()
);
CREATE POLICY ml_behavior_insert ON public.ml_behavior_logs FOR INSERT WITH CHECK (
  auth.user_role() IN ('master', 'admin')
);

CREATE INDEX IF NOT EXISTS ml_behavior_plaza_grupo ON public.ml_behavior_logs (plaza, grupo_servico);
CREATE INDEX IF NOT EXISTS ml_behavior_timestamp ON public.ml_behavior_logs (timestamp DESC);

-- ─── 5. Pesos adaptativos armazenados por grupo × praça ──────────────────────

CREATE TABLE IF NOT EXISTS public.ml_weights (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_servico           TEXT NOT NULL,
  plaza                   TEXT NOT NULL,
  w_historico_preco       NUMERIC(5,4) NOT NULL DEFAULT 0.35,
  w_conversao             NUMERIC(5,4) NOT NULL DEFAULT 0.20,
  w_adesao                NUMERIC(5,4) NOT NULL DEFAULT 0.15,
  w_prestadores           NUMERIC(5,4) NOT NULL DEFAULT 0.10,
  w_concorrentes          NUMERIC(5,4) NOT NULL DEFAULT 0.10,
  w_capacidade_compra     NUMERIC(5,4) NOT NULL DEFAULT 0.10,
  bias_correcao           NUMERIC(6,4) NOT NULL DEFAULT 0,
  n_samples               INTEGER NOT NULL DEFAULT 0,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (grupo_servico, plaza)
);

ALTER TABLE public.ml_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY ml_weights_select ON public.ml_weights FOR SELECT USING (true);
CREATE POLICY ml_weights_upsert ON public.ml_weights FOR ALL USING (auth.user_role() = 'master');
