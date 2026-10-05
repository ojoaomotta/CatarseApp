# Catarse no Vercel — financeiro novo e Supabase compartilhado

O site e os futuros aplicativos podem usar o mesmo Supabase. O novo financeiro utiliza somente o schema privado `catarse_finance`, preservando as tabelas de clientes, projetos e entregas do sistema anterior. A nova central financeira ainda não incorpora o CMS/portal antigo. O código antigo continua no repositório e seu build permanece independente.

## O que este commit publica

`npm run build:web` gera o frontend financeiro e a API Node 22 no formato Build Output API do Vercel. `vercel.json` seleciona esse build. A API não cria tabelas automaticamente e não usa arquivos SQLite temporários na nuvem. Sem configuração, mostra uma mensagem de indisponibilidade e não grava dados. A versão local continua disponível com `npm run dev:finance`.

## Preparação do Supabase

1. Confirme o projeto compartilhado com o site e faça um backup recuperável antes da implantação. Não execute os scripts SQL antigos de recuperação presentes na raiz deste repositório.
2. Revise `server/finance/schema.sql`. Esse arquivo cria apenas um schema novo, dentro de uma transação, sem `DROP`, `TRUNCATE` ou alteração de `public`. Se o schema já existir, a transação falha sem substituir seus dados. Execute uma única vez no SQL Editor do projeto correto. Este trabalho não executou esse arquivo no Supabase real.
3. Não adicione `catarse_finance` aos schemas expostos pela Data API. As tabelas têm RLS habilitada sem políticas de acesso público. Somente o servidor deve acessá-las.
4. Em **Connect**, copie a conexão PostgreSQL do **Session pooler**, compatível com IPv4. A senha de banco é diferente da chave pública/anon. Use TLS com certificado validado; não desative a verificação se a conexão falhar. Para restringir privilégios, um administrador pode criar um papel exclusivo com acesso apenas a esse schema e políticas correspondentes; não reaproveite contas de clientes.

## Configuração no Vercel

Importe `ojoaomotta/CatarseApp`, branch `main`, raiz do repositório. Mantenha os comandos de `vercel.json`; o output é gerado em `.vercel/output`. Configure apenas no ambiente de produção:

| Variável | Conteúdo |
| --- | --- |
| `CATARSE_DATABASE_URL` | Conexão PostgreSQL do Supabase, incluindo senha, somente no servidor |
| `CATARSE_PUBLIC_ORIGIN` | URL HTTPS exata da central, sem barra final; por exemplo `https://seu-projeto.vercel.app` |
| `CATARSE_SETUP_KEY` | Código aleatório de pelo menos 32 caracteres, usado para cadastrar o primeiro proprietário |
| `GEMINI_API_KEY` | Chave privada do Google AI Studio |
| `CATARSE_GEMINI_ENABLED` | `true` para liberar consultas |
| `CATARSE_GEMINI_MODEL` | `gemini-3.8-flash` |
| `CATARSE_GEMINI_DAILY_LIMIT` | `20`, ou outro limite de 1 a 1000 consultas por 24 horas |

Nunca use prefixo `VITE_` nessas variáveis. Não copie a chave para arquivos versionados. O `.env.cloud.example` contém apenas exemplos. Gere seu código de ativação com um gerenciador de senhas. Previews não devem receber credenciais de produção; use banco de teste e origem própria caso queira testar um preview conectado.

Após configurar as variáveis, faça um novo deploy. Abra a URL, informe o código de ativação e crie sua conta. O código nunca é retornado pelo servidor. Login, finanças pessoais e finanças empresariais novos têm contas independentes do login legado, que ainda precisa de migração segura.

## Verificação antes de considerar online

- `/api/health` deve responder com `supabase-postgres`.
- Criar uma conta financeira de teste, recarregar e verificar persistência em outro navegador.
- Convidar um usuário financeiro e confirmar que ele não acessa o espaço pessoal.
- Restaurar uma revisão de teste e conferir o histórico.
- Conferir que o site/portal original ainda consulta seus registros anteriores.
- Testar uma consulta Gemini, com consentimento e dados de teste.

Os testes automatizados usam SQLite temporário e PostgreSQL em memória (PGlite), nunca o banco de produção. A exclusão mútua distribuída usa advisory locks PostgreSQL; PGlite testa SQL e transações, mas não substitui a validação de rede/TLS/concorrência no Supabase real. Há limite de 4 MB por envio financeiro. O backup completo da nuvem é responsabilidade do Supabase; a central exporta JSON do espaço selecionado e mantém revisões.

## Gemini: resultado do teste real em 25/09/2026

A chave configurada apenas no arquivo privado local foi aceita na listagem dos modelos (HTTP 200). As consultas ao Gemini 3.8 Flash retornaram HTTP 503 por alta demanda. Novo teste em 05/10/2026 teve o mesmo resultado. A interface informa indisponibilidade e não inventa respostas. Ainda não houve uma resposta real validada de ponta a ponta. Os testes de contexto, referências e permissões usam respostas simuladas. A API Interactions recebe `store: false`; não há ferramentas ou execução de operações financeiras pela IA.

## Aplicativos: próxima etapa

A estrutura Tauri existente e o workflow de Releases continuam no repositório. Este commit não produz um instalador novo e não muda o aplicativo legado. Para o Mac, a próxima etapa é conectar a nova interface, gerar instaladores assinados, publicar o manifesto de atualização e validar atualização entre duas versões. No iPhone, a distribuição nativa precisa de assinatura Apple e App Store/TestFlight; não se instala um app iOS comum pelo mesmo arquivo de release do Mac. Enquanto isso, o site responsivo poderá ser acessado pelo Safari após a configuração online.

Referências: [Vercel Build Output API](https://vercel.com/docs/build-output-api), [transações PostgreSQL](https://node-postgres.com/features/transactions), [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output).

## Ativação realizada

O projeto `catarse-app` foi publicado em https://catarse-app.vercel.app e vinculado ao GitHub. Foi feito um backup PostgreSQL completo em formato custom antes da criação do schema financeiro. O arquivo foi validado com `pg_restore --list` e extração integral para saída descartada; não foi feito teste de restauração em outro servidor. Os arquivos privados e o relatório de integridade estão em `.catarse-finance-data/backups/`, fora do Git.

Foram criadas oito tabelas em `catarse_finance`. As contagens das 43 tabelas públicas foram comparadas antes/depois e permaneceram iguais. O servidor usa o papel `catarse_finance_server`, com permissões SELECT/INSERT/UPDATE/DELETE e políticas RLS apenas nas tabelas financeiras. Foi verificado que esse papel não tem SELECT em `public.clients`. A senha administrativa não foi enviada ao Vercel.

`CATARSE_DATABASE_CA` contém o certificado oficial do Supabase em base64. O servidor passa esse certificado ao driver mantendo a verificação TLS habilitada. A conexão privada e o certificado foram configurados apenas no ambiente de produção do Vercel. O cadastro do primeiro proprietário requer o código de ativação privado; não existe senha padrão.
