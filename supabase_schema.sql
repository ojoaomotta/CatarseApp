-- Script de Migração SQL para o Banco de Dados do Supabase
-- Criação da tabela de usuários da central e controle RBAC (Acessos)

CREATE TABLE IF NOT EXISTS app_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'finance', 'editor')),
  can_view_social boolean DEFAULT false,
  can_view_finances boolean DEFAULT false,
  can_manage_bots boolean DEFAULT false,
  can_edit_portfolio boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS se desejado (padrão é liberado para anon durante o desenvolvimento)
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Adicionar política RLS simples de acesso total para a chave anon (desenvolvimento)
CREATE POLICY "Permitir leitura/escrita total para chave anon"
  ON app_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Inserir administrador principal inicial (João Lucas)
INSERT INTO app_users (name, email, password, role, can_view_social, can_view_finances, can_manage_bots, can_edit_portfolio)
VALUES ('João Lucas', 'admin@catarse.com', 'admin123', 'admin', true, true, true, true)
ON CONFLICT (email) DO NOTHING;

-- Inserir Diretor Financeiro padrão (Ana Clara)
INSERT INTO app_users (name, email, password, role, can_view_social, can_view_finances, can_manage_bots, can_edit_portfolio)
VALUES ('Ana Clara', 'financeiro@catarse.com', 'financeiro123', 'finance', false, true, false, false)
ON CONFLICT (email) DO NOTHING;

-- Inserir Editor de Vídeo padrão (Pedro Santos)
INSERT INTO app_users (name, email, password, role, can_view_social, can_view_finances, can_manage_bots, can_edit_portfolio)
VALUES ('Pedro Santos', 'editor@catarse.com', 'editor123', 'editor', false, false, false, true)
ON CONFLICT (email) DO NOTHING;
