const cors = require('cors');
const Chance = require('chance');
const express = require('express');
const {
  SEED, PAIR_COUNT, UPDATE_INTERVAL, FAILURE_CHANCE,
} = require('./constants');

const chance = new Chance(SEED);
const isDevMode = process.env.NODE_ENV !== 'production';

const ratesGenerator = require('./ratesGenerator')({
  generator: chance,
  pairCount: PAIR_COUNT,
  updateInterval: UPDATE_INTERVAL,
});

const server = express();

// enable cors for *
if (isDevMode) {
  server.use(cors({ methods: 'GET, POST, PUT, DELETE' }));
}

server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

server.get('/configuration', (req, res) => {
  const appLoadTime = chance.integer({ min: 3000, max: 5000 });

  setTimeout(() => {
    res.json({
      currencyPairs: ratesGenerator.getCurrencyPairs(),
    });
  }, appLoadTime);
});

server.get('/rates', (req, res) => {
  const hasFailed = chance.floating({ min: 0, max: 1 }) < FAILURE_CHANCE;

  if (hasFailed) {
    res.sendStatus(500);
  } else {
    try {
      const allRates = ratesGenerator.getCurrentRates();
      const { currencyPairIds = [] } = req.query;

      const rates = {};
      // eslint-disable-next-line
      for (let pairId of currencyPairIds) {
        if (typeof allRates[pairId] !== 'undefined') {
          rates[pairId] = allRates[pairId];
        }
      }

      res.json({ rates });
    } catch (e) {
      res.sendStatus(400);
    }
  }
});

server.listen(3000, () => {
  console.log('Server is running on port 3000.');
});
