// ============================================
// TAIYARI SCRAPER - Mise à jour automatique RAG
// Scrape les sites web des clients pour garder
// le chatbot à jour automatiquement
// ============================================

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

// ============================================
// SCRAPER CLASS
// ============================================
class WebScraper {
  constructor(clientsDir) {
    this.clientsDir = clientsDir;
  }

  // ============================================
  // SCRAPER PRINCIPAL
  // ============================================
  async scrapeUrl(url) {
    try {
      console.log(`🔍 Scraping: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TaiyariBot/1.0)'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Retirer scripts et styles
      $('script, style, nav, footer, header').remove();

      // Extraire le texte principal
      const text = $('body').text();
      
      // Nettoyer le texte
      const cleanText = text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      // Extraire les liens utiles (menu, produits, etc.)
      const links = [];
      $('a[href]').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim();
        
        if (href && text && href.startsWith('/')) {
          links.push({
            text: text,
            url: new URL(href, url).href
          });
        }
      });

      return {
        content: cleanText.substring(0, 10000), // Limiter à 10k chars
        links: links.slice(0, 20), // Max 20 liens
        lastScraped: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Erreur scraping ${url}:`, error.message);
      return null;
    }
  }

  // ============================================
  // SCRAPER SPÉCIALISÉ - MENU RESTAURANT
  // ============================================
  async scrapeMenu(url) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      // Chercher des sections typiques de menu
      const menuSelectors = [
        '[class*="menu"]',
        '[id*="menu"]',
        '[class*="carte"]',
        '[class*="plat"]',
        '[class*="dish"]'
      ];

      let menuText = '';

      for (const selector of menuSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((i, elem) => {
            menuText += $(elem).text() + '\n';
          });
        }
      }

      if (!menuText) {
        // Fallback: extraire tout le contenu
        menuText = $('body').text();
      }

      return menuText
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim()
        .substring(0, 15000);

    } catch (error) {
      console.error('❌ Erreur scraping menu:', error.message);
      return null;
    }
  }

  // ============================================
  // SCRAPER SPÉCIALISÉ - PRODUITS E-COMMERCE
  // ============================================
  async scrapeProducts(url) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      const products = [];

      // Chercher des produits
      const productSelectors = [
        '[class*="product"]',
        '[class*="item"]',
        '[data-product]'
      ];

      for (const selector of productSelectors) {
        $(selector).each((i, elem) => {
          const $elem = $(elem);
          
          const name = $elem.find('[class*="title"], [class*="name"], h1, h2, h3').first().text().trim();
          const price = $elem.find('[class*="price"]').first().text().trim();
          const description = $elem.find('[class*="description"]').first().text().trim();

          if (name) {
            products.push({
              name,
              price: price || 'N/A',
              description: description.substring(0, 200)
            });
          }
        });

        if (products.length > 0) break; // Trouvé des produits
      }

      return products.slice(0, 50); // Max 50 produits

    } catch (error) {
      console.error('❌ Erreur scraping produits:', error.message);
      return [];
    }
  }

  // ============================================
  // MISE À JOUR RAG D'UN CLIENT
  // ============================================
  async updateClientRAG(clientId, url, type = 'general') {
    try {
      console.log(`📝 Mise à jour RAG pour ${clientId} depuis ${url}`);

      let scrapedData;

      switch (type) {
        case 'menu':
          scrapedData = await this.scrapeMenu(url);
          break;
        case 'products':
          scrapedData = await this.scrapeProducts(url);
          break;
        default:
          scrapedData = await this.scrapeUrl(url);
          scrapedData = scrapedData?.content;
      }

      if (!scrapedData) {
        console.error(`❌ Aucune donnée récupérée pour ${clientId}`);
        return false;
      }

      // Charger la config du client
      const configPath = path.join(this.clientsDir, `${clientId}.json`);
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);

      // Mettre à jour le RAG
      config.rag = {
        ...config.rag,
        content: typeof scrapedData === 'string' ? scrapedData : JSON.stringify(scrapedData, null, 2),
        lastUpdated: new Date().toISOString(),
        source: 'auto-scraping',
        autoUpdateUrl: url
      };

      // Sauvegarder
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));

      console.log(`✅ RAG mis à jour pour ${clientId}`);
      return true;

    } catch (error) {
      console.error(`❌ Erreur mise à jour RAG ${clientId}:`, error.message);
      return false;
    }
  }

  // ============================================
  // SCRAPER TOUS LES CLIENTS
  // ============================================
  async updateAllClients() {
    try {
      const files = await fs.readdir(this.clientsDir);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const clientId = file.replace('.json', '');
        const configPath = path.join(this.clientsDir, file);
        const configData = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configData);

        // Vérifier si auto-update activé
        if (config.rag?.autoUpdateUrl && config.rag?.autoUpdate !== false) {
          console.log(`\n🔄 Auto-update pour ${clientId}...`);
          
          await this.updateClientRAG(
            clientId,
            config.rag.autoUpdateUrl,
            config.rag.scrapeType || 'general'
          );

          // Délai entre scrapes
          await this.sleep(2000);
        }
      }

      console.log('\n✅ Scraping terminé pour tous les clients');

    } catch (error) {
      console.error('❌ Erreur scraping global:', error);
    }
  }

  // ============================================
  // UTILITAIRES
  // ============================================
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================
// CRON JOB - Exécution automatique
// ============================================
async function startAutoScraper() {
  const clientsDir = path.join(__dirname, 'clients');
  const scraper = new WebScraper(clientsDir);

  console.log('🤖 Auto-scraper démarré');
  console.log('📅 Exécution toutes les 6 heures');

  // Exécuter immédiatement
  await scraper.updateAllClients();

  // Puis toutes les 6 heures
  setInterval(async () => {
    console.log('\n⏰ Démarrage scraping automatique...');
    await scraper.updateAllClients();
  }, 6 * 60 * 60 * 1000); // 6 heures
}

// Export
module.exports = {
  WebScraper,
  startAutoScraper
};

// Si exécuté directement
if (require.main === module) {
  startAutoScraper().catch(console.error);
}
