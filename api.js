const router = require('express').Router();
const c = require('../controllers/contactController');
router.post('/analyze', c.analyze);
router.post('/check-duplicates', c.check);
router.post('/save-to-sheet', c.save);
module.exports = router;
