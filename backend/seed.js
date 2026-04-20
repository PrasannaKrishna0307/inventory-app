const fs = require('fs');
const path = require('path');
const db = require('./db');

const csvPath = path.join(__dirname, 'data', 'inventory.csv');
if (!fs.existsSync(csvPath)) {
  console.log('❌ No CSV found at', csvPath);
  process.exit(1);
}

// ──────────────────────────────────────────────
//  INDIAN PRODUCT NAME MAPPINGS
// ──────────────────────────────────────────────
const indianNameMap = {
  // Grains & Rice
  'sushi rice': 'Basmati Rice 1kg',
  'black rice': 'Sona Masoori Rice 5kg',
  'long grain rice': 'Ponni Raw Rice 5kg',
  'brown rice': 'Brown Basmati Rice 1kg',
  'wild rice': 'Kolam Rice 5kg',
  'jasmine rice': 'Ambemohar Rice 2kg',
  'arborio rice': 'Gobindobhog Rice 1kg',
  'sticky rice': 'Idli Rice 5kg',
  'rice flour': 'Rice Rava (Idli Rava) 1kg',
  'rice noodles': 'Sevai (Rice Noodles) 500g',

  // Flour & Pulses
  'all-purpose flour': 'Maida 1kg',
  'bread flour': 'Atta (Whole Wheat) 5kg',
  'cake flour': 'Sooji (Rava) 1kg',
  'whole wheat flour': 'Aashirvaad Atta 10kg',
  'corn flour': 'Corn Flour (Makka Atta) 500g',
  'rye flour': 'Besan (Gram Flour) 1kg',
  'oat flour': 'Ragi Flour (Nachni) 1kg',
  'almond flour': 'Jowar Flour 1kg',
  'coconut flour': 'Bajra Flour 1kg',
  'chickpea flour': 'Besan (Chickpea Flour) 500g',

  // Dairy
  'greek yogurt': 'Amul Dahi 400g',
  'egg (goose)': 'Farm Eggs (6 pack)',
  'egg (duck)': 'Country Eggs (6 pack)',
  'egg (quail)': 'Kadaknath Eggs (6 pack)',
  'cheddar cheese': 'Amul Cheese Block 200g',
  'swiss cheese': 'Amul Processed Cheese 400g',
  'feta cheese': 'Paneer (Fresh) 200g',
  'mozzarella': 'Amul Mozzarella 200g',
  'parmesan cheese': 'Amul Cheese Spread 200g',
  'cream cheese': 'Hung Curd (Chakka) 500g',
  'cottage cheese': 'Paneer (Malai) 500g',
  'butter': 'Amul Butter 500g',
  'ghee': 'Amul Ghee 1L',
  'whipped cream': 'Amul Fresh Cream 200ml',
  'heavy cream': 'Amul Cream 1L',
  'sour cream': 'Amul Buttermilk 500ml',
  'whole milk': 'Nandini Full Cream Milk 1L',
  'almond milk': 'Epigamia Almond Milk 1L',
  'oat milk': 'Raw Pressery Oat Milk 1L',
  'coconut milk': 'KLF Coconut Milk 400ml',

  // Oils & Ghee
  'corn oil': 'Saffola Gold Oil 1L',
  'olive oil': 'Borges Olive Oil 500ml',
  'vegetable oil': 'Fortune Sunflower Oil 1L',
  'sunflower oil': 'Freedom Sunflower Oil 5L',
  'canola oil': 'Fortune Rice Bran Oil 1L',
  'sesame oil': 'Idhayam Gingelly Oil 500ml',
  'peanut oil': 'Gemini Groundnut Oil 1L',
  'coconut oil': 'Parachute Coconut Oil 1L',
  'avocado oil': 'KLF Coconad Coconut Oil 500ml',
  'truffle oil': 'Nalla Ennai (Sesame) 1L',

  // Fruits & Vegetables
  'strawberries': 'Pomegranate (Anar) 500g',
  'blueberries': 'Jamun (Indian Blackberry) 250g',
  'raspberries': 'Falsa (Indian Sherbet Berry) 250g',
  'blackberries': 'Amla (Indian Gooseberry) 500g',
  'cranberries': 'Dry Amla 200g',
  'plum': 'Aloo Bukhara (Indian Plum) 500g',
  'green beans': 'French Beans 500g',
  'spinach': 'Palak (Spinach) 250g',
  'kale': 'Methi (Fenugreek Leaves) 250g',
  'cabbage': 'Patta Gobhi 1pc',
  'broccoli': 'Broccoli 250g',
  'cauliflower': 'Phool Gobhi 1pc',
  'bell pepper': 'Shimla Mirch (Capsicum) 250g',
  'celery': 'Curry Leaves 100g',
  'asparagus': 'Drumstick (Moringa) 250g',
  'artichoke': 'Arbi (Colocasia) 500g',
  'cucumber': 'Kheera (Cucumber) 500g',
  'zucchini': 'Turai (Ridge Gourd) 500g',
  'eggplant': 'Baingan (Brinjal) 500g',
  'mushroom': 'Button Mushroom 200g',
  'tomatoes': 'Tamatar (Tomato) 1kg',
  'onions': 'Pyaz (Onion) 1kg',
  'potatoes': 'Aloo (Potato) 1kg',
  'garlic': 'Lehsun (Garlic) 250g',
  'ginger': 'Adrak (Ginger) 250g',
  'avocado': 'Raw Mango (Kairi) 500g',
  'mango': 'Alphonso Mango (Hapus) 1kg',
  'banana': 'Yelakki Banana (12pc)',
  'apple': 'Shimla Apple 1kg',
  'orange': 'Nagpur Orange 1kg',
  'grapes': 'Nashik Green Grapes 500g',
  'watermelon': 'Tarbooz (Watermelon) 1pc',
  'pineapple': 'Ananas (Pineapple) 1pc',
  'papaya': 'Papita 1pc',
  'guava': 'Amrood (Guava) 500g',
  'lychee': 'Litchi 500g',
  'coconut': 'Nariyal (Coconut) 1pc',
  'jackfruit': 'Kathal (Raw Jackfruit) 1kg',
  'sweet potato': 'Shakarkand (Sweet Potato) 500g',
  'pumpkin': 'Kaddu (Pumpkin) 1kg',
  'radish': 'Mooli (Radish) 500g',
  'carrot': 'Gajar (Carrot) 500g',
  'beetroot': 'Chukandar (Beetroot) 500g',
  'peas': 'Matar (Green Peas) 250g',
  'corn': 'Bhutta (Sweet Corn) 2pc',
  'leek': 'Hara Pyaz (Spring Onion) 100g',
  'turnip': 'Shalgam (Turnip) 500g',

  // Spices & Masalas
  'black pepper': 'Kali Mirch (Black Pepper) 100g',
  'cinnamon': 'Dalchini (Cinnamon) 50g',
  'turmeric': 'Haldi Powder (Turmeric) 200g',
  'paprika': 'Kashmiri Mirch Powder 200g',
  'cumin': 'Jeera (Cumin) 200g',
  'oregano': 'MDH Garam Masala 100g',
  'basil': 'Everest Kitchen King 100g',
  'thyme': 'MTR Sambar Powder 200g',
  'rosemary': 'Catch Coriander Powder 200g',
  'parsley': 'Dhaniya (Coriander) Powder 200g',
  'bay leaves': 'Tej Patta (Bay Leaves) 50g',
  'nutmeg': 'Jaiphal (Nutmeg) 50g',
  'cloves': 'Laung (Cloves) 50g',
  'cardamom': 'Elaichi (Cardamom) 50g',
  'saffron': 'Kesar (Saffron) 1g',
  'vanilla extract': 'Hing (Asafoetida) 50g',
  'chili powder': 'Lal Mirch Powder (Red Chilli) 200g',
  'garlic powder': 'Amchur Powder (Dry Mango) 100g',
  'onion powder': 'Chaat Masala 100g',
  'mustard': 'Rai (Mustard Seeds) 200g',

  // Beverages
  'arabica coffee': 'Filter Coffee Powder 200g',
  'green tea': 'Organic Green Tea 100g',
  'black tea': 'Brooke Bond Red Label 500g',
  'herbal tea': 'Tata Tea Gold 500g',
  'oolong tea': 'Wagh Bakri Chai 500g',
  'chamomile tea': 'Society Tea 250g',
  'earl grey tea': 'Taj Mahal Tea 500g',
  'matcha': 'Girnar Masala Chai 140g',
  'coffee beans': 'Bru Instant Coffee 200g',
  'cocoa powder': 'Cadbury Cocoa Powder 150g',
  'lemonade': 'Rooh Afza 750ml',
  'orange juice': 'Real Mango Juice 1L',
  'apple juice': 'Tropicana Mixed Fruit 1L',
  'cranberry juice': 'Paper Boat Aam Panna 200ml',

  // Snacks & Sweets
  'popcorn': 'Haldiram Bhujia 400g',
  'chips': 'Haldiram Aloo Bhujia 200g',
  'pretzels': 'Haldiram Mixture 400g',
  'crackers': 'Parle Monaco Biscuit 200g',
  'granola': 'Haldiram Namkeen 400g',
  'trail mix': 'Dry Fruit Mix 250g',
  'chocolate': 'Cadbury Dairy Milk 110g',
  'candy': 'Pulse Candy 100g',
  'cookies': 'Parle-G Biscuits 800g',
  'brownies': 'Hide & Seek Biscuits 200g',
  'cake': 'Britannia Good Day 250g',
  'pie': 'Unibic Cookies 500g',
  'ice cream': 'Amul Kesar Pista 500ml',
  'gelato': 'Kwality Walls Kulfi 700ml',

  // Lentils & Pulses
  'lentils': 'Toor Dal (Arhar) 1kg',
  'chickpeas': 'Chana Dal 1kg',
  'black beans': 'Urad Dal (Black Gram) 1kg',
  'kidney beans': 'Rajma (Kidney Beans) 1kg',
  'navy beans': 'Chole (Kabuli Chana) 1kg',
  'lima beans': 'Moong Dal (Yellow) 1kg',
  'pinto beans': 'Masoor Dal (Red Lentils) 1kg',
  'soybeans': 'Soya Chunks 200g',

  // Bakery
  'white bread': 'Britannia Bread 400g',
  'whole wheat bread': 'Harvest Gold Atta Bread 400g',
  'sourdough': 'Pav (Dinner Rolls) 6pc',
  'bagel': 'Rusk (Toast) 300g',
  'croissant': 'Britannia Cake 250g',
  'muffin': 'Wibbs Banana Cake 200g',
  'rye bread': 'Khakhra (Methi) 200g',

  // Seafood
  'salmon': 'Rohu Fish 1kg',
  'tuna': 'Pomfret (Paplet) 500g',
  'shrimp': 'Prawns (Jhinga) 500g',
  'cod': 'Surmai (King Fish) 500g',
  'tilapia': 'Katla Fish 1kg',
  'sardines': 'Bangda (Mackerel) 500g',
  'crab': 'Crab (Kekda) 500g',
  'lobster': 'Tiger Prawns 500g',
  'scallop': 'Hilsa (Ilish) 500g',
  'mackerel': 'Bangda (Mackerel) 1kg',
  'trout': 'Sole Fish (Manthal) 500g',

  // Meat
  'chicken breast': 'Chicken Breast 500g',
  'ground beef': 'Mutton Keema 500g',
  'pork chop': 'Chicken Leg (Tangdi) 500g',
  'lamb': 'Mutton (Goat Meat) 500g',
  'turkey': 'Chicken Curry Cut 1kg',
  'duck': 'Country Chicken 1kg',
  'bacon': 'Chicken Seekh Kebab 300g',
  'sausage': 'Chicken Sausages 250g',
  'ham': 'Chicken Salami 250g',
  'steak': 'Mutton Chops 500g',

  // Dry fruits
  'almonds': 'Badam (Almonds) 250g',
  'walnuts': 'Akhrot (Walnuts) 250g',
  'cashews': 'Kaju (Cashews) 250g',
  'pistachios': 'Pista (Pistachios) 250g',
  'peanuts': 'Moongphali (Peanuts) 500g',
  'hazelnuts': 'Chilgoza (Pine Nuts) 100g',
  'pecans': 'Kishmish (Raisins) 250g',
  'brazil nuts': 'Anjeer (Figs) 200g',
  'macadamia nuts': 'Khajoor (Dates) 500g',
  'pine nuts': 'Makhana (Fox Nuts) 200g',

  // Condiments & Sauces
  'ketchup': 'Kissan Tomato Ketchup 500g',
  'mayonnaise': 'Veeba Eggless Mayo 250g',
  'soy sauce': 'Ching\'s Dark Soy Sauce 200ml',
  'hot sauce': 'Maggi Hot & Sweet Sauce 500g',
  'barbecue sauce': 'Smith & Jones Schezwan Sauce 250g',
  'vinegar': 'Apple Cider Vinegar 500ml',
  'honey': 'Dabur Honey 500g',
  'maple syrup': 'Jaggery (Gud) 500g',
  'jam': 'Kissan Mixed Fruit Jam 500g',
  'peanut butter': 'Sundrop Peanut Butter 462g',
  'tahini': 'Til (Sesame) Chutney 200g',

  // Noodles & Pasta
  'spaghetti': 'Maggi Noodles (Family Pack)',
  'penne': 'Yippee Noodles (6 Pack)',
  'fettuccine': 'Ching\'s Hakka Noodles 150g',
  'macaroni': 'Sunfeast Pasta 200g',
  'lasagna': 'MTR Ready-to-Eat Pulao 300g',
  'ramen': 'Top Ramen Curry Noodles 280g',
  'udon': 'Knorr Soupy Noodles 300g',

  // Pickles & Chutneys
  'pickle relish': 'Mango Pickle (Aam Achar) 400g',
  'olives': 'Priya Lime Pickle 300g',
  'capers': 'Mother\'s Mixed Pickle 300g',
  'jalapenos': 'Green Chilli Pickle 300g',

  // Miscellaneous
  'sugar': 'Sugar (Cheeni) 1kg',
  'raw sugar': 'Jaggery Powder (Gud) 500g',
  'salt': 'Tata Salt 1kg',
  'baking soda': 'Baking Soda 100g',
  'baking powder': 'Baking Powder 100g',
  'yeast': 'Active Dry Yeast 100g',
  'tofu': 'Tofu (Soya Paneer) 200g',
  'pasta sauce': 'MTR Tomato Rice Bath Powder 100g',
  'cereal': 'Kellogg\'s Chocos 375g',
  'oats': 'Quaker Oats 1kg',
  'granola bar': 'Yoga Bar 38g',
  'protein bar': 'RiteBite Max Protein Bar 70g',
  'energy drink': 'Glucon-D Orange 1kg',
  'sports drink': 'ORS Powder (10 sachets)',
  'mineral water': 'Bisleri Water 5L',
  'sparkling water': 'Limca 750ml',
  'soda': 'Thums Up 750ml',
  'diet soda': 'Paper Boat Jaljeera 200ml',
};

// ──────────────────────────────────────────────
//  INDIAN WAREHOUSE LOCATIONS
// ──────────────────────────────────────────────
const indianLocations = [
  // Major cities
  'Warehouse A, Whitefield, Bengaluru',
  'Godown 2, MIDC Andheri, Mumbai',
  'Cold Storage B3, Guindy, Chennai',
  'Hub 1, Manesar, Gurugram',
  'Depot 4, Salt Lake, Kolkata',
  'Warehouse C, Hinjewadi, Pune',
  'Godown 7, Sanathnagar, Hyderabad',
  'Unit 5, Sitapura Industrial, Jaipur',
  'Cold Storage D, Aluva, Kochi',
  'Depot 2, Naroda GIDC, Ahmedabad',
  'Hub 3, Chinchwad MIDC, Pune',
  'Warehouse F, Peenya, Bengaluru',
  'Godown 9, Patparganj, Delhi',
  'Cold Storage A1, Perungudi, Chennai',
  'Unit 8, Noida Sector 63, UP',
  'Depot 6, Bhiwandi, Thane',
  'Hub 5, Electronic City, Bengaluru',
  'Warehouse B, Oragadam, Chennai',
  'Godown 3, Chakan MIDC, Pune',
  'Cold Storage C2, Rajajinagar, Bengaluru',
  'Depot 1, Ambattur, Chennai',
  'Hub 4, Gachibowli, Hyderabad',
  'Warehouse E, Hosur Road, Bengaluru',
  'Godown 5, Turbhe MIDC, Navi Mumbai',
  'Unit 2, Mahape, Navi Mumbai',
  'Cold Storage D3, Anna Nagar, Chennai',
  'Depot 8, Jeedimetla, Hyderabad',
  'Hub 7, Bommasandra, Bengaluru',
  'Warehouse G, Sriperumbudur, Chennai',
  'Godown 1, Bhandup, Mumbai',
];

// ──────────────────────────────────────────────
//  INDIAN CATEGORY MAPPING
// ──────────────────────────────────────────────
const categoryMap = {
  'Grains & Pulses': 'Grains & Atta',
  'Dairy': 'Dairy & Paneer',
  'Fruits & Vegetables': 'Fruits & Sabzi',
  'Bakery': 'Bakery & Rusk',
  'Beverages': 'Chai & Beverages',
  'Seafood': 'Fish & Seafood',
  'Meat': 'Chicken & Mutton',
  'Spices': 'Masala & Spices',
  'Snacks': 'Namkeen & Snacks',
  'Condiments': 'Pickles & Sauces',
};

// ──────────────────────────────────────────────
//  INDIAN SUPPLIER NAMES
// ──────────────────────────────────────────────
const indianSuppliers = [
  'Reliance Fresh Supply Co.',
  'ITC Agri Business',
  'Adani Wilmar Ltd.',
  'Godrej Agrovet',
  'Amul Dairy Co-op',
  'Britannia Industries',
  'Parle Agro Pvt. Ltd.',
  'Dabur India Ltd.',
  'Marico Limited',
  'Hindustan Unilever (Foods)',
  'Tata Consumer Products',
  'Patanjali Ayurved Ltd.',
  'MTR Foods Pvt. Ltd.',
  'Haldiram\'s Nagpur',
  'Aashirvaad (ITC)',
  'Mother Dairy Foods',
  'Heritage Foods Ltd.',
  'Kohinoor Foods Ltd.',
  'Eastern Condiments',
  'Everest Spices Ltd.',
  'Catch Foods (DS Group)',
  'Priya Foods Pvt. Ltd.',
  'Gits Food Products',
  'Bikaji Foods Intl.',
  'Balaji Wafers',
  'Vijay Dairy & Farm',
  'KLF Nirmal Industries',
  'Laxmi Fresh Agri Exports',
  'Deccan Harvest',
  'Sri Murugan Traders',
];

// ──────────────────────────────────────────────
//  HELPERS
// ──────────────────────────────────────────────

// USD → INR conversion (approx rate, then round nicely)
function convertToINR(usdStr) {
  const usd = parseFloat(usdStr.replace(/[$,]/g, '')) || 0;
  let inr = usd * 83;
  // Round to realistic Indian prices
  if (inr < 50) inr = Math.ceil(inr / 5) * 5;         // round to 5
  else if (inr < 200) inr = Math.ceil(inr / 10) * 10;  // round to 10
  else if (inr < 1000) inr = Math.ceil(inr / 25) * 25; // round to 25
  else inr = Math.ceil(inr / 50) * 50;                  // round to 50
  return Math.max(inr, 10); // minimum ₹10
}

function findIndianName(originalName) {
  const lower = originalName.toLowerCase().trim();
  // Direct match
  if (indianNameMap[lower]) return indianNameMap[lower];
  // Partial match
  for (const [key, val] of Object.entries(indianNameMap)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  // No match — keep original but add Hindi-style SKU
  return originalName;
}

function getIndianLocation(index) {
  return indianLocations[index % indianLocations.length];
}

function getIndianSupplier(index) {
  return indianSuppliers[index % indianSuppliers.length];
}

function mapCategory(cat) {
  if (!cat) return 'General';
  for (const [key, val] of Object.entries(categoryMap)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return cat;
}

// ──────────────────────────────────────────────
//  CSV PARSER
// ──────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const cells = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { cells.push(cur); cur = ''; }
      else cur += ch;
    }
    cells.push(cur);
    return Object.fromEntries(headers.map((h, i) => [h, (cells[i] || '').trim()]));
  });
}

// ──────────────────────────────────────────────
//  MAIN — TRANSFORM + IMPORT
// ──────────────────────────────────────────────
const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
console.log(`📦 Loaded ${rows.length} rows from CSV\n`);

// Update DB schema — add category, supplier, location columns if they don't exist
try { db.exec('ALTER TABLE products ADD COLUMN category TEXT DEFAULT "General"'); } catch(e) {}
try { db.exec('ALTER TABLE products ADD COLUMN supplier TEXT DEFAULT ""'); } catch(e) {}
try { db.exec('ALTER TABLE products ADD COLUMN location TEXT DEFAULT ""'); } catch(e) {}
try { db.exec('ALTER TABLE products ADD COLUMN status TEXT DEFAULT "Active"'); } catch(e) {}

// Clear existing products
db.prepare('DELETE FROM products').run();
db.prepare('DELETE FROM sales').run();
db.prepare('DELETE FROM stock_history').run();

const insert = db.prepare(`
  INSERT OR IGNORE INTO products (name, sku, price, quantity, threshold, category, supplier, location, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const usedNames = new Set();
const txn = db.transaction(() => {
  let count = 0, skipped = 0;

  rows.forEach((row, i) => {
    const originalName = row.Product_Name || '';
    if (!originalName) { skipped++; return; }

    let indianName = findIndianName(originalName);

    // Avoid duplicates — add variant suffix
    if (usedNames.has(indianName)) {
      const variants = ['(Premium)', '(Economy)', '(Family Pack)', '(Value)', '(Organic)', '(Large)', '(Small)'];
      for (const v of variants) {
        const candidate = indianName + ' ' + v;
        if (!usedNames.has(candidate)) { indianName = candidate; break; }
      }
    }
    usedNames.add(indianName);

    const sku = row.Product_ID || `DEP-${String(i+1).padStart(4,'0')}`;
    const price = convertToINR(row.Unit_Price || '$1');
    const quantity = parseInt(row.Stock_Quantity || '0');
    const threshold = parseInt(row.Reorder_Level || '10');
    const category = mapCategory(row.Catagory || '');
    const supplier = getIndianSupplier(i);
    const location = getIndianLocation(i);
    const status = (row.Status || 'Active').trim();

    if (price <= 0) { skipped++; return; }

    insert.run(indianName, sku, price, quantity, threshold, category, supplier, location, status);
    count++;
  });

  console.log(`✅ Imported ${count} products (Indian localized)`);
  console.log(`⚠️  Skipped ${skipped} rows\n`);
});
txn();

// Generate some sample sales from existing products
const sampleProducts = db.prepare('SELECT * FROM products WHERE quantity > 5 ORDER BY RANDOM() LIMIT 30').all();
const insertSale = db.prepare('INSERT INTO sales (product_id, quantity, total) VALUES (?, ?, ?)');
const updateStock = db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');
const insertStockHistory = db.prepare('INSERT INTO stock_history (product_id, quantity, type) VALUES (?, ?, ?)');

const saleTxn = db.transaction(() => {
  let salesCount = 0;
  sampleProducts.forEach(p => {
    const qty = Math.min(Math.floor(Math.random() * 5) + 1, p.quantity);
    if (qty <= 0) return;
    const total = p.price * qty;
    insertSale.run(p.id, qty, total);
    updateStock.run(qty, p.id);
    insertStockHistory.run(p.id, qty, 'OUT');
    salesCount++;
  });
  console.log(`💰 Generated ${salesCount} sample sales\n`);
});
saleTxn();

// Show preview
console.log('📦 Sample imported products:');
const sample = db.prepare('SELECT id, name, sku, price, quantity, threshold, category, location FROM products LIMIT 10').all();
console.table(sample);

const stats = {
  totalProducts: db.prepare('SELECT COUNT(*) as c FROM products').get().c,
  totalSales: db.prepare('SELECT COUNT(*) as c FROM sales').get().c,
  lowStockItems: db.prepare('SELECT COUNT(*) as c FROM products WHERE quantity < threshold').get().c,
  totalRevenue: db.prepare('SELECT COALESCE(SUM(total), 0) as t FROM sales').get().t,
  categories: db.prepare('SELECT DISTINCT category FROM products').all().map(r => r.category),
};

console.log('\n📊 Database Summary:');
console.log(`  Products:    ${stats.totalProducts}`);
console.log(`  Sales:       ${stats.totalSales}`);
console.log(`  Low stock:   ${stats.lowStockItems}`);
console.log(`  Revenue:     ₹${stats.totalRevenue.toLocaleString('en-IN')}`);
console.log(`  Categories:  ${stats.categories.join(', ')}`);
console.log('\n✅ Done! Run "node server.js" to start the app.\n');