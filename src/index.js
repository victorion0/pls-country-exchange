const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { sequelize, Country } = require('./models');
const { refreshAll } = require('./refresh');

const app = express();
app.use(bodyParser.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;

// Helper: consistent error responses
function errorRes(res, status, body) {
  res.status(status).json(body);
}

// POST /countries/refresh
app.post('/countries/refresh', async (req, res) => {
  try {
    const result = await refreshAll();
    return res.json({ success: true, total_countries: result.total, image: result.imagePath });
  } catch (err) {
    console.error('Refresh error:', err.message || err);
    return errorRes(res, 503, { error: 'External data source unavailable', details: err.message || 'Failed to fetch external API' });
  }
});

// GET /countries with filters ?region=&currency=&sort=gdp_desc
app.get('/countries', async (req, res) => {
  try {
    const { region, currency, sort } = req.query;
    const where = {};
    if (region) where.region = region;
    if (currency) where.currency_code = currency;

    const order = [];
    if (sort === 'gdp_desc') order.push(['estimated_gdp', 'DESC']);

    const rows = await Country.findAll({ where, order });
    return res.json(rows.map(r => r.toJSON()));
  } catch (err) {
    console.error(err);
    return errorRes(res, 500, { error: 'Internal server error' });
  }
});

// GET /countries/:name (case-insensitive)
app.get('/countries/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const row = await Country.findOne({
      where: sequelize.where(sequelize.fn('lower', sequelize.col('name')), name.toLowerCase())
    });
    if (!row) return errorRes(res, 404, { error: 'Country not found' });
    return res.json(row.toJSON());
  } catch (err) {
    console.error(err);
    return errorRes(res, 500, { error: 'Internal server error' });
  }
});

// DELETE /countries/:name
app.delete('/countries/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const row = await Country.findOne({
      where: sequelize.where(sequelize.fn('lower', sequelize.col('name')), name.toLowerCase())
    });
    if (!row) return errorRes(res, 404, { error: 'Country not found' });
    await row.destroy();
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return errorRes(res, 500, { error: 'Internal server error' });
  }
});

// GET /status
app.get('/status', async (req, res) => {
  try {
    const total = await Country.count();
    const last = await Country.max('last_refreshed_at');
    return res.json({ total_countries: total, last_refreshed_at: last });
  } catch (err) {
    console.error(err);
    return errorRes(res, 500, { error: 'Internal server error' });
  }
});

// GET /countries/image
app.get('/countries/image', async (req, res) => {
  try {
    const imgPath = path.resolve(process.cwd(), 'cache', 'summary.png');
    if (!fs.existsSync(imgPath)) return errorRes(res, 404, { error: 'Summary image not found' });
    return res.sendFile(imgPath);
  } catch (err) {
    console.error(err);
    return errorRes(res, 500, { error: 'Internal server error' });
  }
});

// Validation helper for external/POST-created resources (not used for refresh upserts)
function validateCountryPayload(payload) {
  const errors = {};
  if (!payload.name) errors.name = 'is required';
  if (payload.population == null) errors.population = 'is required';
  if (!payload.currency_code) errors.currency_code = 'is required';
  return Object.keys(errors).length ? errors : null;
}

// Start server after syncing DB
(async () => {
  try {
    await sequelize.sync();
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
})();
