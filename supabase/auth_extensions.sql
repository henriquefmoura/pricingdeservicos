-- ============================================================================
-- Pricing de Serviços – Auth Extensions
-- ============================================================================
-- Execute este arquivo APÓS o schema.sql principal.
--
-- Contém:
--   Etapa 4 – Hook custom_access_token: injeta user_role e user_plaza no JWT
--   Etapa 5 – Trigger on_auth_user_created: espelha auth.users → public.users
-- ============================================================================


-- ─── Etapa 4 — Hook custom_access_token ─────────────────────────────────────
-- Esta função é chamada pelo Supabase Auth toda vez que um token JWT é emitido.
-- Ela injeta user_role e user_plaza (lidos de public.users) diretamente nas
-- claims do JWT, tornando-os disponíveis via request.jwt.claims para o RLS.
--
-- REGISTRO OBRIGATÓRIO NO DASHBOARD:
--   Supabase Dashboard → Authentication → Hooks → custom_access_token
--   → selecione a função "public.custom_access_token_hook"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  claims jsonb;
  v_role  text;
  v_plaza text;
BEGIN
  -- Busca role e plaza do usuário. Se o registro ainda não existir em
  -- public.users (ex.: primeiro login antes do trigger completar), v_role
  -- ficará NULL e será substituído por 'user' via COALESCE; v_plaza ficará
  -- NULL, que é o valor esperado para usuários do tipo 'master'.
  SELECT role, plaza
    INTO v_role, v_plaza
    FROM public.users
   WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(COALESCE(v_role, 'user')));
  claims := jsonb_set(claims, '{user_plaza}', to_jsonb(v_plaza));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Permite que o Supabase Auth (supabase_auth_admin) invoque o hook
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb)
  TO supabase_auth_admin;

-- Remove acesso de roles comuns para evitar chamadas não autorizadas
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb)
  FROM authenticated, anon, public;


-- ─── Etapa 5 — Trigger handle_new_user ──────────────────────────────────────
-- Toda vez que um usuário é criado em auth.users, esta trigger insere o
-- registro correspondente em public.users, lendo os metadados informados
-- no momento do cadastro (name, user_role, user_plaza em raw_user_meta_data).
-- ON CONFLICT (id) DO NOTHING garante idempotência em caso de reexecução.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, plaza)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_role', 'user'),
    NEW.raw_user_meta_data->>'user_plaza'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
