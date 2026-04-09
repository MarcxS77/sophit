-- ============================================================
-- SCHEMA INICIAL: SaaS de Saúde, Anamnese e Performance
-- ============================================================

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: profiles
-- ============================================================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: anamneses
-- ============================================================
CREATE TABLE public.anamneses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data             JSONB NOT NULL DEFAULT '{}',
  feedback_admin   TEXT,
  status           TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'respondido')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: avaliacoes_fisicas
-- ============================================================
CREATE TABLE public.avaliacoes_fisicas (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  peso                 NUMERIC(5,2),
  altura               NUMERIC(5,2),
  medidas              JSONB DEFAULT '{}',
  -- Exemplo: {"braco_d": 35, "braco_e": 34, "cintura": 80, "quadril": 95, "coxa_d": 55, "coxa_e": 54}
  dobras_cutaneas      JSONB DEFAULT '{}',
  -- Exemplo: {"tricipital": 12, "subescapular": 14, "suprailíaca": 18, "abdominal": 20}
  percentual_gordura   FLOAT,
  massa_magra          FLOAT,
  imc                  FLOAT GENERATED ALWAYS AS (
    CASE
      WHEN altura > 0 THEN peso / ((altura / 100.0) * (altura / 100.0))
      ELSE NULL
    END
  ) STORED,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: treinos
-- ============================================================
CREATE TABLE public.treinos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id          UUID NOT NULL REFERENCES public.profiles(id),
  titulo            TEXT NOT NULL,
  descricao         TEXT,
  lista_exercicios  JSONB NOT NULL DEFAULT '[]',
  -- Exemplo: [{"nome": "Supino", "series": 4, "reps": "8-12", "carga": "60kg", "obs": "Pausa 90s"}]
  data_atribuicao   DATE NOT NULL DEFAULT CURRENT_DATE,
  ativo             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER anamneses_updated_at
  BEFORE UPDATE ON public.anamneses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TRIGGER: criar profile automaticamente ao registrar usuário
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamneses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_fisicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos          ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar role do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- RLS: profiles
-- ============================================================
-- Users: podem ver e editar apenas seu próprio perfil
CREATE POLICY "users_select_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.get_user_role() = 'admin');

CREATE POLICY "users_update_own_profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Admins: podem ler e editar todos
CREATE POLICY "admins_all_profiles"
  ON public.profiles FOR ALL
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- RLS: anamneses
-- ============================================================
-- Users: podem criar e ler apenas suas próprias
CREATE POLICY "users_select_own_anamneses"
  ON public.anamneses FOR SELECT
  USING (auth.uid() = user_id OR public.get_user_role() = 'admin');

CREATE POLICY "users_insert_own_anamneses"
  ON public.anamneses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins: podem ler, editar e deletar todas
CREATE POLICY "admins_all_anamneses"
  ON public.anamneses FOR ALL
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- RLS: avaliacoes_fisicas (SOMENTE ADMINS)
-- ============================================================
CREATE POLICY "only_admins_avaliacoes"
  ON public.avaliacoes_fisicas FOR ALL
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- RLS: treinos
-- ============================================================
-- Users: podem apenas ler seus próprios treinos
CREATE POLICY "users_select_own_treinos"
  ON public.treinos FOR SELECT
  USING (auth.uid() = user_id OR public.get_user_role() = 'admin');

-- Admins: acesso total
CREATE POLICY "admins_all_treinos"
  ON public.treinos FOR ALL
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX idx_anamneses_user_id    ON public.anamneses(user_id);
CREATE INDEX idx_anamneses_status     ON public.anamneses(status);
CREATE INDEX idx_avaliacoes_user_id   ON public.avaliacoes_fisicas(user_id);
CREATE INDEX idx_treinos_user_id      ON public.treinos(user_id);
CREATE INDEX idx_treinos_ativo        ON public.treinos(ativo);

-- ============================================================
-- STORAGE BUCKET para avatares
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "avatar_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatar_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
