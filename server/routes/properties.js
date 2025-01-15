// server/routes/properties.js
const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Property = require('../models/Property');
const User = require('../models/User');

// Get all properties with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type } = req.query;
    const query = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { identifier: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by property type
    if (type) {
      query.type = type;
    }

    // Handle user role-based access
    if (req.user.role !== 'admin') {
      query._id = { $in: req.user.assignedProperties };
    }

    const options = {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const properties = await Property.find(query, null, options)
      .populate('owner', 'name email')
      .populate('managers', 'name email');

    const total = await Property.countDocuments(query);

    res.json({
      properties,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalProperties: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new property
router.post('/', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { title, type, identifier, managers } = req.body;

    // Validate required fields
    if (!title || !type || !identifier) {
      return res.status(400).json({ message: 'Title, type, and identifier are required' });
    }

    // Check for duplicate identifier
    const existingProperty = await Property.findOne({ identifier });
    if (existingProperty) {
      return res.status(400).json({ message: 'Property identifier already exists' });
    }

    // Validate and get manager users
    let validManagers = [];
    if (managers && managers.length > 0) {
      validManagers = await User.find({
        _id: { $in: managers },
        role: 'manager'
      });

      if (validManagers.length !== managers.length) {
        return res.status(400).json({ message: 'One or more invalid manager IDs' });
      }
    }

    const property = new Property({
      title,
      type,
      identifier,
      owner: req.user._id,
      managers: validManagers.map(manager => manager._id)
    });

    await property.save();

    // Update assigned properties for managers
    if (validManagers.length > 0) {
      await User.updateMany(
        { _id: { $in: validManagers.map(manager => manager._id) } },
        { $addToSet: { assignedProperties: property._id } }
      );
    }

    const populatedProperty = await Property.findById(property._id)
      .populate('owner', 'name email')
      .populate('managers', 'name email');

    res.status(201).json(populatedProperty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update property
router.put('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { title, type, identifier, managers } = req.body;
    const propertyId = req.params.id;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check for duplicate identifier if changed
    if (identifier !== property.identifier) {
      const existingProperty = await Property.findOne({ identifier });
      if (existingProperty) {
        return res.status(400).json({ message: 'Property identifier already exists' });
      }
    }

    // Validate and get manager users
    let validManagers = [];
    if (managers && managers.length > 0) {
      validManagers = await User.find({
        _id: { $in: managers },
        role: 'manager'
      });

      if (validManagers.length !== managers.length) {
        return res.status(400).json({ message: 'One or more invalid manager IDs' });
      }
    }

    // Remove property from previous managers' assignedProperties
    await User.updateMany(
      { _id: { $in: property.managers } },
      { $pull: { assignedProperties: propertyId } }
    );

    // Update property
    property.title = title || property.title;
    property.type = type || property.type;
    property.identifier = identifier || property.identifier;
    property.managers = validManagers.map(manager => manager._id);

    await property.save();

    // Update new managers' assignedProperties
    await User.updateMany(
      { _id: { $in: validManagers.map(manager => manager._id) } },
      { $addToSet: { assignedProperties: propertyId } }
    );

    const updatedProperty = await Property.findById(propertyId)
      .populate('owner', 'name email')
      .populate('managers', 'name email');

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

    // Remove property from managers' assignedProperties
    await User.updateMany(
      { _id: { $in: property.managers } },
      { $pull: { assignedProperties: property._id } }
    );

    // Delete property
    await Property.findByIdAndDelete(req.params.id);

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// In server/routes/properties.js
router.post('/:id/listings', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    property.listingUrls = property.listingUrls || [];
    property.listingUrls.push(req.body.listingUrl);
    await property.save();
    
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;