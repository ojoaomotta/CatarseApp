-- ============================================================
-- RECUPERAÇÃO URGENTE — Catarse Film Database
-- Execute AGORA no Supabase SQL Editor
-- ============================================================

-- 1. Tabela CLIENTS (principal do site e do app)
CREATE TABLE IF NOT EXISTS clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  username text NOT NULL DEFAULT '',
  password text NOT NULL DEFAULT '',
  project_name text DEFAULT '',
  status text NOT NULL DEFAULT 'Contrato',
  video_url text DEFAULT '',
  video_cover text DEFAULT '',
  download_url text DEFAULT '',
  contract_url text DEFAULT '',
  briefing_questions jsonb DEFAULT '[]'::jsonb,
  briefing_enabled boolean DEFAULT true,
  extras jsonb DEFAULT '[]'::jsonb,
  extras_unlocked boolean DEFAULT false,
  extras_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for clients" ON clients;
CREATE POLICY "Allow all for clients" ON clients FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabela ADMIN_SETTINGS
CREATE TABLE IF NOT EXISTS admin_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for admin_settings" ON admin_settings;
CREATE POLICY "Allow all for admin_settings" ON admin_settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO admin_settings (key, value) VALUES ('admin_password', 'catarse2026')
ON CONFLICT (key) DO NOTHING;

-- 3. Tabela LAB_PORTFOLIO
CREATE TABLE IF NOT EXISTS lab_portfolio (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  video_url text DEFAULT '',
  thumbnail_url text DEFAULT '',
  genre text DEFAULT '',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE lab_portfolio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for lab_portfolio" ON lab_portfolio;
CREATE POLICY "Allow all for lab_portfolio" ON lab_portfolio FOR ALL USING (true) WITH CHECK (true);

-- 4. Tabela APP_USERS
CREATE TABLE IF NOT EXISTS app_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'editor',
  avatar_initials text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for app_users" ON app_users;
CREATE POLICY "Allow all for app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);

INSERT INTO app_users (name, email, password_hash, role, avatar_initials) VALUES
  ('João Lucas', 'joaolucas@catarsefilm.com', 'catarse2026', 'admin', 'JL'),
  ('Ana Clara', 'anaclara@catarsefilm.com', 'editor2026', 'editor', 'AC'),
  ('Pedro Henrique', 'pedro@catarsefilm.com', 'viewer2026', 'viewer', 'PH')
ON CONFLICT (email) DO NOTHING;

-- 5. Tabela RECEIVED_EMAILS
CREATE TABLE IF NOT EXISTS received_emails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender text NOT NULL,
  sender_email text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Geral',
  unread boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(sender_email, subject)
);

ALTER TABLE received_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for received_emails" ON received_emails;
CREATE POLICY "Allow all for received_emails" ON received_emails FOR ALL USING (true) WITH CHECK (true);

-- 6. Tabela de Equipamentos
CREATE TABLE IF NOT EXISTS equipment (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  serial_number text,
  status text NOT NULL DEFAULT 'Disponível',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for equipment" ON equipment;
CREATE POLICY "Allow all for equipment" ON equipment FOR ALL USING (true) WITH CHECK (true);

-- 7. Tabela de Logs de Movimentação de Equipamentos
CREATE TABLE IF NOT EXISTS equipment_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id uuid REFERENCES equipment(id) ON DELETE CASCADE,
  equipment_name text NOT NULL,
  action text NOT NULL,
  user_name text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for equipment_logs" ON equipment_logs;
CREATE POLICY "Allow all for equipment_logs" ON equipment_logs FOR ALL USING (true) WITH CHECK (true);

-- Equipamentos Iniciais
INSERT INTO equipment (name, category, serial_number, status) VALUES
  ('Sony FX3', 'Câmera', 'S/N: 2983719', 'Disponível'),
  ('Sony a7IV', 'Câmera', 'S/N: 1849102', 'Disponível'),
  ('Lente 24-70mm f/2.8 GM II', 'Lente', 'S/N: L839102', 'Disponível'),
  ('Lente 50mm f/1.2 GM', 'Lente', 'S/N: L102943', 'Disponível'),
  ('Microfone Rode Wireless PRO', 'Áudio', 'S/N: A203948', 'Disponível'),
  ('Bastão de Led Nanlite Pavotube', 'Iluminação', 'S/N: I948102', 'Disponível')
ON CONFLICT DO NOTHING;

