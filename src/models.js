const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;
if (process.env.DATABASE_URL) {
  // assume a URL like: mysql://user:pass@host:3306/dbname
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false,
  });
} else {
  // fallback to sqlite file for easy local dev
  const storage = path.resolve(process.cwd(), 'db.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
  });
}

const Country = sequelize.define('Country', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  capital: { type: DataTypes.STRING, allowNull: true },
  region: { type: DataTypes.STRING, allowNull: true },
  population: { type: DataTypes.BIGINT, allowNull: false },
  currency_code: { type: DataTypes.STRING, allowNull: true },
  exchange_rate: { type: DataTypes.FLOAT, allowNull: true },
  estimated_gdp: { type: DataTypes.FLOAT, allowNull: true },
  flag_url: { type: DataTypes.STRING, allowNull: true },
  last_refreshed_at: { type: DataTypes.DATE, allowNull: true }
}, {
  timestamps: true
});

module.exports = { sequelize, Country };
