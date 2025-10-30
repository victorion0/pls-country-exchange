const request = require('supertest');
const app = require('../src/index');
const { sequelize, Country } = require('../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('API basic flows', () => {
  test('POST /countries validation failure returns 400', async () => {
    const res = await request(app).post('/countries').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
    expect(res.body).toHaveProperty('details');
    expect(res.body.details).toHaveProperty('name');
  });

  test('POST /countries create and GET single', async () => {
    const payload = {
      name: 'Testland',
      population: 1000,
      currency_code: 'TST'
    };
    const createRes = await request(app).post('/countries').send(payload);
    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty('id');

    const getRes = await request(app).get('/countries/Testland');
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveProperty('name', 'Testland');
  });

  test('GET /countries returns array and /status reports total', async () => {
    const list = await request(app).get('/countries');
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    const stat = await request(app).get('/status');
    expect(stat.status).toBe(200);
    expect(typeof stat.body.total_countries).toBe('number');
  });

  test('DELETE /countries/:name deletes record', async () => {
    const del = await request(app).delete('/countries/Testland');
    expect(del.status).toBe(200);
    expect(del.body).toHaveProperty('success', true);
    const get = await request(app).get('/countries/Testland');
    expect(get.status).toBe(404);
  });
});
