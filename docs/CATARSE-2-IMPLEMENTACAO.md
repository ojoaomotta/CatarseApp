# Catarse 2 — primeira implementação

> Histórico da primeira etapa. A evolução com login e armazenamento no servidor está documentada em [CATARSE-2-SERVIDOR.md](./CATARSE-2-SERVIDOR.md). As limitações de armazenamento abaixo continuam aplicáveis ao modo anterior local, mas foram substituídas no novo modo com servidor.

25/09/2026. Novo financeiro local funcional, separado da aplicação anterior. Não é a reconstrução completa nem um serviço multiusuário em produção.

## Abrir

```sh
npm run dev:finance
```

Endereço: http://127.0.0.1:1430/v2.html

O comando usa configuração própria. O comando antigo `npm run dev`, o login antigo, as conexões do site e os arquivos SQL foram preservados. Não foram feitas migrações, consultas ao banco remoto, instalações de robôs WhatsApp, publicação ou atualização de app desktop.

## Disponível

- Interface responsiva, em português, com espaços empresarial e pessoal.
- Contas com saldo inicial e data de referência.
- Entradas e despesas previstas, divididas em até 60 parcelas com distribuição exata dos centavos.
- Pagamentos parciais, saldo calculado pelo realizado e estorno de registros. Estorno é apenas contábil local, sem transação bancária.
- Correção de descrição, valor, categoria e vencimento de lançamentos sem pagamentos ativos. Clicar na descrição abre os detalhes. Parcelas são corrigidas individualmente.
- Transferências internas entre contas do mesmo espaço, sem gerar receita ou despesa.
- Previsão de caixa para 30, 60 e 90 dias com premissas explícitas.
- Busca e filtros por mês, tipo e situação; exportação CSV do espaço selecionado.
- Importação CSV no modelo próprio, com prévia, validação e identificação de possíveis duplicados. Todos os registros importados entram como previstos. Não é importação bancária genérica, OFX ou conciliação automática.
- Cadastro de projetos e vínculo financeiro; valor contratado, recebimentos, custos diretos e margem direta prevista.
- Metas com progresso manual; não movimentam nem reservam automaticamente o saldo das contas.
- Simulador local de nova despesa. Não usa IA e está identificado assim.
- Persistência local, backup JSON completo, restauração validada e histórico das alterações.
- Demonstração isolada na memória, claramente identificada e sem substituir dados salvos.

## Preservação dos dados existentes

A entrada nova `v2.html` importa apenas `src/v2`. Não importa `src/lib/supabase.ts`, o atualizador Tauri, o login antigo nem módulos legados. A geração de produção fica em `dist-finance`, separada de `dist`. A política de conteúdo da página limita conexões à origem local; o build de produção não permite scripts inline.

Foi encontrado `DROP TABLE IF EXISTS app_users` em `supabase_users_fix.sql`. Isso é evidência de um script potencialmente destrutivo, não prova de que ele tenha sido executado nem diagnóstico da perda anterior. Nenhum script SQL foi executado nesta reconstrução. Recuperação de dados antigos exigiria análise própria de backups, logs e estado real do serviço.

O armazenamento novo usa a chave `catarse-v2-finance-local-2026`. Não altera chaves usadas pela versão antiga. Dados inválidos encontrados na leitura bloqueiam gravação; o conteúdo bruto pode ser exportado em Configurações. Uma gravação detectada de outra aba bloqueia a próxima alteração até recarregar, reduzindo o risco de sobrescrita. Não há garantia de transações simultâneas entre abas: usar uma aba por vez nesta versão.

## Limites importantes

- Dados ficam neste navegador/origem, sem criptografia própria, servidor, autenticação ou sincronização. Limpar o navegador pode apagá-los. Faça backups.
- Empresa/Pessoal organiza os registros, mas não controla acesso por pessoa. Quem usa o navegador pode acessar ambos. O backup completo contém ambos.
- Esta é uma base para revisão e uso local; permissões multiusuário exigem backend independente e autenticação real.
- Gemini e WhatsApp estão desconectados. Não há respostas simuladas apresentadas como IA nem envios de mensagens.
- Metas não equivalem a saldos bancários conciliados. Margem direta não equivale a lucro líquido. Contratos não geram recebíveis automaticamente nesta etapa.
- Importações usam um modelo próprio. A exportação de lançamentos serve para leitura e prestação de contas; restauração completa usa JSON, não CSV.
- Ainda faltam edição de contas/projetos, recorrências contínuas, conciliação, comprovantes, migração, portal novo e produção operacional completa.
- A interface não apaga registros; correções e estornos deixam histórico. O histórico local não é inviolável e tem limite de 5.000 eventos.

## Verificação

```sh
npm run test:finance
npm run build:finance
```

Os nove testes passaram. Cobrem valores monetários, parcelas, fim do mês, pagamentos parciais, datas, transferências, separação dos espaços, projeção, rejeição de backups inválidos, importação e duplicados CSV, persistência e falha de armazenamento. A versão compilada abriu corretamente no navegador; uma conta fictícia persistiu após recarregar; R$ 100 foram divididos em R$ 33,34 + R$ 33,33 + R$ 33,33. Na demonstração, um recebimento parcial de R$ 400 deixou R$ 550 em aberto de um título de R$ 950. Layout e acesso às configurações foram inspecionados em larguras de desktop e celular.

Os testes persistentes de interface usaram a origem de prévia na porta 1431, distinta da entrada entregue na porta 1430. Os registros de demonstração da entrada principal continuam apenas em memória.

## Próximas etapas

1. Validar o fluxo financeiro e os formatos dos extratos realmente utilizados.
2. Criar um backend novo, separado do banco do site, com contas de usuário, isolamento pessoal/empresarial e backups restauráveis.
3. Conectar Gemini no servidor, com permissões, fontes dos dados e limite de custo; ativação depende das credenciais e configuração do serviço.
4. Completar produção, portal e pipeline R2 em ambiente separado; migrar dados antigos somente após inventário e ensaio reversível.
5. Integrar WhatsApp oficial em ambiente de teste e avaliar elegibilidade do número; jamais automatizar WhatsApp Web para contornar restrições.
