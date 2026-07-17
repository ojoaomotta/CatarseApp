(async () => {
  // Config state
  let budgetLimit = 100;
  let budgetUsed = 0;
  let currentPromptTokens = 0;

  // Load initial stats from storage
  try {
    const data = await chrome.storage.local.get(['budgetLimit', 'budgetUsed']);
    budgetLimit = data.budgetLimit !== undefined ? data.budgetLimit : 100;
    budgetUsed = data.budgetUsed !== undefined ? data.budgetUsed : 0;
  } catch (err) {
    console.error('Erro ao ler do storage no content script:', err);
  }

  // Create the floating monitor element
  const monitorContainer = document.createElement('div');
  monitorContainer.id = 'base44-credit-monitor';
  monitorContainer.className = 'base44-monitor-collapsed';
  
  // Base HTML template for the monitor
  monitorContainer.innerHTML = `
    <div class="monitor-header">
      <span class="monitor-title">📊 Monitor de Créditos</span>
      <div class="monitor-controls">
        <button id="monitor-toggle-btn" title="Minimizar/Maximizar">👁️</button>
      </div>
    </div>
    <div class="monitor-body">
      <div class="monitor-stat-row">
        <span>Gasto Hoje:</span>
        <strong id="monitor-used-text">${budgetUsed} / ${budgetLimit}</strong>
      </div>
      <div class="monitor-progress-bg">
        <div id="monitor-progress-fill" style="width: ${(budgetUsed / budgetLimit) * 100}%"></div>
      </div>
      <div class="monitor-stat-row prompt-token-row">
        <span>Prompt Atual:</span>
        <strong id="monitor-prompt-tokens">~0 tokens</strong>
      </div>
      <div class="monitor-action-row">
        <button id="monitor-add-credit-btn" class="monitor-btn-action">+1 Gasto</button>
        <button id="monitor-reset-credit-btn" class="monitor-btn-action">Zerar</button>
      </div>
    </div>
  `;

  document.body.appendChild(monitorContainer);

  // Cache DOM references inside the widget
  const progressFill = document.getElementById('monitor-progress-fill');
  const usedText = document.getElementById('monitor-used-text');
  const promptTokensText = document.getElementById('monitor-prompt-tokens');
  const toggleBtn = document.getElementById('monitor-toggle-btn');
  const addCreditBtn = document.getElementById('monitor-add-credit-btn');
  const resetCreditBtn = document.getElementById('monitor-reset-credit-btn');

  // Toggle Collapse/Expand
  toggleBtn.addEventListener('click', () => {
    if (monitorContainer.classList.contains('base44-monitor-collapsed')) {
      monitorContainer.classList.remove('base44-monitor-collapsed');
      monitorContainer.classList.add('base44-monitor-expanded');
    } else {
      monitorContainer.classList.remove('base44-monitor-expanded');
      monitorContainer.classList.add('base44-monitor-collapsed');
    }
  });

  // Action: Add 1 manually (when user clicks send)
  addCreditBtn.addEventListener('click', async () => {
    budgetUsed = Math.min(budgetLimit, budgetUsed + 1);
    await saveBudget();
    updateUI();
  });

  // Action: Reset
  resetCreditBtn.addEventListener('click', async () => {
    if (confirm('Zerar contador de créditos gastos hoje?')) {
      budgetUsed = 0;
      await saveBudget();
      updateUI();
    }
  });

  async function saveBudget() {
    try {
      await chrome.storage.local.set({ budgetUsed });
    } catch (err) {
      console.error('Erro ao salvar no storage:', err);
    }
  }

  // Update UI function
  function updateUI() {
    usedText.textContent = `${budgetUsed} / ${budgetLimit}`;
    const percentage = Math.min(100, (budgetUsed / budgetLimit) * 100);
    progressFill.style.width = `${percentage}%`;

    // Colors
    if (percentage > 85) {
      progressFill.style.background = '#ef4444'; // Red
    } else if (percentage > 60) {
      progressFill.style.background = '#f59e0b'; // Orange
    } else {
      progressFill.style.background = '#8b5cf6'; // Purple
    }
  }

  // Monitor DOM input changes in active textareas/inputs on page
  document.addEventListener('input', (event) => {
    const target = event.target;
    if (
      target.tagName === 'TEXTAREA' || 
      target.tagName === 'INPUT' || 
      target.getAttribute('contenteditable') === 'true'
    ) {
      const text = target.value || target.innerText || '';
      const tokens = Math.ceil(text.trim() === '' ? 0 : text.length / 3.8);
      promptTokensText.textContent = `~${tokens} tokens`;
      
      // Auto expand monitor if user starts typing a long prompt
      if (tokens > 10 && monitorContainer.classList.contains('base44-monitor-collapsed')) {
        monitorContainer.classList.remove('base44-monitor-collapsed');
        monitorContainer.classList.add('base44-monitor-expanded');
      }
    }
  });

  // Automatically count manual submit actions on page
  // Intercept common send buttons on Base44/Lovable
  document.addEventListener('click', (event) => {
    const target = event.target;
    
    // Check if clicked element looks like a chat send button
    const isSendButton = 
      target.closest('button[type="submit"]') || 
      target.closest('button[aria-label*="send"]') || 
      target.closest('button[title*="Enviar"]') || 
      target.closest('button[title*="Send"]') ||
      (target.tagName === 'BUTTON' && (target.textContent.includes('Enviar') || target.textContent.includes('Send')));

    if (isSendButton) {
      // Small timeout to allow input reading before clearing
      setTimeout(async () => {
        budgetUsed = Math.min(budgetLimit, budgetUsed + 1);
        await saveBudget();
        updateUI();
      }, 100);
    }
  });

  // Listen to messages/updates from Popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_BUDGET') {
      budgetUsed = message.budgetUsed;
      budgetLimit = message.budgetLimit;
      updateUI();
    }
    sendResponse({ success: true });
  });

  // Listen to changes in chrome.storage (in case popup updates it)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.budgetUsed) {
        budgetUsed = changes.budgetUsed.newValue;
      }
      if (changes.budgetLimit) {
        budgetLimit = changes.budgetLimit.newValue;
      }
      updateUI();
    }
  });

  // Try to scrape current credits on page load
  // Search for typical credits indicator texts
  function scrapePageCredits() {
    const pageText = document.body.innerText;
    
    // Regex for typical pattern "X credits", "X créditos", "X / Y credits"
    // e.g. "45 / 100 credits", "25 créditos restantes"
    const creditsRegex = /(\d+)\s*(?:\/|\s+de\s+)?\s*(\d+)?\s*(?:créditos|credits)/i;
    const match = pageText.match(creditsRegex);
    if (match) {
      const parsedUsedOrRemaining = parseInt(match[1], 10);
      const parsedLimit = match[2] ? parseInt(match[2], 10) : null;
      
      // If we found a limit, update it
      if (parsedLimit) {
        budgetLimit = parsedLimit;
        // In some platforms it shows remaining credits. If so: used = limit - remaining
        // Let's assume it represents remaining if the string has "restantes" or "remaining"
        if (/restante|remain/i.test(match[0])) {
          budgetUsed = Math.max(0, budgetLimit - parsedUsedOrRemaining);
        } else {
          // Otherwise, it might be used / total
          budgetUsed = parsedUsedOrRemaining;
        }
        
        chrome.storage.local.set({ budgetUsed, budgetLimit });
        updateUI();
      }
    }
  }

  // Scrape credits after page load settles
  setTimeout(scrapePageCredits, 3000);

  // Periodically check for layout changes to dock the monitor near the chat container
  function tryDockToInput() {
    // Try to find the chat form / input area container
    const inputArea = 
      document.querySelector('form') || 
      document.querySelector('[class*="input-container"]') ||
      document.querySelector('[class*="chat-input"]');
      
    if (inputArea && !inputArea.querySelector('#base44-credit-monitor')) {
      // Optional: We can adjust monitor placement relative to input area if needed.
      // But keeping it as a floating widget aligned near the input area is safer.
      const rect = inputArea.getBoundingClientRect();
      if (rect.top > 0 && rect.left > 0) {
        monitorContainer.style.bottom = `${window.innerHeight - rect.bottom + 10}px`;
        // align to the right of the input container
        monitorContainer.style.right = `${window.innerWidth - rect.right + 10}px`;
      }
    }
  }

  // Hook layout tracker
  setInterval(tryDockToInput, 2000);

})();
