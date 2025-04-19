const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const { auth, checkRole, adminOnly} = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    // Return all properties for both admins and owners
    const properties = await Property.find();
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/public', async (req, res) => {
  try {
    const properties = await Property.find().limit(3).select('-bankDetails');
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json(property);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// server/routes/properties.js
router.get('/owned', auth, checkRole(['owner']), async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id });
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// properties.js
router.get('/owner/:ownerId', auth, async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.params.ownerId });
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// In your properties route (server)
router.post('/', auth, checkRole(['admin']), async (req, res) => {
  try {
    if (!req.body.bankDetails?.currency) {
      return res.status(400).json({ message: 'Currency is required' });
    }

    const newProperty = new Property({ 
      ...req.body,
      createdBy: req.user._id 
    });
    
    await newProperty.save();

  
    res.status(201).json(newProperty);

 
    try {
      req.app.locals.broadcast('property_created', newProperty);
    } catch (broadcastError) {
      console.error('Broadcast failed:', broadcastError);
    }

  } catch (err) {
  
    console.error('Property creation error:', err);
    res.status(500).json({ 
      message: err.message || 'Property creation failed' 
    });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
   
    const property = await Property.findByIdAndUpdate(
      req.params.id,
     
      req.body,
      { new: true }
    );
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json(property);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', auth, checkRole(['admin']), adminOnly, async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json({ message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// server/routes/properties.js - Add admin routes
router.get('/admin', auth, checkRole(['admin']), async (req, res) => {
  try {
    const properties = await Property.find().populate('owner');
    res.json(properties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/admin/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(property);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});



module.exports = router;