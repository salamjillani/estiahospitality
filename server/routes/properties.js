const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Property = require('../models/Property');
const User = require('../models/User');

// Get all properties
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // If user is not admin, only return assigned properties
    if (req.user.role !== 'admin') {
      query._id = { $in: req.user.assignedProperties };
    }
    
    const properties = await Property.find(query)
      .populate('owner', 'name email')
      .populate('managers', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ properties });
  } catch (error) {
    console.error('Error in GET /properties:', error);
    res.status(500).json({ 
      message: 'Error fetching properties', 
      error: error.message 
    });
  }
});

// Create new property
router.post('/', auth, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    console.log('User attempting to create property:', {
      userId: req.user._id,
      role: req.user.role
    }); 
    const { title, type, identifier } = req.body;

    if (!title || !type || !identifier) {
      return res.status(400).json({ 
        message: 'Title, type, and identifier are required' 
      });
    }

    const existingProperty = await Property.findOne({ identifier });
    if (existingProperty) {
      return res.status(400).json({ 
        message: 'Property identifier already exists' 
      });
    }

    const property = new Property({
      title,
      type,
      identifier,
      owner: req.user._id,
      managers: [req.user._id] 
    });

    await property.save();
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { assignedProperties: property._id } }
    );

    const populatedProperty = await Property.findById(property._id)
      .populate('owner', 'name email')
      .populate('managers', 'name email');

    // Broadcast to WebSocket clients
    req.app.locals.broadcast('property_created', populatedProperty);

    res.status(201).json(populatedProperty);
  } catch (error) {
    console.error('Error in POST /properties:', error);
    res.status(500).json({ 
      message: 'Error creating property', 
      error: error.message 
    });
  }
});
// Add these routes to server/routes/properties.js

// Update property
router.put('/:id', auth, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const { title, type, identifier } = req.body;
    
    // Validate required fields
    if (!title || !type || !identifier) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if property exists
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check if user has permission to edit this property
    if (req.user.role !== 'admin' && !property.managers.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if new identifier is already in use by another property
    const existingProperty = await Property.findOne({ 
      identifier, 
      _id: { $ne: req.params.id } 
    });
    if (existingProperty) {
      return res.status(400).json({ message: 'Property identifier already exists' });
    }
    
    // Update the property
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      { title, type, identifier },
      { new: true }
    ).populate('owner', 'name email')
     .populate('managers', 'name email');
    
    // Broadcast update via WebSocket
    req.app.locals.broadcast('property_updated', updatedProperty);
    
    res.json(updatedProperty);
  } catch (error) {
    console.error('Error in PUT /properties/:id:', error);
    res.status(500).json({ 
      message: 'Error updating property', 
      error: error.message 
    });
  }
});

// Delete property
router.delete('/:id', auth, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    // Check if property exists
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check if user has permission to delete this property
    if (req.user.role !== 'admin' && !property.managers.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete the property
    await Property.findByIdAndDelete(req.params.id);
    
    // Remove property reference from users' assignedProperties
    await User.updateMany(
      { assignedProperties: req.params.id },
      { $pull: { assignedProperties: req.params.id } }
    );
    
    // Broadcast deletion via WebSocket
    req.app.locals.broadcast('property_deleted', { _id: req.params.id });
    
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /properties/:id:', error);
    res.status(500).json({ 
      message: 'Error deleting property', 
      error: error.message 
    });
  }
});
module.exports = router;