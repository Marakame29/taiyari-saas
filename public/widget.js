// ============================================
// TAIYARI WIDGET - Universal Chatbot
// Fonctionne sur Shopify, WordPress, Wix, etc.
// ============================================

(function() {
  'use strict';

  // Configuration par défaut
  const DEFAULT_CONFIG = {
    apiUrl: window.TAIYARI_API_URL || 'https://taiyari.railway.app',
    primaryColor: '#667eea',
    language: 'fr',
    position: 'bottom-right',
    welcomeMessage: null,
    autoOpen: false
  };

  // ============================================
  // TAIYARI CLASS
  // ============================================
  class TaiyariWidget {
    constructor(config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.conversationHistory = [];
      this.conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      this.isOpen = false;
      
      if (!this.config.clientId) {
        console.error('Taiyari: clientId requis');
        return;
      }

      this.init();
    }

    init() {
      this.injectCSS();
      this.createWidget();
      this.attachEventListeners();
      
      if (this.config.autoOpen) {
        setTimeout(() => this.open(), 1000);
      }
    }

    // ============================================
    // INJECTION CSS
    // ============================================
    injectCSS() {
      const style = document.createElement('style');
      style.textContent = `
        .taiyari-widget * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        #taiyari-button {
          position: fixed;
          ${this.config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
          ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
          width: 60px;
          height: 60px;
          background: ${this.config.primaryColor};
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999998;
          transition: all 0.3s ease;
          border: none;
        }

        #taiyari-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }

        #taiyari-button svg {
          width: 28px;
          height: 28px;
          fill: white;
        }

        #taiyari-window {
          position: fixed;
          ${this.config.position.includes('bottom') ? 'bottom: 90px;' : 'top: 90px;'}
          ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
          width: 380px;
          max-width: calc(100vw - 40px);
          height: 600px;
          max-height: calc(100vh - 120px);
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          display: none;
          flex-direction: column;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }

        #taiyari-window.open {
          display: flex;
          animation: taiyari-slideup 0.3s ease;
        }

        @keyframes taiyari-slideup {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        #taiyari-header {
          background: ${this.config.primaryColor};
          color: white;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        #taiyari-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        #taiyari-avatar {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        #taiyari-title h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        #taiyari-title p {
          font-size: 12px;
          opacity: 0.9;
        }

        #taiyari-close {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #taiyari-close:hover {
          background: rgba(255,255,255,0.3);
        }

        #taiyari-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f7f9fc;
        }

        .taiyari-message {
          margin-bottom: 16px;
          display: flex;
          gap: 10px;
          animation: taiyari-fadein 0.3s ease;
        }

        @keyframes taiyari-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .taiyari-message.user {
          flex-direction: row-reverse;
        }

        .taiyari-message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .taiyari-message.user .taiyari-message-avatar {
          background: ${this.config.primaryColor};
          color: white;
        }

        .taiyari-message.assistant .taiyari-message-avatar {
          background: white;
          border: 2px solid ${this.config.primaryColor};
        }

        .taiyari-message-content {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .taiyari-message.user .taiyari-message-content {
          background: ${this.config.primaryColor};
          color: white;
          border-bottom-right-radius: 4px;
        }

        .taiyari-message.assistant .taiyari-message-content {
          background: white;
          color: #333;
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }

        .taiyari-typing {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
          background: white;
          border-radius: 18px;
          width: fit-content;
        }

        .taiyari-typing span {
          width: 8px;
          height: 8px;
          background: ${this.config.primaryColor};
          border-radius: 50%;
          animation: taiyari-typing 1.4s infinite;
        }

        .taiyari-typing span:nth-child(2) { animation-delay: 0.2s; }
        .taiyari-typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes taiyari-typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-10px); opacity: 1; }
        }

        #taiyari-input-area {
          padding: 15px 20px;
          background: white;
          border-top: 1px solid #e1e8ed;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        #taiyari-input {
          flex: 1;
          border: 1px solid #e1e8ed;
          border-radius: 25px;
          padding: 12px 18px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
        }

        #taiyari-input:focus {
          border-color: ${this.config.primaryColor};
        }

        #taiyari-send {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${this.config.primaryColor};
          color: white;
        }

        #taiyari-send:hover {
          opacity: 0.9;
        }

        .taiyari-welcome {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .taiyari-welcome h4 {
          color: #333;
          margin-bottom: 8px;
          font-size: 18px;
        }

        .taiyari-welcome p {
          font-size: 14px;
          line-height: 1.6;
        }

        @media (max-width: 480px) {
          #taiyari-window {
            width: 100%;
            height: 100%;
            max-width: 100vw;
            max-height: 100vh;
            bottom: 0;
            right: 0;
            left: 0;
            top: 0;
            border-radius: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // ============================================
    // CRÉER LE WIDGET
    // ============================================
    createWidget() {
      const container = document.createElement('div');
      container.className = 'taiyari-widget';
      container.innerHTML = `
        <button id="taiyari-button" aria-label="Ouvrir le chat">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        </button>

        <div id="taiyari-window">
          <div id="taiyari-header">
            <div id="taiyari-header-content">
              <div id="taiyari-avatar">🌟</div>
              <div id="taiyari-title">
                <h3>${this.config.botName || 'Assistant'}</h3>
                <p>${this.config.subtitle || 'En ligne'}</p>
              </div>
            </div>
            <button id="taiyari-close">×</button>
          </div>

          <div id="taiyari-messages">
            <div class="taiyari-welcome">
              <h4>Bonjour! 👋</h4>
              <p>${this.config.welcomeMessage || 'Comment puis-je vous aider aujourd\'hui?'}</p>
            </div>
          </div>

          <div id="taiyari-input-area">
            <input 
              type="text" 
              id="taiyari-input" 
              placeholder="Écrivez votre message..."
              autocomplete="off"
            />
            <button id="taiyari-send">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(container);

      this.elements = {
        button: document.getElementById('taiyari-button'),
        window: document.getElementById('taiyari-window'),
        close: document.getElementById('taiyari-close'),
        messages: document.getElementById('taiyari-messages'),
        input: document.getElementById('taiyari-input'),
        send: document.getElementById('taiyari-send')
      };
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    attachEventListeners() {
      this.elements.button.addEventListener('click', () => this.toggle());
      this.elements.close.addEventListener('click', () => this.close());
      this.elements.send.addEventListener('click', () => this.sendMessage());
      this.elements.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
    }

    // ============================================
    // MÉTHODES PUBLIQUES
    // ============================================
    open() {
      this.isOpen = true;
      this.elements.window.classList.add('open');
      this.elements.input.focus();
    }

    close() {
      this.isOpen = false;
      this.elements.window.classList.remove('open');
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    // ============================================
    // ENVOI DE MESSAGE
    // ============================================
    async sendMessage() {
      const message = this.elements.input.value.trim();
      if (!message) return;

      this.addMessage(message, 'user');
      this.elements.input.value = '';

      this.conversationHistory.push({ role: 'user', content: message });
      this.showTyping();

      try {
        const response = await fetch(`${this.config.apiUrl}/api/chat/${this.config.clientId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: this.conversationHistory,
            conversationId: this.conversationId
          })
        });

        const data = await response.json();
        this.hideTyping();

        if (data.message) {
          this.addMessage(data.message, 'assistant');
          this.conversationHistory.push({ role: 'assistant', content: data.message });
        } else {
          this.addMessage("Désolé, une erreur s'est produite. Pouvez-vous réessayer?", 'assistant');
        }

      } catch (error) {
        this.hideTyping();
        this.addMessage("Erreur de connexion. Vérifiez votre connexion internet.", 'assistant');
        console.error('Taiyari error:', error);
      }
    }

    // ============================================
    // AFFICHAGE DES MESSAGES
    // ============================================
    addMessage(text, role) {
      const welcome = this.elements.messages.querySelector('.taiyari-welcome');
      if (welcome) welcome.remove();

      const messageDiv = document.createElement('div');
      messageDiv.className = `taiyari-message ${role}`;
      
      messageDiv.innerHTML = `
        <div class="taiyari-message-avatar">${role === 'user' ? '👤' : '🌟'}</div>
        <div class="taiyari-message-content">${this.escapeHtml(text)}</div>
      `;
      
      this.elements.messages.appendChild(messageDiv);
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    showTyping() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'taiyari-message assistant';
      typingDiv.id = 'taiyari-typing';
      typingDiv.innerHTML = `
        <div class="taiyari-message-avatar">🌟</div>
        <div class="taiyari-typing">
          <span></span><span></span><span></span>
        </div>
      `;
      this.elements.messages.appendChild(typingDiv);
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    hideTyping() {
      const typing = document.getElementById('taiyari-typing');
      if (typing) typing.remove();
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // ============================================
  // API PUBLIQUE
  // ============================================
  window.Taiyari = {
    init: function(config) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          new TaiyariWidget(config);
        });
      } else {
        new TaiyariWidget(config);
      }
    }
  };

})();
