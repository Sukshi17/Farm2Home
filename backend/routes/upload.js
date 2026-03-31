const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/upload
router.post('/', auth, (req, res, next) => {
  req.uploadSubDir = req.body.subDir || 'general';
  next();
}, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const subDir = req.body.subDir || 'general';
    const fileUrl = `/uploads/${subDir}/${req.file.filename}`;
    res.json({ message: 'File uploaded', url: fileUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
