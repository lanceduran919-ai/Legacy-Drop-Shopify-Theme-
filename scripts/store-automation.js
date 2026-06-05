/**
 * Legacy Drops — Store Automation Script
 * Node.js automation for Shopify store management
 *
 * Usage:
 *   node scripts/store-automation.js --task=upload-products
 *   node scripts/store-automation.js --task=update-descriptions
 *   node scripts/store-automation.js --task=tag-products
 *   node scripts/store-automation.js --task=analytics
 */

require('dotenv').config();
const https = require('https');

const CONFIG = {
  shop: process.env.SHOPIFY_SHOP || 'legacy-drops-3.myshopify.com',
  token: process.env.SHOPIFY_ACCESS_TOKEN,
  apiVersion: '2024-01',
};

/* ── Shopify API Helper ── */
function shopifyRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CONFIG.shop,
      path: `/admin/api/${CONFIG.apiVersion}/${endpoint}`,
      method,
      headers: {
        'X-Shopify-Access-Token': CONFIG.token,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/* ── Task: Upload Products from JSON ── */
async function uploadProducts(productsFile = './data/products.json') {
  const fs = require('fs');
  if (!fs.existsSync(productsFile)) {
    console.log('❌ No products file found at:', productsFile);
    console.log('Create a products.json file with your product data.');
    return;
  }

  const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
  console.log(`📦 Uploading ${products.length} products...`);

  for (const product of products) {
    try {
      const result = await shopifyRequest('POST', 'products.json', { product });
      console.log(`✅ Created: ${result.product.title} (ID: ${result.product.id})`);
      await sleep(500);
    } catch (err) {
      console.log(`❌ Failed: ${product.title} — ${err.message}`);
    }
  }
}

/* ── Task: Update All Product Descriptions ── */
async function updateDescriptions() {
  console.log('📝 Fetching all products...');
  const result = await shopifyRequest('GET', 'products.json?limit=250');
  const products = result.products || [];
  console.log(`Found ${products.length} products. Updating descriptions...`);

  for (const product of products) {
    const newDescription = generateDescription(product);
    await shopifyRequest('PUT', `products/${product.id}.json`, {
      product: { id: product.id, body_html: newDescription },
    });
    console.log(`✅ Updated: ${product.title}`);
    await sleep(300);
  }
}

function generateDescription(product) {
  const type = (product.product_type || '').toLowerCase();
  const title = product.title;

  const templates = {
    't-shirt': `<p>Show San Antonio where your loyalty lives. The <strong>${title}</strong> is built for fans who bleed black and silver. Heavyweight cotton, preshrunk, and made to last as long as your love for the Spurs.</p><p><strong>Features:</strong> 100% cotton · Unisex fit · DTG printed · Machine washable</p>`,
    hoodie: `<p>Stay warm, stay repping. The <strong>${title}</strong> is premium fan merch built for game day and every day in San Antonio. Kangaroo pocket, fleece lining, and a bold Spurs-inspired design.</p><p><strong>Features:</strong> 80% cotton / 20% polyester · Unisex fit · DTG printed · Machine washable</p>`,
    hat: `<p>Top off your fit with San Antonio's finest. The <strong>${title}</strong> is a structured snapback built for real fans. One size, all city, forever repping.</p><p><strong>Features:</strong> Structured 6-panel · Snapback closure · One size fits most · Embroidered design</p>`,
    mug: `<p>Start every morning repping the city. The <strong>${title}</strong> is your daily reminder that San Antonio runs deep. Bold graphic, great coffee, Spurs energy.</p><p><strong>Features:</strong> 11oz white ceramic · Dishwasher safe · Microwave safe · Full-color print</p>`,
  };

  return templates[type] || `<p>Rep San Antonio with the <strong>${title}</strong>. Premium fan merch, built for the real ones. Limited run — don't sleep on it.</p>`;
}

/* ── Task: Auto-Tag Products ── */
async function tagProducts() {
  console.log('🏷️  Fetching products for tagging...');
  const result = await shopifyRequest('GET', 'products.json?limit=250');
  const products = result.products || [];

  for (const product of products) {
    const type = (product.product_type || '').toLowerCase();
    const existingTags = product.tags ? product.tags.split(', ') : [];

    const autoTags = ['spurs', 'san-antonio', 'fan-merch', 'legacy-drops'];
    const typeTags = { 't-shirt': ['apparel', 'tee'], hoodie: ['apparel', 'hoodie'], hat: ['accessories', 'headwear'], mug: ['accessories', 'drinkware'] };
    const newTags = [...new Set([...existingTags, ...autoTags, ...(typeTags[type] || [])])];

    await shopifyRequest('PUT', `products/${product.id}.json`, {
      product: { id: product.id, tags: newTags.join(', ') },
    });
    console.log(`✅ Tagged: ${product.title}`);
    await sleep(300);
  }
}

/* ── Task: Pull Analytics ── */
async function pullAnalytics() {
  console.log('📊 Pulling store analytics...\n');

  const [ordersRes, productsRes, customersRes] = await Promise.all([
    shopifyRequest('GET', 'orders.json?status=any&limit=250'),
    shopifyRequest('GET', 'products.json?limit=250'),
    shopifyRequest('GET', 'customers.json?limit=250'),
  ]);

  const orders = ordersRes.orders || [];
  const products = productsRes.products || [];
  const customers = customersRes.customers || [];

  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  console.log('═══════════════════════════════════');
  console.log('  LEGACY DROPS — STORE SNAPSHOT');
  console.log('═══════════════════════════════════');
  console.log(`  Total Orders:    ${orders.length}`);
  console.log(`  Total Revenue:   $${totalRevenue.toFixed(2)}`);
  console.log(`  Avg Order Value: $${avgOrderValue.toFixed(2)}`);
  console.log(`  Total Products:  ${products.length}`);
  console.log(`  Total Customers: ${customers.length}`);
  console.log('═══════════════════════════════════\n');
}

/* ── Utility ── */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ── CLI Router ── */
const args = process.argv.slice(2);
const task = (args.find((a) => a.startsWith('--task=')) || '').replace('--task=', '');

if (!CONFIG.token) {
  console.error('❌ Missing SHOPIFY_ACCESS_TOKEN in .env file');
  console.log('Create a .env file with:');
  console.log('  SHOPIFY_ACCESS_TOKEN=your_token_here');
  process.exit(1);
}

const tasks = {
  'upload-products': uploadProducts,
  'update-descriptions': updateDescriptions,
  'tag-products': tagProducts,
  analytics: pullAnalytics,
};

if (!task || !tasks[task]) {
  console.log('Available tasks:');
  Object.keys(tasks).forEach((t) => console.log(`  --task=${t}`));
} else {
  tasks[task]().catch(console.error);
}
