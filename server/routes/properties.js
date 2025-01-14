// server/routes/properties.js
const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Property = require('../models/Property');

// Get all properties (admin) or assigned properties (non-admin)
router.get('/', auth, async (req, res) => {
  try {
    let properties;
    if (req.user.role === 'admin') {
      properties = await Property.find();
    } else {
      properties = await Property.find({
        _id: { $in: req.user.assignedProperties }
      });
    }
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new property (admin only)
router.post('/', auth, checkRole(['admin']), async (req, res) => {
  try {
    const property = new Property({
      ...req.body,
      owner: req.user._id
    });
    await property.save();
    res.status(201).json(property);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
// Update property
router.put('/:id', auth, checkRole(['admin']), async (req, res) => {
    try {
      const property = await Property.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      
      const updatedProperty = await Property.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      res.json(updatedProperty);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete property
  router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
    try {
      const property = await Property.findById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      await Property.findByIdAndDelete(req.params.id);
      res.json({ message: 'Property deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
module.exports = router;