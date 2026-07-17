-- Tabela para receber e-mails sincronizados do Gmail via IMAP
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

-- Liberar acesso pelo app desktop
ALTER TABLE received_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow all for received_emails"
  ON received_emails FOR ALL
  USING (true)
  WITH CHECK (true);
