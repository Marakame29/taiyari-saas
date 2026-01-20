# 🚀 TAIYARI SAAS - Guide Complet

## 📋 Table des matières

1. [Qu'est-ce que c'est?](#quest-ce-que-cest)
2. [Installation locale](#installation-locale)
3. [Déploiement sur Railway](#déploiement-sur-railway)
4. [Ajouter votre premier client](#ajouter-votre-premier-client)
5. [Code d'intégration client](#code-dintégration-client)
6. [Scraping automatique](#scraping-automatique)
7. [Gestion des clients](#gestion-des-clients)
8. [Modèle de prix](#modèle-de-prix)
9. [FAQ](#faq)

---

## 🎯 Qu'est-ce que c'est?

**Taiyari SaaS** est une plateforme multi-tenant qui vous permet de créer et gérer des chatbots IA pour **clients illimités** avec un seul serveur.

### ✨ Caractéristiques

- **Multi-tenant** : 1 serveur pour tous vos clients
- **Auto-update** : Scraping automatique des sites web
- **Universal** : Fonctionne sur Shopify, WordPress, Wix, etc.
- **Simple** : 2 lignes de code à intégrer
- **Scalable** : Clients illimités
- **Économique** : 7$/mois pour tous vos clients

---

## 💻 INSTALLATION LOCALE

### 1. Prérequis

- Node.js >= 18
- npm
- Clé API Claude

### 2. Installation

```bash
# Cloner ou décompresser le projet
cd taiyari-saas

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env
```

### 3. Configuration .env

Éditez `.env` :

```env
PORT=3000
CLAUDE_API_KEY=sk-ant-votre-cle-ici
ADMIN_USERNAME=admin
JWT_SECRET=changez-moi-en-production
```

### 4. Générer le hash du mot de passe admin

```bash
node -e "console.log(require('bcryptjs').hashSync('votre-mot-de-passe', 10))"
```

Copiez le résultat dans `.env` :
```env
ADMIN_PASSWORD_HASH=le_hash_généré
```

### 5. Démarrer

```bash
npm start
```

Accès :
- **Dashboard Admin** : http://localhost:3000/admin.html
- **API** : http://localhost:3000/health

---

## ☁️ DÉPLOIEMENT SUR RAILWAY

### Pourquoi Railway?

- ✅ Simple et rapide
- ✅ 5$/mois (hobby plan)
- ✅ Déploiement automatique
- ✅ PostgreSQL gratuit
- ✅ SSL/HTTPS automatique

### Étapes de déploiement

#### 1. Créer compte Railway

- Allez sur https://railway.app
- Créez un compte (GitHub recommandé)

#### 2. Nouveau projet

- Cliquez "New Project"
- Sélectionnez "Deploy from GitHub repo"
- OU "Empty Project" pour upload manuel

#### 3. Configuration

1. Ajoutez les variables d'environnement :
   ```
   CLAUDE_API_KEY=sk-ant-...
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH=...
   JWT_SECRET=...
   ```

2. Railway génère automatiquement :
   ```
   PORT (automatique)
   URL (exemple: https://taiyari-xxx.up.railway.app)
   ```

#### 4. Déployer

```bash
# Méthode 1: GitHub (recommandé)
- Connectez votre repo GitHub
- Railway déploie automatiquement

# Méthode 2: CLI Railway
railway login
railway up
```

#### 5. Vérifier

Accès à votre URL Railway :
```
https://votre-app.up.railway.app/health
```

---

## 👤 AJOUTER VOTRE PREMIER CLIENT

### Via le Dashboard Admin

1. **Connectez-vous** : `https://votre-app.railway.app/admin.html`

2. **Créer un client** :
   - Cliquez "Nouveau Client"
   - Remplissez :
     ```
     Client ID: resto-delice
     Nom: Restaurant Délice
     Email: contact@resto-delice.ch
     Langue: Français
     URL scraping: https://resto-delice.ch/menu
     Contenu initial: [Votre FAQ ou menu]
     ```

3. **Créer** → Le client est prêt!

### Via l'API (optionnel)

```bash
curl -X POST https://votre-app.railway.app/api/admin/clients \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "resto-delice",
    "config": {
      "name": "Restaurant Délice",
      "language": "fr"
    },
    "rag": {
      "content": "Notre menu...",
      "autoUpdateUrl": "https://resto-delice.ch/menu"
    }
  }'
```

---

## 🔗 CODE D'INTÉGRATION CLIENT

### Le client reçoit ce code :

```html
<!-- Taiyari Chatbot -->
<script src="https://votre-app.railway.app/widget.js"></script>
<script>
  Taiyari.init({
    clientId: 'resto-delice',
    primaryColor: '#FF5733',  // Optionnel
    language: 'fr'             // Optionnel
  });
</script>
```

### Où le coller?

**Shopify** :
1. Admin > Online Store > Themes
2. Actions > Edit code
3. theme.liquid
4. Avant `</body>`

**WordPress** :
1. Apparence > Éditeur de thème
2. footer.php
3. Avant `</body>`

**Wix** :
1. Paramètres > Suivi et analyses
2. Code personnalisé
3. Body - end

**PrestaShop** :
1. Préférences > SEO & URLs
2. Code personnalisé
3. Footer

**Site statique** :
- Avant `</body>` dans le HTML

---

## 🤖 SCRAPING AUTOMATIQUE

### Comment ça marche?

Le serveur scrape automatiquement le site du client **toutes les 6 heures**.

### Activer le scraping

1. **Via Dashboard** :
   - Nouveau client > URL pour scraping
   - Le scraping se fait automatiquement

2. **Démarrer le scraper manuellement** :
```bash
npm run scraper
```

### Types de scraping

**Général** (par défaut) :
```javascript
{
  "rag": {
    "autoUpdateUrl": "https://client.com/menu",
    "scrapeType": "general"
  }
}
```

**Menu restaurant** :
```javascript
{
  "rag": {
    "autoUpdateUrl": "https://resto.com/carte",
    "scrapeType": "menu"
  }
}
```

**Produits e-commerce** :
```javascript
{
  "rag": {
    "autoUpdateUrl": "https://shop.com/products",
    "scrapeType": "products"
  }
}
```

### Fréquence de scraping

Dans `scraper.js`, ligne 198 :
```javascript
setInterval(async () => {
  await scraper.updateAllClients();
}, 6 * 60 * 60 * 1000); // 6 heures (modifiable)
```

---

## 👥 GESTION DES CLIENTS

### Voir tous les clients

Dashboard : `https://votre-app.railway.app/admin.html`

### Modifier un client

Cliquez "Voir" sur le client → Affiche :
- Détails du client
- Code d'intégration
- Statistiques scraping

### Mettre à jour le RAG manuellement

```bash
curl -X POST https://votre-app.railway.app/api/client/resto-delice/update-rag \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Nouveau menu...",
    "password": "mot-de-passe-client"
  }'
```

### Supprimer un client

Supprimez le fichier :
```bash
rm clients/resto-delice.json
```

---

## 💰 MODÈLE DE PRIX

### Vos coûts

| Service | Coût |
|---------|------|
| Railway (hébergement) | 5$/mois |
| Claude API | ~2-10$/mois selon usage |
| **TOTAL** | **7-15$/mois** |

### Prix suggérés pour vos clients

| Plan | Prix/mois | Ce qu'il inclut |
|------|-----------|-----------------|
| **Starter** | 29€ | Chatbot + MAJ manuelles |
| **Pro** | 49€ | + Scraping auto + Dashboard |
| **Premium** | 99€ | + Intégrations CRM + Analytics |

### Votre marge

- **1 client** : 29€ - 7€ = **22€ marge**
- **10 clients** : 290€ - 7€ = **283€ marge**
- **50 clients** : 1450€ - 7€ = **1443€ marge**

**Scalable à l'infini avec le même serveur!**

---

## ❓ FAQ

### Le scraping fonctionne sur tous les sites?

La plupart, oui. Certains sites avec JavaScript lourd peuvent nécessiter Puppeteer (plus avancé).

### Combien de clients max?

**Illimités** avec cette architecture. Le seul limite est la puissance du serveur Railway.

### Peut-on utiliser OpenAI au lieu de Claude?

Oui! Modifiez `server.js` ligne 176 pour remplacer l'appel Anthropic par OpenAI.

### Les conversations sont sauvegardées?

Oui, dans `/conversations/{clientId}/{conversationId}.json`

### Peut-on personnaliser le widget par client?

Oui! Chaque client peut avoir :
- Sa propre couleur (`primaryColor`)
- Sa propre langue
- Son propre message de bienvenue

### Comment migrer vers PostgreSQL?

Remplacez les fichiers JSON par une vraie DB. Railway offre PostgreSQL gratuit.

---

## 🔐 SÉCURITÉ

### Points importants

1. **Changez le mot de passe admin** par défaut
2. **Utilisez JWT_SECRET aléatoire** en production
3. **HTTPS uniquement** (Railway le fait automatiquement)
4. **Limitez l'accès admin** par IP si possible

### Générer des clés sécurisées

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Admin Password Hash
node -e "console.log(require('bcryptjs').hashSync('votre-super-mot-de-passe', 10))"
```

---

## 📞 SUPPORT

### Logs du serveur

```bash
# Sur Railway
railway logs
```

### Tester l'API

```bash
# Santé
curl https://votre-app.railway.app/health

# Test chat
curl -X POST https://votre-app.railway.app/api/chat/resto-delice \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Bonjour"}]}'
```

---

## 🎯 CHECKLIST DE LANCEMENT

- [ ] Déployer sur Railway
- [ ] Configurer variables d'environnement
- [ ] Changer mot de passe admin
- [ ] Créer 1er client de test
- [ ] Tester le widget sur un site
- [ ] Activer scraping automatique
- [ ] Définir vos prix
- [ ] Prêt à vendre! 🚀

---

**Vous avez une solution SaaS complète prête à générer des revenus récurrents!**

*Guide créé le 20 janvier 2025*
