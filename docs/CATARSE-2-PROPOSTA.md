# Catarse 2 — proposta de produto e reconstrução

Documento de trabalho, 25/09/2026. Esta é a etapa de reestruturação solicitada antes de reconstruir o app. Recursos descritos abaixo são propostas, não funcionalidades já implementadas. Dimensionamento e prioridades serão ajustados ao volume de eventos e à equipe.

## 1. O produto

Uma central de produção audiovisual que acompanha cada trabalho desde o primeiro contato até a entrega e mostra seu resultado financeiro. Três espaços compartilham informações com acessos diferentes: operação da Catarse, espaço pessoal privado do proprietário e portal do cliente.

Perguntas que o app deve responder todos os dias:

- O que preciso resolver hoje, por quê e quem depende disso?
- Quais trabalhos estão ameaçados de atrasar?
- Temos equipe, equipamentos e capacidade de edição para aceitar outro evento?
- Quanto temos disponível, quanto está comprometido e quanto cada trabalho rende?
- O que o cliente precisa enviar, revisar, aprovar ou baixar?

Um projeto conecta cliente, proposta, contrato, agenda, equipe, equipamentos, tarefas, documentos, parcelas, custos e entregas. Uma pessoa pode contratar vários projetos. Um projeto pode ter vários contatos e entregáveis com prazos diferentes.

## 2. Auditoria inicial do código existente

Inspeção local; não confirma configuração ou dados do Supabase em produção, funcionamento das credenciais, assinatura Apple ou publicação de versões.

| Área | Evidência local | Consequência |
| --- | --- | --- |
| Finanças | `src/components/FinanceModule.tsx` usa estado React e valores de exemplo; respostas com `setTimeout` e condições de texto | Não há integração Gemini nesse módulo; alterações não são persistidas por ele |
| Login | `src/components/Login.tsx` compara senha por consulta às tabelas | Reconstruir com autenticação real; não migrar senhas em texto |
| Permissões | `supabase_schema.sql` contém política `USING (true)` e `WITH CHECK (true)` para usuários | Se aplicada com os privilégios necessários, permite acesso amplo; verificar políticas reais antes de migrar |
| Administração | `src/components/AdminModule.tsx` inclui exibição de senhas e usuários de exemplo como fallback | Remover senhas da interface e falhas que parecem sucesso |
| WhatsApp | `src/components/WhatsAppModule.tsx` abre WhatsApp Web e conversa pré-preenchida | Não é uma integração de atendimento por API; não permite determinar a causa do banimento anterior |
| E-mail e redes | Telas declaram desenvolvimento; e-mail abre Gmail | Não estão completas como descrito no resumo anterior |
| Upload no Mac | `scripts/catarse_r2_uploader.py` converte arquivos em base64 e grava em `clients.photos`; miniatura igual ao original | Não envia ao R2 e não gera miniaturas reais; aumenta o volume carregado do banco |
| Upload web | CMS lê arquivos como data URLs | Reconstruir pipeline de mídia separado do cadastro de clientes |
| Download em lote | Galeria dispara downloads individuais com temporizadores | Não equivale a um ZIP preparado de forma confiável |

Compilar não comprova autenticação, persistência, integrações, isolamento entre clientes ou confiabilidade dos uploads.

## 3. Navegação e funções

### Hoje

Página inicial com ações, cada uma ligada ao registro que a originou: propostas sem retorno, briefings incompletos, parcelas vencidas, eventos sem equipe, edição atrasada e revisão aguardando cliente. Cada aviso tem motivo, responsável, vencimento e ação. Sem números fictícios quando faltar informação.

### Comercial

- Funil: contato novo, qualificação, proposta, negociação, ganho e perdido; motivo de perda e origem do contato.
- Cadastro unificado de pessoas e empresas, contatos e histórico.
- Propostas por pacote, adicionais, deslocamento, horas extras, validade e versões.
- Simulador de margem: preço menos custos diretos previstos, taxas e despesas alocadas explicitamente. Não confundir essa margem com lucro líquido.
- Consulta de conflitos de agenda e capacidade antes de prometer data.
- Ao aceitar proposta: preparar projeto, parcelas previstas e tarefas por modelo. Contrato assinado é um estado próprio, confirmado pelo provedor ou registro manual com evidência.
- Lembretes de retorno comerciais com responsável; envios automáticos entram apenas após integração oficial.

### Produção

- Visões de quadro, lista e calendário; responsáveis e prazos reais.
- Modelos específicos para casamento, ensaio, corporativo e parto. Parto admite janela provável e plantão, não apenas uma data fixa.
- Briefing por tipo de serviço, cronograma de cobertura, locais, contatos de apoio, referências e observações restritas.
- Reserva de equipe e equipamentos por intervalo; alerta de conflito, retirada, devolução e manutenção.
- Entregáveis separados: teaser, filme, fotos e álbum podem ter responsáveis e prazos diferentes.
- Checklist de ingestão e backup: registrar cópias verificadas e locais antes de liberar cartões para reutilização.
- Fila de edição com esforço estimado e capacidade semanal; cálculo por regras visíveis antes de introduzir previsão por IA.
- Revisão por versão, comentários em tempo do vídeo, pedidos de mudança, limite de rodadas contratado e aprovação registrada.

### Financeiro empresarial e pessoal

Separação real de dados e permissões. Ter acesso ao financeiro da Catarse não dá acesso às contas pessoais do proprietário.

- Contas, categorias, entradas, despesas, parcelas, recorrências, vencimentos, pagamentos parciais e anexos.
- Separar previsto, vencido e realizado. Saldo exige saldo inicial e movimentos efetivos; previsão é identificada como previsão.
- Valores monetários em centavos ou decimal exato; transferências não viram receita/despesa indevidamente.
- Custos vinculados a projetos: equipe, transporte, locação, edição e outros. Mostrar previsto versus realizado.
- Fluxo de caixa de 30/60/90 dias, recebíveis e compromissos. Reservas e retiradas com regras configuráveis.
- Importação CSV/OFX com prévia, validação, detecção de duplicados e conciliação. Integração bancária automática fica para uma etapa posterior.
- Pessoal: orçamento mensal, faturas/parcelas e metas, sem contas ou valores pessoais inventados.
- Exportação de lançamentos e comprovantes para o contador; fechamento com pendências e reabertura auditável.

O assistente por Gemini apoia o trabalho financeiro: extrai comprovantes, sugere categorias, explica números calculados e identifica documentos faltantes. Não será apresentado como substituto de contador nem como emissor autônomo de obrigações fiscais.

Exemplo: “Quanto sobra se eu contratar um editor por R$ 800?” O sistema calcula o cenário a partir dos registros autorizados; a IA explica as premissas, distingue previsão de saldo real e oferece um rascunho de despesa. O usuário revisa antes da gravação.

### Atendimento

Caixa de conversas vinculada ao contato/projeto, com responsável, pendências, histórico e transferência para humano. WhatsApp pela plataforma oficial da Meta, com recebimento via webhook, identificação de eventos duplicados e registro do estado de envio.

A implementação deve considerar consentimento, descadastro, modelos aprovados quando exigidos e janela de atendimento de 24 horas. Uso oficial não garante ausência de restrições. Não é possível atribuir o banimento passado a uma causa específica apenas pelo código atual.

IA inicialmente como copiloto: resumir conversa, extrair data/tipo/local do evento, sugerir resposta baseada no pacote e disponibilidade registrados. Não inventar preços, aceitar contrato ou prometer prazo. Automatizar respostas restritas só depois de validar qualidade, regras de escalonamento e monitoramento.

E-mail começa por mensagens transacionais e histórico do projeto; uma caixa de e-mail completa só se houver necessidade operacional comprovada.

### Portal e entregas

- Acesso individual, convite e recuperação; autorização por projeto.
- Linha do tempo legível, briefing, documentos, próximas ações e entregáveis contratados.
- Galeria com miniaturas reais, paginação, favoritos por pessoa, seleção de álbum e comentários.
- Player de revisão separado da estreia final; comentários vinculados à versão.
- Upload direto para armazenamento privado, progresso por arquivo, retentativas e retomada de arquivos grandes.
- Download autorizado com link temporário; álbum/favoritas preparados em tarefa de ZIP, com status e expiração.
- Compartilhamento para convidados por link revogável, com escopo e validade; não equivale ao login do contratante.
- Configuração de retenção, lembrete antes de expirar e opção de extensão do armazenamento.
- Extras surpresa continuam como detalhe da experiência, depois que entrega e download forem confiáveis.

### Crescimento

Depois do núcleo: fila de conteúdo a partir de entregas aprovadas, autorização de uso por material, legendas sugeridas, depoimentos, indicações e origem das vendas. Priorizar contratos gerados e conversão em vez de uma tela de curtidas desconectada do comercial.

## 4. Diferenciais com impacto

| Ideia | Benefício | Dependência |
| --- | --- | --- |
| Radar de atraso explicável | Identifica tarefa bloqueadora antes do prazo final | Prazos, responsáveis e dependências |
| Margem por pacote e evento | Revela serviços que ocupam agenda sem retorno suficiente | Preço e custos confiáveis |
| Capacidade de edição | Evita vender além da capacidade de entrega | Estimativas e disponibilidade |
| Central de pendências do cliente | Reduz cobranças manuais de briefing, escolhas e aprovação | Portal e responsáveis |
| Conferência de backup | Reduz risco de liberar mídia original antes da cópia | Registro e verificação de arquivos |
| Memória pesquisável do projeto | Encontra escopo, decisões e referências | Documentos autorizados e busca com fontes |
| Custo de armazenamento por projeto | Ajuda a definir retenção e extensão | Inventário real de arquivos |
| Rentabilidade por origem comercial | Mostra onde a aquisição traz resultado | Origem dos contatos, contratos e custos |

## 5. Tecnologia recomendada

Manter React e TypeScript com Vite para o painel e portal. A auditoria não oferece motivo para trocar essas tecnologias. Tauri pode continuar para a distribuição macOS e tarefas locais; não deve hospedar o servidor de atendimento, que precisa funcionar mesmo com o Mac desligado.

Manter Supabase/PostgreSQL, mas reconstruir autenticação com Supabase Auth e políticas por usuário, papel e vínculo com projeto. Manter R2 para os arquivos, corrigindo seu uso. Essas escolhas reaproveitam a base tecnológica, não os padrões inseguros encontrados.

Arquitetura inicial: aplicação modular, banco central, funções de servidor para segredos, webhooks e operações privilegiadas; fila persistente e worker para ZIP, miniaturas e processamento demorado. Evitar microserviços sem necessidade.

O app solicita autorização ao servidor; o servidor valida usuário, recurso, tamanho e tipo de operação antes de emitir URLs temporárias para armazenamento. Gravar metadados no banco e bytes no R2. Confirmar integridade antes de publicar uma entrega. Avaliar streaming adaptativo conforme tamanho dos filmes e qualidade da conexão; R2 por si só não substitui transcodificação.

Gemini: chave apenas no servidor, modelo configurável, limite de custo, timeout, histórico de operações e saída estruturada validada. O sistema financeiro calcula; a IA interpreta. Consultas e ferramentas respeitam o mesmo isolamento de dados do usuário. Mensagens e documentos são dados, não instruções que possam alterar permissões. Falha da IA não pode produzir uma resposta simulada rotulada como real.

Controles transversais: auditoria, backups restauráveis, tratamento de falhas, registros sem segredos, estados de carregamento/erro, acessibilidade, testes de autorização e reconciliação de tarefas interrompidas.

## 6. Modelo de dados proposto

- Identidade: perfis associados ao Auth, organizações, membros, papéis e permissões.
- Comercial: contatos, empresas, oportunidades, propostas, itens e contratos.
- Produção: projetos, contatos do projeto, entregáveis, tarefas, dependências, briefings e respostas, reservas de equipe/equipamento.
- Finanças: espaços financeiros com escopo empresarial/pessoal, contas, categorias, títulos, parcelas, pagamentos, transferências, anexos, importações e conciliações.
- Mídia: arquivos, coleções, versões, favoritos, comentários, aprovações, compartilhamentos e tarefas de download.
- Integrações: conexões, consentimentos, conversas, mensagens, eventos recebidos, fila de envios e execuções da IA.

Evitar guardar galerias inteiras ou senhas nos registros de clientes. O cliente deve poder acessar somente seus projetos; editor somente os recursos necessários ao trabalho; dados pessoais ficam privados mesmo diante do papel financeiro empresarial.

## 7. Sequência de reconstrução

1. **Base e migração:** inventário, cópia de segurança, autenticação real, permissões, estrutura de dados e identidade visual. Inspecionar as políticas reais do banco em ambiente autorizado. Contas antigas recebem convite/redefinição de senha.
2. **Dinheiro e Gemini — prioridade confirmada pelo proprietário:** contas, lançamentos, parcelas, espaços pessoal e empresarial, importação e análise baseada em dados reais. Cadastro mínimo de contatos/projetos para vincular recebimentos e custos. A página inicial prioriza saldos, compromissos e conciliação. Não apresentar demonstrativos incompletos como contabilidade fechada.
3. **Fluxo operacional completo:** contato → projeto → tarefas/briefing → entregável → revisão → aprovação. Persistência, histórico e portal nesta etapa, conectados ao financeiro já existente.
4. **Arquivos e atendimento robustos:** R2 com upload retomável, processamento de downloads, WhatsApp oficial com número de teste e integração gradual.
5. **Expansões:** capacidade avançada, crescimento, automações adicionais e melhorias específicas de desktop.

Não atribuir prazo ou orçamento fechado antes de conhecer equipe, volume de arquivos, ferramentas existentes e acessos disponíveis. A fase 4 pode antecipar mídia se houver entregas em andamento; o financeiro pode ser antecipado conforme a prioridade do proprietário.

## 8. Critérios de conclusão

- Criar e editar um projeto, recarregar e acessar em outra sessão preserva dados; falha de gravação aparece claramente.
- Cliente A não acessa projeto ou arquivo do cliente B nem alterando uma requisição manualmente.
- Editor não acessa finanças; financeiro empresarial não acessa espaço pessoal.
- Pagamento parcial, transferência, importação duplicada e estorno não distorcem saldo.
- Upload interrompido pode continuar; arquivo publicado tem integridade verificada e pertence ao projeto correto.
- Comentário e aprovação identificam autor, data e versão; uma nova versão não herda aprovação indevida.
- IA indisponível informa falha; sugestões mostram evidências e exigem revisão para mudanças financeiras.
- Webhook repetido não duplica mensagem, lançamento ou tarefa; envio registra sucesso ou falha real.
- Migração compara contagens e amostras, ensaia restauração e mantém caminho de retorno.

## 9. Decisões a ajustar com o proprietário

Prioridade confirmada: finanças pessoais e da empresa. Ainda ajustar: tamanho e papéis da equipe; eventos/mês; quantidade/tamanho das entregas; ferramentas e serviços já pagos; uso exclusivamente interno ou futuro produto comercial; necessidade real do desktop; estrutura financeira existente; situação do número WhatsApp e conta Meta.

Hipótese inicial: ferramenta interna de uma produtora pequena, português e BRL, web responsiva e macOS, operação e finanças integradas. Esta hipótese não autoriza inventar dados reais nem ativar serviços pagos.

## Referências oficiais consultadas

- WhatsApp: https://whatsappbusiness.com/policy/ — consentimento, modelos, janela de atendimento e escalonamento humano.
- Gemini: https://ai.google.dev/gemini-api/docs/api-key — proteção das credenciais.
- Gemini: https://ai.google.dev/gemini-api/docs/structured-output — respostas estruturadas; ainda exigem validação de conteúdo.
- Supabase: https://supabase.com/docs/guides/database/postgres/row-level-security — autorização no banco.
- Tauri: https://v2.tauri.app/start/ — aplicativo com interface web e integração nativa.
- Cloudflare: https://developers.cloudflare.com/r2/api/s3/presigned-urls/ — acesso temporário a objetos.
