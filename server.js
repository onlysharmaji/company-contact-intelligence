const path = require('path'), express = require('express'), cors = require('cors'), rateLimit = require('express-rate-limit');
const cfg = require('./config');
const app = express();
app.use(cors({ origin: cfg.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Request limit reached. Please try again later.' } }));
app.use('/api', require('./routes/api'));
app.use(express.static(path.join(__dirname, '../../frontend')));
app.listen(cfg.port, () => console.log(`Company Contact Intelligence running on http://localhost:${cfg.port}`));
