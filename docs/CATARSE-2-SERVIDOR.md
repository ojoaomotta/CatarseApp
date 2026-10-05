> Atualização: a preparação para Vercel e Supabase está em [CATARSE-VERCEL.md](CATARSE-VERCEL.md). As instruções abaixo descrevem o modo local.

# Catarse 2 — login, servidor independente e Gemini

Esta etapa amplia o financeiro local já existente. O banco compartilhado com o site não foi consultado, alterado ou migrado. Não foram instaladas dependências adicionais nem ferramentas de WhatsApp.

## Como usar

Execute `npm run dev:finance` e abra http://127.0.0.1:1430/v2.html. Esse comando inicia a interface e o servidor independente. Use Node.js 22.22.3 ou versão compatível com `node:sqlite` e remoção de tipos TypeScript. A API SQLite deste runtime ainda emite aviso de experimental.

No primeiro acesso, crie sua conta de proprietário com uma senha de pelo menos 12 caracteres. Não há senha padrão. O proprietário acessa Empresa e Pessoal; usuários convidados recebem apenas acesso financeiro empresarial. Convites são de uso único e duram 24 horas. Nenhum e-mail é enviado pelo app nesta etapa.

Os convites e acessos funcionam no mesmo Mac. Não compartilhe o endereço `127.0.0.1` como se fosse um serviço publicado: em outro computador ele aponta para o próprio computador do destinatário.

Para executar a versão compilada, use `npm run build:finance` e `npm run server:finance`, abrindo http://127.0.0.1:1432/v2.html. O comando de prévia visual da etapa anterior não oferece o backend; para testar login use a versão com servidor.

## Onde os dados ficam

- `.catarse-finance-data/finance.sqlite`: banco independente de usuários, sessões, dados financeiros e histórico.
- `.catarse-finance-data/backups/`: cópias completas solicitadas em Configurações.
- `.env.finance`: configuração privada do Gemini, não incluída no Git.

O servidor escuta apenas em `127.0.0.1`, na porta 1432. Não depende do Supabase, não contém as credenciais do banco do site e não executa scripts SQL antigos. Os arquivos de entrada e configurações do aplicativo legado continuam preservados.

Limpar o navegador não apaga os dados salvos no servidor. A perda do Mac ou do arquivo do banco ainda exige backup em outro local. Os arquivos não são criptografados pelo app; permissões do sistema restringem acesso, mas a conta do macOS que executa o servidor tem acesso ao conteúdo. Proteção multiusuário no aplicativo não equivale a isolamento contra o proprietário da conta do macOS.

## Importação da versão anterior

O botão **Revisar cópia dos dados locais**, em Configurações, prepara somente o espaço financeiro atual para revisão. Confirmar substitui os registros desse espaço no novo servidor; a cópia antiga permanece no navegador e o servidor preserva uma revisão anterior. Também é possível importar um backup JSON da primeira versão, com a mesma seleção por espaço.

Não há migração automática. A versão anterior continua disponível pelo botão da tela de entrada. Seus registros locais antigos continuam sujeitos às limitações de acesso do navegador; o login novo não os criptografa nem apaga. A demonstração continua em memória e não envia seus exemplos ao banco novo.

## Proteções implementadas

- Senhas com salt aleatório e scrypt, sem armazenamento em texto.
- Sessões aleatórias, armazenadas por hash, com expiração de 12 horas; cookie HttpOnly e SameSite Strict.
- Verificação de origem e token de sessão para alterações; Host restrito ao endereço local.
- Convite empresarial de uso único, prazo de validade e suspensão de acesso que invalida sessões existentes.
- Verificação de acesso por espaço em leitura, gravação, histórico, restauração e IA.
- Transação SQLite e revisão esperada: duas gravações baseadas na mesma versão não se sobrescrevem silenciosamente.
- Uma revisão anterior preservada antes de cada gravação. Restaurar gera nova versão e mantém eventos anteriores.
- Histórico com usuário e horário atribuídos pelo servidor; o cliente não fornece sua própria identidade.
- Nenhum retorno silencioso ao armazenamento local quando o servidor falha.
- Limites de tamanho, validação de referências financeiras e rejeição de mistura entre espaços.

O histórico conserva todas as revisões; a interface lista as 50 mais recentes. O espaço ocupado deve ser acompanhado conforme o volume cresce. Cópias completas incluem dados de autenticação e de ambos os espaços: guarde-as como arquivos privados. O JSON exportado no modo servidor contém somente o espaço atualmente selecionado.

## Gemini: conexão implementada, ativação pendente

O app usa um adaptador de servidor para a API Interactions do Gemini, com respostas estruturadas. Não houve chamada real ao Google nesta etapa: os testes usaram um provedor simulado. Uma configuração válida ainda precisa ser verificada com uma consulta autorizada real.

Para configurar, edite `.env.finance` no seu computador:

```dotenv
CATARSE_GEMINI_ENABLED=true
GEMINI_API_KEY=sua_chave_inserida_localmente
CATARSE_GEMINI_MODEL=gemini-3.8-flash
CATARSE_GEMINI_DAILY_LIMIT=20
```

Reinicie o servidor depois de alterar o arquivo. A configuração inicial permanece desativada e sem chave. Não envie sua chave pelo chat nem use variáveis com prefixo `VITE_` para segredos.

Na aba Assistente, o usuário confirma o envio da pergunta, totais calculados e até 100 lançamentos do espaço atual ao Google. O servidor escolhe os dados autorizados; o navegador não pode indicar o espaço pessoal de outra pessoa nem fornecer um conjunto arbitrário de dados para a consulta. Contatos, nomes de contas, sessões, senhas e histórico de alterações não são incluídos no contexto. Descrições dos lançamentos podem conter informações pessoais e são enviadas quando a consulta é autorizada.

Há timeout, limite de perguntas por minuto, limite global de consultas nas últimas 24 horas, limite de saída e validação de referências. `store=false` desativa o armazenamento da interação previsto por essa opção da API; isso não significa ausência de todos os tratamentos ou retenções definidos pelo Google. O limite de consultas não é um teto monetário: cobrança e condições dependem da conta Google.

O assistente não grava lançamentos nem executa ferramentas. As referências retornadas precisam corresponder aos registros enviados. Respostas ainda podem conter erros de interpretação; totais determinísticos e evidências ajudam na conferência, mas não garantem a exatidão de todo o texto.

## Verificação realizada

- Nove testes financeiros anteriores passaram.
- Sete testes de servidor passaram: configuração única, senha e sessão; isolamento de acesso; origem e token; concorrência e revisão; cópia SQLite; contexto da IA; referências inválidas e provedor indisponível.
- Cópia completa do SQLite reaberta em leitura, com `integrity_check` aprovado e conferência dos registros gravados.
- Interface compilada testada com uma central temporária separada: login, lançamento, persistência após recarregar, revisão anterior, restauração e alternância para espaço pessoal vazio.
- Testes não criaram usuários de teste na central real. O proprietário da central real deve criar sua própria conta.

Comandos: `npm run test:finance`, `npm run test:server`, `npm run build:finance`.

## Limites e próximos passos

- Ainda é um servidor neste Mac; não há publicação, HTTPS, acesso em outros dispositivos, instalação como serviço de inicialização ou sincronização em nuvem.
- Antes de publicar, configurar domínio, HTTPS e cookie Secure, administração de segredos, monitoramento, backups externos e recuperação de acesso.
- Recuperação de senha por e-mail e troca de senha não foram implementadas. Não crie uma conta de produção compartilhada enquanto o fluxo de recuperação não estiver definido.
- Restaurar uma cópia SQLite completa é uma operação administrativa diferente de restaurar revisões pela tela; deve ser feita com o servidor parado e preservando o banco atual. A interface atual recupera revisões e importa JSON por espaço; não substitui o arquivo SQLite completo.
- WhatsApp permanece desconectado. Produção, portal e armazenamento de mídia continuam como próximas etapas da reconstrução.
- O modelo atual salva cada espaço financeiro como um documento validado com revisão, mantendo autenticação e histórico em tabelas próprias. É adequado a esta etapa de pequeno volume; relatórios complexos e crescimento da equipe pedem evolução para tabelas financeiras normalizadas e avaliação de PostgreSQL independente.

## Referências oficiais consultadas

- [Interactions API do Gemini](https://ai.google.dev/gemini-api/docs/interactions-overview)
- [Respostas estruturadas](https://ai.google.dev/gemini-api/docs/structured-output)
- [Chaves da API Gemini](https://ai.google.dev/gemini-api/docs/api-key)
- [SQLite no Node.js](https://nodejs.org/api/sqlite.html)
