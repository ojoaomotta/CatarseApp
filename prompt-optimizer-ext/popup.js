document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const promptInput = document.getElementById('prompt-input');
  const charCounter = document.getElementById('char-counter');
  const tokenCounter = document.getElementById('token-counter');
  const btnMinify = document.getElementById('btn-minify');
  const btnSave = document.getElementById('btn-save');
  const btnCopy = document.getElementById('btn-copy');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const historyList = document.getElementById('history-list');
  const budgetValue = document.getElementById('budgetValue');
  const budgetProgress = document.getElementById('budget-progress');
  const textBudgetValue = document.getElementById('budget-value');
  const templateCards = document.querySelectorAll('.template-card');

  // Load Initial Data
  let drafts = [];
  let budgetLimit = 100;
  let budgetUsed = 0;

  try {
    const data = await chrome.storage.local.get(['drafts', 'budgetLimit', 'budgetUsed']);
    drafts = data.drafts || [];
    budgetLimit = data.budgetLimit !== undefined ? data.budgetLimit : 100;
    budgetUsed = data.budgetUsed !== undefined ? data.budgetUsed : 0;
  } catch (err) {
    console.error('Erro ao ler do chrome.storage:', err);
  }

  // Render budget progress
  updateBudgetUI();
  // Render history list
  renderHistory();

  // 1. Navigation Tabs logic
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetTabId);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });

  // 2. Character & Token Counter
  promptInput.addEventListener('input', () => {
    updateCounters();
  });

  function updateCounters() {
    const text = promptInput.value;
    const count = text.length;
    charCounter.textContent = `${count} chars`;

    // Prompt tokens estimate: roughly ~4 chars per token for English/Code
    // For Portuguese/Code, it might be slightly higher (~3.5 chars/token). Let's estimate 3.8.
    const tokens = Math.ceil(text.trim() === '' ? 0 : count / 3.8);
    tokenCounter.textContent = `~${tokens} tokens`;
  }

  // 3. Minification Logic
  btnMinify.addEventListener('click', () => {
    const originalText = promptInput.value;
    if (!originalText.trim()) return;

    // Remove excess line breaks, multiple spaces, and whitespace
    let minified = originalText
      .replace(/[ \t]+/g, ' ')                  // Replace multiple spaces/tabs with single space
      .replace(/\n{3,}/g, '\n\n')               // Replace 3+ line breaks with exactly 2
      .trim();

    promptInput.value = minified;
    updateCounters();
    
    // Add micro-animation/feedback to button
    btnMinify.textContent = 'Minificado!';
    setTimeout(() => {
      btnMinify.textContent = 'Minificar';
    }, 1200);
  });

  // 4. Save Draft
  btnSave.addEventListener('click', async () => {
    const text = promptInput.value.trim();
    if (!text) return;

    const newDraft = {
      id: Date.now().toString(),
      text: text,
      timestamp: new Date().toLocaleDateString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Insert at beginning of list
    drafts.unshift(newDraft);

    // Keep history capped at 30 items
    if (drafts.length > 30) {
      drafts = drafts.slice(0, 30);
    }

    try {
      await chrome.storage.local.set({ drafts });
      renderHistory();
      
      btnSave.textContent = 'Salvo!';
      setTimeout(() => {
        btnSave.textContent = 'Salvar Rascunho';
      }, 1200);
    } catch (err) {
      console.error('Erro ao salvar rascunho:', err);
    }
  });

  // 5. Copy to Clipboard
  btnCopy.addEventListener('click', async () => {
    const text = promptInput.value;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      
      // Update token stats / simulation (simulate that copying a prompt sends a request)
      // Increment budgetUsed as an estimate of sending 1 prompt
      budgetUsed = Math.min(budgetLimit, budgetUsed + 1);
      await chrome.storage.local.set({ budgetUsed });
      updateBudgetUI();
      
      // Notify content script of budget change (so page UI syncs)
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.id) {
          await chrome.tabs.sendMessage(activeTab.id, { 
            type: 'UPDATE_BUDGET', 
            budgetUsed, 
            budgetLimit 
          });
        }
      } catch (e) {
        // Content script might not be injected in the current tab
      }

      btnCopy.textContent = 'Copiado!';
      btnCopy.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      
      setTimeout(() => {
        btnCopy.textContent = 'Copiar Otimizado';
        btnCopy.style.background = '';
      }, 1500);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  });

  // 6. Templates Insertion
  const templates = {
    feature: `[NOVA FUNCIONALIDADE]
Objetivo: Criar uma tela de login...
Comportamento Esperado: Deve possuir autenticação OAuth e validação de email.
Entradas/Dados necessários: E-mail, Senha e Login com Google.
Casos Limites/Restrições: Validar formato do email no cliente e no servidor.`,
    
    bug: `[CORREÇÃO DE BUG]
Problema: Botão de enviar não desabilita após clique.
Passos para reproduzir:
1. Preencher formulário de contato.
2. Clicar duas vezes rápido em Enviar.
Comportamento Esperado: O botão deve ficar disabled e exibir Spinner.
Comportamento Atual/Erro: Envia duplicado no banco de dados.`,
    
    refactor: `[REFATORAÇÃO]
Código/Arquivo: src/components/Form.tsx
Objetivo da Refatoração: Simplificar os states redundantes e usar React Hook Form.
Restrições: Manter o mesmo design e regras de validação atuais.`
  };

  templateCards.forEach(card => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-template');
      if (templates[type]) {
        promptInput.value = templates[type];
        updateCounters();

        // Switch to Optimizer tab
        const optTabBtn = document.querySelector('[data-tab="tab-optimizer"]');
        if (optTabBtn) optTabBtn.click();
      }
    });
  });

  // 7. Clear History
  btnClearHistory.addEventListener('click', async () => {
    if (confirm('Deseja limpar todo o histórico de rascunhos?')) {
      drafts = [];
      try {
        await chrome.storage.local.set({ drafts });
        renderHistory();
      } catch (err) {
        console.error('Erro ao limpar histórico:', err);
      }
    }
  });

  // Render History List Helper
  function renderHistory() {
    historyList.innerHTML = '';
    
    if (drafts.length === 0) {
      historyList.innerHTML = '<p class="empty-state">Nenhum rascunho salvo ainda.</p>';
      return;
    }

    drafts.forEach(draft => {
      const item = document.createElement('div');
      item.className = 'history-item';

      const textEl = document.createElement('div');
      textEl.className = 'history-text';
      textEl.textContent = draft.text;

      const meta = document.createElement('div');
      meta.className = 'history-meta';
      
      const time = document.createElement('span');
      time.textContent = draft.timestamp;

      const actions = document.createElement('div');
      actions.className = 'history-actions';

      const useBtn = document.createElement('button');
      useBtn.className = 'action-link';
      useBtn.textContent = 'Usar';
      useBtn.addEventListener('click', () => {
        promptInput.value = draft.text;
        updateCounters();
        // Switch tab
        const optTabBtn = document.querySelector('[data-tab="tab-optimizer"]');
        if (optTabBtn) optTabBtn.click();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'action-link delete';
      deleteBtn.textContent = 'Excluir';
      deleteBtn.addEventListener('click', async () => {
        drafts = drafts.filter(d => d.id !== draft.id);
        try {
          await chrome.storage.local.set({ drafts });
          renderHistory();
        } catch (err) {
          console.error('Erro ao excluir rascunho:', err);
        }
      });

      actions.appendChild(useBtn);
      actions.appendChild(deleteBtn);
      
      meta.appendChild(time);
      meta.appendChild(actions);
      
      item.appendChild(textEl);
      item.appendChild(meta);
      historyList.appendChild(item);
    });
  }

  // Budget helper
  function updateBudgetUI() {
    if (textBudgetValue) {
      textBudgetValue.textContent = `${budgetUsed} / ${budgetLimit}`;
    }
    if (budgetProgress) {
      const percentage = Math.min(100, (budgetUsed / budgetLimit) * 100);
      budgetProgress.style.width = `${percentage}%`;

      // Color feedback
      if (percentage > 85) {
        budgetProgress.style.background = 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'; // Red
      } else if (percentage > 60) {
        budgetProgress.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'; // Orange
      } else {
        budgetProgress.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)'; // Purple/Pink
      }
    }
  }
});
