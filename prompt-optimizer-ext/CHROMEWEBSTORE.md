# Chrome Web Store Metadata & Publishing Reference

Este arquivo serve como repositório central de metadados para publicação da extensão na Chrome Web Store. Copie e cole os campos abaixo no Google Chrome Developer Dashboard.

---

## 1. Informações Básicas da Ficha Técnica (Store Listing)

### **Título da Extensão (Extension Name)**
> Base44 & Lovable Prompt Optimizer & Credit Monitor

### **Resumo da Extensão (Summary / Short Description)**
> Otimize seus prompts para economizar tokens e monitore seus limites de créditos em tempo real no Base44 e Lovable.

### **Descrição Detalhada (Detailed Description)**
> Economize créditos e evite desperdícios ao programar com IA no Base44 e Lovable!
> 
> Esta extensão fornece ferramentas essenciais para otimizar seus prompts de "Vibe Coding" antes de enviá-los, ajudando você a obter respostas corretas de primeira e evitar gasto duplo de créditos de IA.
> 
> **Funcionalidades Principais:**
> 1. 📝 **Editor e Rascunho Local:** Prepare e salve seus prompts em um histórico offline seguro antes de gastar recursos.
> 2. ⚡ **Otimização e Minificação:** Remova quebras de linha redundantes, espaços extras e diminua a contagem de tokens com um clique.
> 3. 🎯 **Modelos Prontos:** Utilize templates estruturados para criação de novas funcionalidades (Features), resolução de Bugs e Refatorações de código.
> 4. 📊 **Monitor de Créditos Injetado:** Um widget sutil e inteligente é exibido na página do Base44 ou Lovable para acompanhar os créditos gastos em tempo real durante a sua sessão de desenvolvimento.
> 
> Maximize sua eficiência de desenvolvimento economizando seus tokens diários!

### **Categoria (Category)**
> Produtividade (Productivity) / Ferramentas de Desenvolvedor (Developer Tools)

---

## 2. Permissões e Justificativas (Permissions Justification)

Todas as permissões declaradas no `manifest.json` precisam de uma justificativa clara em inglês simples para a aprovação dos revisores da Chrome Web Store.

| Permissão | Tipo | Justificativa em Inglês (Para o Dashboard) | Justificativa em Português |
| :--- | :--- | :--- | :--- |
| `storage` | Permission | Needed to store the user's daily credit budget limit, current spent count, and the history of drafted prompts locally on their device. | Necessário para salvar localmente o orçamento diário de créditos, contagem de gastos e o histórico de rascunhos de prompts do usuário. |

---

## 3. Privacidade e Uso de Dados (Privacy & Data Use)

### **Declaração de Coleta de Dados (Data Collection)**
Esta extensão **NÃO** coleta, não envia e não compartilha dados de usuários para nenhum servidor externo. Todos os dados são processados e armazenados estritamente de forma local no navegador do usuário utilizando o `chrome.storage.local`.

*   **Identificação Pessoal (PII):** Não coletado.
*   **Histórico de Navegação:** Não rastreado (a extensão roda apenas nos domínios autorizados do Base44 e Lovable e monitora apenas as interações com o input do chat).
*   **Dados de Uso:** Armazenados localmente no dispositivo do usuário.

---

## 4. Histórico de Versões (Version History)

### **Versão 1.0.0** (17/07/2026)
*   Primeiro lançamento oficial.
*   Implementado Popup UI com tema escuro e glassmorphism.
*   Funções de Minificar e Copiar Prompt.
*   Injeção do Widget flutuante de contagem de créditos e estimativa de tokens em `base44.cloud` e `lovable.dev`.
*   Salvamento local de rascunhos.
