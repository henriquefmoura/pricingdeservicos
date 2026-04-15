-- ============================================================================
-- Pricing de Serviços – Supabase Database Schema
-- ============================================================================
-- Run this file against your Supabase project to create all required tables
-- and Row-Level Security (RLS) policies.
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Helper: get current user role from JWT ─────────────────────────────────

CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'user_role',
    'user'
  );
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.user_plaza()
RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claims', true)::json->>'user_plaza';
$$ LANGUAGE SQL STABLE;

-- ─── 1. Users ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('master', 'admin', 'user')),
  plaza      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Master can see everyone; admin/user can see users in their plaza
CREATE POLICY users_select ON public.users FOR SELECT USING (
  auth.user_role() = 'master'
  OR plaza = auth.user_plaza()
  OR id = auth.uid()
);

-- Only master can insert/update/delete users
CREATE POLICY users_insert ON public.users FOR INSERT WITH CHECK (auth.user_role() = 'master');
CREATE POLICY users_update ON public.users FOR UPDATE USING (auth.user_role() = 'master');
CREATE POLICY users_delete ON public.users FOR DELETE USING (auth.user_role() = 'master');

-- ─── 2. Pricing Codes ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pricing_codes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_servico   TEXT,
  tipo            TEXT NOT NULL,
  descricao       TEXT NOT NULL,
  unidade         TEXT NOT NULL,
  codigo_atrelado TEXT,
  codigo_avulso   TEXT,
  prazo           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      TEXT NOT NULL,
  target_plazas   TEXT[]
);

ALTER TABLE public.pricing_codes ENABLE ROW LEVEL SECURITY;

-- Everyone can read pricing codes
CREATE POLICY pricing_codes_select ON public.pricing_codes FOR SELECT USING (true);

-- Only master can create/edit/delete pricing codes
CREATE POLICY pricing_codes_insert ON public.pricing_codes FOR INSERT WITH CHECK (auth.user_role() = 'master');
CREATE POLICY pricing_codes_update ON public.pricing_codes FOR UPDATE USING (auth.user_role() = 'master');
CREATE POLICY pricing_codes_delete ON public.pricing_codes FOR DELETE USING (auth.user_role() = 'master');

-- ─── 3. Pricing Prices (per plaza per code) ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pricing_prices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id         UUID NOT NULL REFERENCES public.pricing_codes(id) ON DELETE CASCADE,
  plaza           TEXT NOT NULL,
  repasse         NUMERIC(12,2) NOT NULL,
  venda           NUMERIC(12,2) NOT NULL,
  margem          NUMERIC(8,4) NOT NULL,
  preenchido_por  TEXT,
  preenchido_em   TIMESTAMPTZ,
  UNIQUE (code_id, plaza)
);

ALTER TABLE public.pricing_prices ENABLE ROW LEVEL SECURITY;

-- Master can see all; admin/user can see their plaza
CREATE POLICY pricing_prices_select ON public.pricing_prices FOR SELECT USING (
  auth.user_role() = 'master' OR plaza = auth.user_plaza()
);

-- Admin and user can set prices for their own plaza
CREATE POLICY pricing_prices_insert ON public.pricing_prices FOR INSERT WITH CHECK (
  auth.user_role() IN ('master', 'admin', 'user') AND (auth.user_role() = 'master' OR plaza = auth.user_plaza())
);
CREATE POLICY pricing_prices_update ON public.pricing_prices FOR UPDATE USING (
  auth.user_role() IN ('master', 'admin', 'user') AND (auth.user_role() = 'master' OR plaza = auth.user_plaza())
);

-- ─── 4. Approvals ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.approvals (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo            TEXT NOT NULL,
  descricao         TEXT NOT NULL,
  grupo             TEXT NOT NULL,
  plaza             TEXT NOT NULL,
  current_repasse   NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_venda     NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_margem    NUMERIC(8,4) NOT NULL DEFAULT 0,
  proposed_repasse  NUMERIC(12,2) NOT NULL,
  proposed_venda    NUMERIC(12,2) NOT NULL,
  proposed_margem   NUMERIC(8,4) NOT NULL,
  variation         NUMERIC(8,4) NOT NULL DEFAULT 0,
  is_new_service    BOOLEAN NOT NULL DEFAULT FALSE,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by      TEXT NOT NULL,
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by       TEXT,
  reviewed_at       TIMESTAMPTZ,
  comments          TEXT
);

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

-- Master sees all; admin sees own plaza
CREATE POLICY approvals_select ON public.approvals FOR SELECT USING (
  auth.user_role() = 'master' OR plaza = auth.user_plaza()
);

-- Admin/user can create approvals for their plaza
CREATE POLICY approvals_insert ON public.approvals FOR INSERT WITH CHECK (
  auth.user_role() IN ('master', 'admin', 'user') AND (auth.user_role() = 'master' OR plaza = auth.user_plaza())
);

-- Admin can approve/reject in their plaza; master can do it everywhere
CREATE POLICY approvals_update ON public.approvals FOR UPDATE USING (
  auth.user_role() = 'master' OR (auth.user_role() = 'admin' AND plaza = auth.user_plaza())
);

-- ─── 5. Price Adjustment Log (for ML) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.price_adjustment_log (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  approval_id        UUID NOT NULL REFERENCES public.approvals(id) ON DELETE CASCADE,
  codigo             TEXT NOT NULL,
  descricao          TEXT NOT NULL,
  grupo              TEXT NOT NULL,
  plaza              TEXT NOT NULL,
  suggested_repasse  NUMERIC(12,2) NOT NULL,
  suggested_venda    NUMERIC(12,2) NOT NULL,
  suggested_margem   NUMERIC(8,4) NOT NULL,
  adjusted_repasse   NUMERIC(12,2) NOT NULL,
  adjusted_venda     NUMERIC(12,2) NOT NULL,
  adjusted_margem    NUMERIC(8,4) NOT NULL,
  variation_percent  NUMERIC(8,4) NOT NULL,
  adjusted_by        TEXT NOT NULL,
  adjusted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.price_adjustment_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY adjustment_log_select ON public.price_adjustment_log FOR SELECT USING (
  auth.user_role() = 'master' OR plaza = auth.user_plaza()
);
CREATE POLICY adjustment_log_insert ON public.price_adjustment_log FOR INSERT WITH CHECK (
  auth.user_role() IN ('master', 'admin', 'user')
);

-- ─── 6. Notifications ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  from_user_id    TEXT NOT NULL,
  from_user_name  TEXT NOT NULL,
  from_user_role  TEXT NOT NULL CHECK (from_user_role IN ('master', 'admin', 'user')),
  to_role         TEXT NOT NULL CHECK (to_role IN ('master', 'admin', 'user')),
  to_plaza        TEXT,
  plaza           TEXT,
  priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata        JSONB
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users see notifications targeted at their role and optionally their plaza
CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (
  auth.user_role() = 'master'
  OR (to_role = auth.user_role() AND (to_plaza IS NULL OR to_plaza = auth.user_plaza()))
);

-- Authenticated users can create notifications
CREATE POLICY notifications_insert ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can mark their own notifications as read
CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (
  auth.user_role() = 'master'
  OR (to_role = auth.user_role() AND (to_plaza IS NULL OR to_plaza = auth.user_plaza()))
);

CREATE POLICY notifications_delete ON public.notifications FOR DELETE USING (
  auth.user_role() = 'master'
  OR (to_role = auth.user_role() AND (to_plaza IS NULL OR to_plaza = auth.user_plaza()))
);

-- ─── 7. Support Threads ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.support_threads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject         TEXT NOT NULL,
  from_user_id    TEXT NOT NULL,
  from_user_name  TEXT NOT NULL,
  from_user_role  TEXT NOT NULL CHECK (from_user_role IN ('master', 'admin', 'user')),
  to_role         TEXT NOT NULL CHECK (to_role IN ('master', 'admin', 'user')),
  plaza           TEXT,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;

-- Master sees all; others see threads they participate in
CREATE POLICY support_threads_select ON public.support_threads FOR SELECT USING (
  auth.user_role() = 'master'
  OR (from_user_role = auth.user_role() AND (plaza IS NULL OR plaza = auth.user_plaza()))
  OR (to_role = auth.user_role() AND (plaza IS NULL OR plaza = auth.user_plaza()))
);

CREATE POLICY support_threads_insert ON public.support_threads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY support_threads_update ON public.support_threads FOR UPDATE USING (
  auth.user_role() = 'master'
  OR (from_user_role = auth.user_role() AND (plaza IS NULL OR plaza = auth.user_plaza()))
  OR (to_role = auth.user_role() AND (plaza IS NULL OR plaza = auth.user_plaza()))
);
CREATE POLICY support_threads_delete ON public.support_threads FOR DELETE USING (auth.user_role() = 'master');

-- ─── 8. Support Messages ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.support_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id       UUID NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  from_user_id    TEXT NOT NULL,
  from_user_name  TEXT NOT NULL,
  from_user_role  TEXT NOT NULL CHECK (from_user_role IN ('master', 'admin', 'user')),
  to_role         TEXT NOT NULL CHECK (to_role IN ('master', 'admin', 'user')),
  to_plaza        TEXT,
  message         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read            BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Visible to thread participants
CREATE POLICY support_messages_select ON public.support_messages FOR SELECT USING (
  auth.user_role() = 'master'
  OR EXISTS (
    SELECT 1 FROM public.support_threads t
    WHERE t.id = thread_id
    AND (
      (t.from_user_role = auth.user_role() AND (t.plaza IS NULL OR t.plaza = auth.user_plaza()))
      OR (t.to_role = auth.user_role() AND (t.plaza IS NULL OR t.plaza = auth.user_plaza()))
    )
  )
);

CREATE POLICY support_messages_insert ON public.support_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY support_messages_update ON public.support_messages FOR UPDATE USING (
  auth.user_role() = 'master'
  OR to_role = auth.user_role()
);

-- ─── 9. Activity Logs ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL,
  user_name  TEXT NOT NULL,
  user_role  TEXT NOT NULL CHECK (user_role IN ('admin', 'user')),
  plaza      TEXT NOT NULL,
  action     TEXT NOT NULL,
  details    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Master can see all logs; admin/user only their plaza
CREATE POLICY activity_logs_select ON public.activity_logs FOR SELECT USING (
  auth.user_role() = 'master' OR plaza = auth.user_plaza()
);

CREATE POLICY activity_logs_insert ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── 10. Market Research ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.market_research (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_avulso  TEXT NOT NULL UNIQUE,
  descricao      TEXT NOT NULL
);

ALTER TABLE public.market_research ENABLE ROW LEVEL SECURITY;
CREATE POLICY market_research_select ON public.market_research FOR SELECT USING (true);
CREATE POLICY market_research_insert ON public.market_research FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY market_research_update ON public.market_research FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ─── 11. Competitor Prices ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.competitor_prices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  research_id     UUID NOT NULL REFERENCES public.market_research(id) ON DELETE CASCADE,
  concorrente     TEXT NOT NULL,
  preco           NUMERIC(12,2) NOT NULL,
  adicionado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  adicionado_por  TEXT NOT NULL
);

ALTER TABLE public.competitor_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY competitor_prices_select ON public.competitor_prices FOR SELECT USING (true);
CREATE POLICY competitor_prices_insert ON public.competitor_prices FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY competitor_prices_update ON public.competitor_prices FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY competitor_prices_delete ON public.competitor_prices FOR DELETE USING (auth.uid() IS NOT NULL);

-- ─── 12. Price History ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.price_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_avulso   TEXT NOT NULL,
  descricao       TEXT NOT NULL,
  concorrente     TEXT NOT NULL,
  preco           NUMERIC(12,2) NOT NULL,
  preco_anterior  NUMERIC(12,2),
  acao            TEXT NOT NULL CHECK (acao IN ('added', 'removed', 'updated')),
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  registrado_por  TEXT NOT NULL
);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY price_history_select ON public.price_history FOR SELECT USING (true);
CREATE POLICY price_history_insert ON public.price_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── 13. Replication Rules ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.replication_rules (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  replicator_plaza TEXT NOT NULL,
  target_plazas    TEXT[] NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.replication_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY replication_rules_select ON public.replication_rules FOR SELECT USING (true);
CREATE POLICY replication_rules_insert ON public.replication_rules FOR INSERT WITH CHECK (auth.user_role() = 'master');
CREATE POLICY replication_rules_update ON public.replication_rules FOR UPDATE USING (auth.user_role() = 'master');
CREATE POLICY replication_rules_delete ON public.replication_rules FOR DELETE USING (auth.user_role() = 'master');

-- ─── 14. Plaza Correlations ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.plaza_correlations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plaza_name       TEXT NOT NULL UNIQUE,
  score            NUMERIC(6,2) NOT NULL,
  dependent_plazas JSONB NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE public.plaza_correlations ENABLE ROW LEVEL SECURITY;
CREATE POLICY plaza_correlations_select ON public.plaza_correlations FOR SELECT USING (true);
CREATE POLICY plaza_correlations_insert ON public.plaza_correlations FOR INSERT WITH CHECK (auth.user_role() = 'master');
CREATE POLICY plaza_correlations_update ON public.plaza_correlations FOR UPDATE USING (auth.user_role() = 'master');

-- ─── Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_pricing_prices_code_id ON public.pricing_prices(code_id);
CREATE INDEX IF NOT EXISTS idx_pricing_prices_plaza ON public.pricing_prices(plaza);
CREATE INDEX IF NOT EXISTS idx_approvals_plaza ON public.approvals(plaza);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);
CREATE INDEX IF NOT EXISTS idx_notifications_to_role ON public.notifications(to_role);
CREATE INDEX IF NOT EXISTS idx_notifications_to_plaza ON public.notifications(to_plaza);
CREATE INDEX IF NOT EXISTS idx_support_messages_thread ON public.support_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_plaza ON public.activity_logs(plaza);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_prices_research ON public.competitor_prices(research_id);
CREATE INDEX IF NOT EXISTS idx_price_history_codigo ON public.price_history(codigo_avulso);

-- ─── Realtime ──────────────────────────────────────────────────────────────
-- Enable realtime for tables that need live updates

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.approvals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_prices;

-- ─── Seed: initial users ───────────────────────────────────────────────────
-- NOTE: In production, create users via Supabase Auth (Dashboard or CLI).
-- The users table is populated automatically via a trigger on auth.users.
-- The seed below is for reference / local development only.

-- INSERT INTO public.users (email, name, role, plaza) VALUES
--   ('master@empresa.com', 'Master', 'master', NULL),
--   ('admin.sp@empresa.com', 'Admin São Paulo', 'admin', 'SP'),
--   ('admin.rj@empresa.com', 'Admin Rio de Janeiro', 'admin', 'RJ'),
--   ('admin.mg@empresa.com', 'Admin Minas Gerais', 'admin', 'MG'),
--   ('usuario.sp@empresa.com', 'Usuário SP', 'user', 'SP'),
--   ('usuario.rj@empresa.com', 'Usuário RJ', 'user', 'RJ');
