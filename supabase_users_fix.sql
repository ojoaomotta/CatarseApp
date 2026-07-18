-- ============================================================
-- RECRIAÇÃO DA TABELA DE USUÁRIOS E CADASTRO DOS DOIS PERFIS
-- Execute este SQL no Supabase SQL Editor para corrigir
-- ============================================================

-- 1. Exclui a tabela antiga com a estrutura errada
DROP TABLE IF EXISTS app_users;

-- 2. Cria a tabela com as colunas corretas exigidas pelo app
CREATE TABLE app_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL, -- Armazenamento de senha exigido pelo app
  role text NOT NULL CHECK (role IN ('admin', 'finance', 'editor')),
  can_view_social boolean DEFAULT false,
  can_view_finances boolean DEFAULT false,
  can_manage_bots boolean DEFAULT false,
  can_edit_portfolio boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilita RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- 4. Cria política de acesso livre para a Central
DROP POLICY IF EXISTS "Acesso Total para Central" ON app_users;
CREATE POLICY "Acesso Total para Central" ON app_users FOR ALL USING (true) WITH CHECK (true);

-- 5. Insere os dois únicos usuários solicitados
INSERT INTO app_users (name, email, password, role, can_view_social, can_view_finances, can_manage_bots, can_edit_portfolio)
VALUES 
('João Lucas', 'joaolucas@catarsefilm.com', '060783', 'admin', true, true, true, true),
('Samuel', 'samuel@catarsefilm.com', '123456', 'editor', false, false, false, true);
