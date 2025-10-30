const axios = require('axios');
const { Country, sequelize } = require('./models');
const { generateSummaryImage } = require('./image');

const COUNTRIES_API = 'https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies';
const RATES_API = 'https://open.er-api.com/v6/latest/USD';

async function fetchExternalData() {
  const [countriesResp, ratesResp] = await Promise.all([
    axios.get(COUNTRIES_API, { timeout: 10000 }),
    axios.get(RATES_API, { timeout: 10000 })
  ]);
  return { countries: countriesResp.data, ratesData: ratesResp.data };
}

function pickCurrencyCode(currencies) {
  if (!Array.isArray(currencies) || currencies.length === 0) return null;
  const first = currencies[0];
  return first && first.code ? first.code : null;
}

function randomMultiplier() {
  return Math.random() * 1000 + 1000; // 1000 - 2000
}

async function refreshAll() {
  // Fetch external data first. If it fails, throw so caller returns 503 and we don't modify DB.
  const { countries, ratesData } = await fetchExternalData();
  if (!ratesData || ratesData.result !== 'success') {
    // rates API format unexpected
    throw new Error('Rates API error');
  }
  const rates = ratesData.rates || {};

  // Prepare list of country records in memory
  const prepared = countries.map(c => {
    const currency_code = pickCurrencyCode(c.currencies);
    let exchange_rate = null;
    let estimated_gdp = null;

    if (!currency_code) {
      // per spec: currencies empty -> currency_code null, exchange_rate null, estimated_gdp 0
      estimated_gdp = 0;
    } else if (rates[currency_code]) {
      exchange_rate = Number(rates[currency_code]);
      const multiplier = randomMultiplier();
      estimated_gdp = (Number(c.population || 0) * multiplier) / exchange_rate;
    } else {
      // currency present but not found in rates
      exchange_rate = null;
      estimated_gdp = null;
    }

    return {
      name: c.name,
      capital: c.capital || null,
      region: c.region || null,
      population: Number(c.population || 0),
      currency_code,
      exchange_rate,
      estimated_gdp,
      flag_url: c.flag || null,
      last_refreshed_at: new Date()
    };
  });

  // Persist in transaction: update existing by name (case-insensitive) or insert
  const t = await sequelize.transaction();
  try {
    for (const rec of prepared) {
      const existing = await Country.findOne({
        where: sequelize.where(sequelize.fn('lower', sequelize.col('name')), rec.name.toLowerCase()),
        transaction: t
      });
      if (existing) {
        await existing.update(rec, { transaction: t });
      } else {
        await Country.create(rec, { transaction: t });
      }
    }

    await t.commit();

    // After commit, generate summary image
    // total countries and top 5 by estimated_gdp
    const total = await Country.count();
    const top5 = await Country.findAll({
      where: {},
      order: [[sequelize.literal('estimated_gdp'), 'DESC']],
      limit: 5
    });
    const path = await generateSummaryImage(total, top5.map(r => r.toJSON()), new Date().toISOString());

    return { total, imagePath: path };
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

module.exports = { refreshAll };
