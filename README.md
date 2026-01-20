# 🌟 TAIYARI SAAS - Multi-Tenant Chatbot Platform

> Une solution SaaS complète pour créer et gérer des chatbots IA pour clients illimités

---

## 🎯 Qu'est-ce que c'est?

**Taiyari SaaS** vous permet de déployer **un seul serveur** pour gérer des chatbots IA pour **des centaines de clients** sur n'importe quelle plateforme (Shopify, WordPress, Wix, PrestaShop, etc.).

### ✨ Caractéristiques principales

- 🚀 **Multi-tenant** - 1 serveur pour tous vos clients
- 🤖 **IA Claude intégrée** - Conversations naturelles
- 🔄 **Scraping automatique** - RAG toujours à jour
- 🌐 **Universal** - Fonctionne sur n'importe quel site
- ⚡ **Installation rapide** - 2 lignes de code
- 💰 **Économique** - 7$/mois pour clients illimités
- 📊 **Dashboard admin** - Gestion facile
- 🎨 **Personnalisable** - Par client

---

## 📦 Ce qui est inclus

```
taiyari-saas/
├── server.js              # Backend multi-tenant
├── scraper.js             # Scraping automatique
├── public/
│   ├── widget.js          # Widget universel
│   └── admin.html         # Dashboard admin
├── clients/               # Configs clients (JSON)
├── conversations/         # Logs conversations
├── package.json
└── GUIDE_COMPLET.md      # Documentation complète
```

---

## 🚀 Démarrage rapide

### 1. Installation

```bash
npm install
cp .env.example .env
```

### 2. Configuration

Éditez `.env` :
```env
CLAUDE_API_KEY=sk-ant-votre-cle-ici
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=hash-généré
JWT_SECRET=secret-aléatoire
```

### 3. Démarrer

```bash
npm start
```

Accès : http://localhost:3000/admin.html

---

## 💻 Déploiement (Railway)

```bash
# 1. Créer compte sur railway.app
# 2. Nouveau projet
railway login
railway up

# 3. Ajouter variables d'environnement
# 4. Déployé! 🎉
```

**URL** : `https://votre-app.up.railway.app`

---

## 👤 Ajouter un client

### Via Dashboard

1. Connectez-vous : `https://votre-app.railway.app/admin.html`
2. Cliquez "Nouveau Client"
3. Remplissez les infos
4. Le client reçoit 2 lignes de code :

```html
<script src="https://votre-app.railway.app/widget.js"></script>
<script>
  Taiyari.init({ clientId: 'resto-delice' });
</script>
```

**C'est tout !** ✨

---

## 🔄 Scraping automatique

Le chatbot se met à jour **automatiquement** depuis le site web du client toutes les 6 heures.

**Exemple** : Restaurant change sa carte
```
15h00 : Restaurant publie nouvelle carte
18h00 : Scraper automatique récupère la nouvelle carte
18h05 : Chatbot connaît déjà la nouvelle carte!
```

**Zéro maintenance** pour le client 🎉

---

## 💰 Modèle économique

### Vos coûts

- Railway : 5$/mois
- Claude API : 2-10$/mois
- **Total : 7-15$/mois** pour clients **illimités**

### Prix suggérés

- **Starter** : 29€/mois/client
- **Pro** : 49€/mois/client
- **Premium** : 99€/mois/client

### Votre marge

| Clients | Revenus | Coûts | Marge |
|---------|---------|-------|-------|
| 10 | 290€ | 7€ | **283€** |
| 50 | 1450€ | 7€ | **1443€** |
| 100 | 2900€ | 7€ | **2893€** |

**Scalable à l'infini! 🚀**

---

## 🎨 Personnalisation par client

Chaque client peut avoir :

```javascript
Taiyari.init({
  clientId: 'resto-delice',
  primaryColor: '#FF5733',
  language: 'fr',
  botName: 'Chef Bot',
  welcomeMessage: 'Bienvenue au Restaurant Délice!'
});
```

---

## 📊 Fonctionnalités

### Pour vous (Admin)

✅ Dashboard centralisé  
✅ Gestion clients illimités  
✅ Statistiques globales  
✅ Scraping automatique  
✅ Logs conversations  
✅ Code d'intégration 1-clic

### Pour vos clients

✅ Installation 2 lignes de code  
✅ Chatbot toujours à jour  
✅ Multi-langues auto  
✅ Fonctionne sur n'importe quel site  
✅ Dashboard client (optionnel)  
✅ Aucune maintenance

---

## 🌐 Compatible avec

- ✅ Shopify
- ✅ WordPress
- ✅ Wix
- ✅ PrestaShop
- ✅ Squarespace
- ✅ Sites statiques
- ✅ N'importe quel site web!

---

## 📚 Documentation

- **GUIDE_COMPLET.md** - Guide détaillé d'installation et utilisation
- **server.js** - Code commenté du backend
- **widget.js** - Code commenté du widget
- **scraper.js** - Code commenté du scraper

---

## 🔐 Sécurité

- ✅ JWT authentication
- ✅ Bcrypt passwords
- ✅ HTTPS (Railway automatique)
- ✅ Rate limiting
- ✅ Input validation
- ✅ Conversations isolées par client

---

## 🛠️ Technologies

- **Backend** : Node.js + Express
- **IA** : Claude Sonnet 4 (Anthropic)
- **Scraping** : Cheerio
- **Auth** : JWT + bcrypt
- **Frontend** : Vanilla JS (léger!)
- **Hébergement** : Railway

---

## 📋 Prérequis

- Node.js >= 18
- Clé API Claude
- Compte Railway (pour déploiement)

---

## 🚦 Statut du projet

✅ **Production-ready**

- Multi-tenant fonctionnel
- Scraping automatique opérationnel
- Dashboard admin complet
- Widget universel testé
- Documentation complète

---

## 🎯 Cas d'usage

### Restaurants
- Menu automatiquement à jour
- Réservations
- Horaires, infos pratiques

### E-commerce
- Catalogue produits
- Support client
- Suivi commandes

### Hôtels
- Disponibilités
- Services
- Réservations

### Services
- FAQ dynamique
- Prise de rendez-vous
- Informations produits

---

## 📈 Roadmap

- [ ] PostgreSQL au lieu de JSON
- [ ] Analytics avancés
- [ ] Intégrations (HubSpot, Stripe)
- [ ] A/B testing
- [ ] Multi-langues avancé
- [ ] API publique
- [ ] Marketplace de templates

---

## 🤝 Support

**Documentation** : Consultez GUIDE_COMPLET.md

**Logs** : 
```bash
railway logs
```

**Test** :
```bash
curl https://votre-app.railway.app/health
```

---

## 📄 License

MIT - Utilisez librement pour vos projets commerciaux

---

## 🎉 Prêt à lancer votre SaaS de chatbots?

1. Déployez sur Railway (15 min)
2. Créez votre 1er client test
3. Définissez vos prix
4. Commencez à vendre! 🚀

**Revenus récurrents garantis avec une infrastructure qui scale! 💰**

---

*Créé avec ❤️ pour les entrepreneurs qui veulent scaler*
