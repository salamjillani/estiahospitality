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

      console.log('Saved property:', {
        propertyId: populatedProperty._id,
        managers: populatedProperty.managers.map(m => ({
          id: m._id,
          name: m.name,
          email: m.email
        }))
      });

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

router.put('/:id', auth, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    console.log('Update property request:', {
      userId: req.user._id,
      userRole: req.user.role,
      propertyId: req.params.id
    });

    const { title, type, identifier } = req.body;
    
    // Validate required fields
    if (!title || !type || !identifier) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if property exists
    const property = await Property.findById(req.params.id);
    console.log('Found property:', {
      property: property?._id,
      managers: property?.managers,
      owner: property?.owner
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Debug manager check
    const managerIds = property.managers.map(id => id.toString());
    const userId = req.user._id.toString();
    const isManager = managerIds.includes(userId);
    
    console.log('Access check:', {
      userRole: req.user.role,
      userId: userId,
      managerIds: managerIds,
      isManager: isManager,
      isAdmin: req.user.role === 'admin'
    });

    // Allow access if user is admin or manager of the property
    if (req.user.role === 'admin' || isManager) {
      // Update the property
      const updatedProperty = await Property.findByIdAndUpdate(
        req.params.id,
        { title, type, identifier },
        { new: true }
      ).populate('owner', 'name email')
       .populate('managers', 'name email');
      
      console.log('Property updated:', {
        propertyId: updatedProperty._id,
        managers: updatedProperty.managers.map(m => m._id)
      });

      // Broadcast update via WebSocket
      req.app.locals.broadcast('property_updated', updatedProperty);
      
      return res.json(updatedProperty);
    } else {
      console.log('Access denied:', {
        userRole: req.user.role,
        userId: userId,
        isManager: isManager
      });
      return res.status(403).json({ 
        message: 'Access denied',
        details: {
          userRole: req.user.role,
          isManager: isManager,
        }
      });
    }
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
    console.log('Delete property request:', {
      userId: req.user._id,
      userRole: req.user.role,
      propertyId: req.params.id
    });

    // Check if property exists
    const property = await Property.findById(req.params.id);
    console.log('Found property:', {
      property: property?._id,
      managers: property?.managers,
      owner: property?.owner
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Debug manager check
    const managerIds = property.managers.map(id => id.toString());
    const userId = req.user._id.toString();
    const isManager = managerIds.includes(userId);
    
    console.log('Access check:', {
      userRole: req.user.role,
      userId: userId,
      managerIds: managerIds,
      isManager: isManager,
      isAdmin: req.user.role === 'admin'
    });

    // Allow access if user is admin or manager of the property
    if (req.user.role === 'admin' || isManager) {
      // Delete the property
      await Property.findByIdAndDelete(req.params.id);
      
      // Remove property reference from users' assignedProperties
      await User.updateMany(
        { assignedProperties: req.params.id },
        { $pull: { assignedProperties: req.params.id } }
      );
      
      console.log('Property deleted successfully:', {
        propertyId: req.params.id
      });

      // Broadcast deletion via WebSocket
      req.app.locals.broadcast('property_deleted', { _id: req.params.id });
      
      return res.json({ message: 'Property deleted successfully' });
    } else {
      console.log('Access denied:', {
        userRole: req.user.role,
        userId: userId,
        isManager: isManager
      });
      return res.status(403).json({ 
        message: 'Access denied',
        details: {
          userRole: req.user.role,
          isManager: isManager,
        }
      });
    }
  } catch (error) {
    console.error('Error in DELETE /properties/:id:', error);
    res.status(500).json({ 
      message: 'Error deleting property', 
      error: error.message 
    });
  }
});
module.exports = router;