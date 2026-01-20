// ============================================
// TAIYARI SAAS - Backend Multi-tenant
// Un serveur pour gérer TOUS vos clients
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============================================
// INITIALISATION
// ============================================
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-changez-moi';
const CLIENTS_DIR = path.join(__dirname, 'clients');
const CONVERSATIONS_DIR = path.join(__dirname, 'conversations');

// ============================================
// BASE DE DONNÉES CLIENTS (Fichiers JSON)
// Pour production: utilisez PostgreSQL
// ============================================

// Créer les dossiers nécessaires
async function initDirs() {
  await fs.mkdir(CLIENTS_DIR, { recursive: true });
  await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
  await fs.mkdir(path.join(__dirname, 'public'), { recursive: true });
}

// Charger la config d'un client
async function loadClientConfig(clientId) {
  try {
    const filepath = path.join(CLIENTS_DIR, `${clientId}.json`);
    const data = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

// Sauvegarder la config d'un client
async function saveClientConfig(clientId, config) {
  const filepath = path.join(CLIENTS_DIR, `${clientId}.json`);
  await fs.writeFile(filepath, JSON.stringify(config, null, 2));
}

// Lister tous les clients
async function listClients() {
  const files = await fs.readdir(CLIENTS_DIR);
  const clients = [];
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const clientId = file.replace('.json', '');
      const config = await loadClientConfig(clientId);
      clients.push({ clientId, ...config });
    }
  }
  
  return clients;
}

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
}

// ============================================
// SYSTEM PROMPTS PAR LANGUE
// ============================================
const SYSTEM_PROMPTS = {
  fr: (clientName, ragContext) => `Tu es l'assistant virtuel de ${clientName}.

PERSONNALITÉ :
- Amical, chaleureux et professionnel
- Utilise parfois des onomatopées naturelles (hmm..., oh!, ah!)
- Concis et direct
- Ton sympathique sans excès
- Émojis avec parcimonie (1-2 max)
- Ne mens JAMAIS

RÈGLES :
- Détecte automatiquement la langue et réponds dans cette langue
- Si pas de réponse, dis-le clairement
- Reste calme même si frustration
- Utilise listes à puces si plusieurs infos

${ragContext ? `
INFORMATIONS À JOUR (BASE DE CONNAISSANCES) :
${ragContext}

Utilise UNIQUEMENT ces informations pour répondre. Si la réponse n'est pas dans ces infos, dis que tu ne sais pas.
` : ''}`,

  en: (clientName, ragContext) => `You are the virtual assistant for ${clientName}.

PERSONALITY:
- Friendly, warm and professional
- Sometimes use natural onomatopoeia (hmm..., oh!, ah!)
- Concise and direct
- Friendly tone without excess
- Emojis sparingly (1-2 max)
- NEVER lie

RULES:
- Automatically detect language and respond in that language
- If no answer, say so clearly
- Stay calm even if frustrated
- Use bullet points if multiple infos

${ragContext ? `
UP-TO-DATE INFORMATION (KNOWLEDGE BASE):
${ragContext}

Use ONLY this information to answer. If the answer is not in this info, say you don't know.
` : ''}`
};

// ============================================
// RAG - Recherche dans la base de connaissances
// ============================================
function searchRAG(query, ragData) {
  if (!ragData) return null;
  
  // Simple recherche textuelle (pour production: utilisez embeddings)
  const lowerQuery = query.toLowerCase();
  let bestMatch = '';
  let bestScore = 0;
  
  // Recherche dans le contenu
  const content = ragData.content || '';
  const sentences = content.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    const words = lowerQuery.split(' ');
    let score = 0;
    
    for (const word of words) {
      if (word.length > 3 && lowerSentence.includes(word)) {
        score++;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = sentence.trim();
    }
  }
  
  // Retourner les meilleures correspondances
  if (bestScore > 0) {
    return content; // Pour simplifier, on retourne tout le contenu
  }
  
  return null;
}

// ============================================
// ROUTE : CHAT PUBLIC (utilisé par les widgets)
// ============================================
app.post('/api/chat/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { messages, conversationId } = req.body;

    // Charger la config du client
    const clientConfig = await loadClientConfig(clientId);
    
    if (!clientConfig) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    // Récupérer le dernier message utilisateur
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    
    // Rechercher dans le RAG
    const ragContext = searchRAG(
      lastUserMessage?.content || '', 
      clientConfig.rag
    );

    // Construire le system prompt
    const language = clientConfig.config?.language || 'fr';
    const systemPrompt = SYSTEM_PROMPTS[language](
      clientConfig.config?.name || 'Notre entreprise',
      ragContext
    );

    // Appeler Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    const assistantMessage = response.content[0].text;

    // Sauvegarder la conversation
    if (conversationId) {
      const convPath = path.join(CONVERSATIONS_DIR, clientId);
      await fs.mkdir(convPath, { recursive: true });
      
      const convFile = path.join(convPath, `${conversationId}.json`);
      await fs.writeFile(convFile, JSON.stringify({
        conversationId,
        clientId,
        messages: [...messages, { role: 'assistant', content: assistantMessage }],
        timestamp: new Date().toISOString()
      }, null, 2));
    }

    res.json({
      message: assistantMessage,
      clientId,
      ragUsed: !!ragContext
    });

  } catch (error) {
    console.error('❌ Erreur chat:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
});

// ============================================
// ROUTE : LOGIN ADMIN
// ============================================
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASS_HASH = process.env.ADMIN_PASSWORD_HASH;

    if (!ADMIN_PASS_HASH) {
      return res.status(500).json({ 
        error: 'Configuration serveur manquante: ADMIN_PASSWORD_HASH requis' 
      });
    }

    if (username === ADMIN_USER && await bcrypt.compare(password, ADMIN_PASS_HASH)) {
      const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, username });
    } else {
      res.status(401).json({ error: 'Identifiants invalides' });
    }
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// ROUTE : LISTE DES CLIENTS (Admin)
// ============================================
app.get('/api/admin/clients', authenticateToken, async (req, res) => {
  try {
    const clients = await listClients();
    res.json({ clients });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// ROUTE : CRÉER UN CLIENT (Admin)
// ============================================
app.post('/api/admin/clients', authenticateToken, async (req, res) => {
  try {
    const { clientId, config, rag, faq } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: 'clientId requis' });
    }

    // Vérifier si existe déjà
    const existing = await loadClientConfig(clientId);
    if (existing) {
      return res.status(409).json({ error: 'Client existe déjà' });
    }

    const clientConfig = {
      clientId,
      config: config || {
        name: 'Nouveau Client',
        primaryColor: '#667eea',
        language: 'fr',
        email: ''
      },
      rag: rag || {
        content: '',
        lastUpdated: new Date().toISOString(),
        source: 'manual',
        autoUpdateUrl: null
      },
      faq: faq || [],
      integrations: {
        hubspot: null,
        shopify: null
      },
      createdAt: new Date().toISOString()
    };

    await saveClientConfig(clientId, clientConfig);

    res.json({ 
      success: true, 
      message: 'Client créé',
      clientConfig 
    });

  } catch (error) {
    console.error('❌ Erreur création client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// ROUTE : METTRE À JOUR UN CLIENT (Admin)
// ============================================
app.put('/api/admin/clients/:clientId', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    const updates = req.body;

    const clientConfig = await loadClientConfig(clientId);
    
    if (!clientConfig) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    // Fusionner les updates
    const updatedConfig = {
      ...clientConfig,
      ...updates,
      config: { ...clientConfig.config, ...updates.config },
      rag: { ...clientConfig.rag, ...updates.rag },
      updatedAt: new Date().toISOString()
    };

    await saveClientConfig(clientId, updatedConfig);

    res.json({ 
      success: true, 
      message: 'Client mis à jour',
      clientConfig: updatedConfig 
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// ROUTE : OBTENIR CONFIG CLIENT (Admin)
// ============================================
app.get('/api/admin/clients/:clientId', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    const clientConfig = await loadClientConfig(clientId);
    
    if (!clientConfig) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.json({ clientConfig });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// ROUTE : METTRE À JOUR RAG (Client Dashboard)
// ============================================
app.post('/api/client/:clientId/update-rag', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { content, password } = req.body;

    const clientConfig = await loadClientConfig(clientId);
    
    if (!clientConfig) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    // Vérifier le mot de passe du client (simple protection)
    // En production: utilisez JWT pour les clients aussi
    if (clientConfig.clientPassword && clientConfig.clientPassword !== password) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Mettre à jour le RAG
    clientConfig.rag = {
      ...clientConfig.rag,
      content: content,
      lastUpdated: new Date().toISOString(),
      source: 'manual'
    };

    await saveClientConfig(clientId, clientConfig);

    res.json({ 
      success: true, 
      message: 'Base de connaissances mise à jour' 
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// ROUTE : CONVERSATIONS D'UN CLIENT (Admin)
// ============================================
app.get('/api/admin/clients/:clientId/conversations', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    const convPath = path.join(CONVERSATIONS_DIR, clientId);
    
    try {
      const files = await fs.readdir(convPath);
      const conversations = [];
      
      for (const file of files.slice(0, 50)) { // Limiter à 50
        const data = await fs.readFile(path.join(convPath, file), 'utf-8');
        conversations.push(JSON.parse(data));
      }
      
      res.json({ conversations });
    } catch (error) {
      res.json({ conversations: [] });
    }

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// ROUTE : STATISTIQUES GLOBALES (Admin)
// ============================================
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    const clients = await listClients();
    
    let totalConversations = 0;
    for (const client of clients) {
      const convPath = path.join(CONVERSATIONS_DIR, client.clientId);
      try {
        const files = await fs.readdir(convPath);
        totalConversations += files.length;
      } catch (error) {
        // Pas de conversations pour ce client
      }
    }

    res.json({
      totalClients: clients.length,
      totalConversations,
      activeClients: clients.filter(c => c.config?.active !== false).length
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// ROUTE : WIDGET JAVASCRIPT (Public)
// ============================================
app.get('/widget.js', async (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  
  // Le widget sera servi depuis public/widget.js
  try {
    const widgetCode = await fs.readFile(path.join(__dirname, 'public', 'widget.js'), 'utf-8');
    res.send(widgetCode);
  } catch (error) {
    res.status(404).send('// Widget non trouvé');
  }
});

// ============================================
// ROUTE : SANTÉ
// ============================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Taiyari SaaS Multi-tenant',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// DÉMARRAGE
// ============================================
initDirs().then(() => {
  app.listen(PORT, () => {
    console.log(`
  ╔════════════════════════════════════════════╗
  ║   🌟 TAIYARI SAAS - MULTI-TENANT          ║
  ║      Backend pour clients illimités       ║
  ╠════════════════════════════════════════════╣
  ║   Serveur démarré sur port ${PORT}           ║
  ║   http://localhost:${PORT}                   ║
  ║                                            ║
  ║   Admin: http://localhost:${PORT}/admin     ║
  ║   Widget: http://localhost:${PORT}/widget.js║
  ╚════════════════════════════════════════════╝
    `);
  });
});
