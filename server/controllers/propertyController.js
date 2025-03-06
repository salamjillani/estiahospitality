// controllers/propertyController.js
const Property = require('../models/Property');
const Invoice = require('../models/Invoice');


exports.createProperty = async (req, res) => {
  try {
    const {
      title,
      type,
      vendorType,
      vendorDetails,
      profile,
      bankDetails,
      platformSettings
    } = req.body;

    const property = new Property({
      title,
      type,
      vendorType,
      vendorDetails,
      profile,
      bankDetails,
      platformSettings,
      createdBy: req.user._id,
      managers: [req.user._id]
    });

    await property.save();
    
    res.status(201).json({
      success: true,
      data: property
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      amenities,
      rules,
      location,
      bankDetails,
      platformSettings
    } = req.body;

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Update profile fields
    property.profile.description = description;
    property.profile.amenities = amenities;
    property.profile.rules = rules;
    property.profile.location = location;
    property.bankDetails = bankDetails;
    property.platformSettings = platformSettings;

    await property.save();

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { platform, reservation, amounts } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    const platformConfig = property.platformSettings[platform];
    if (!platformConfig || !platformConfig.enabled) {
      return res.status(400).json({
        success: false,
        error: `Property not configured for ${platform}`
      });
    }

    const invoice = new Invoice({
      property: propertyId,
      platform,
      issuedDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      reservation,
      amounts,
      taxDetails: platformConfig.taxDetails,
      vendorDetails: {
        name: property.vendorDetails.name,
        address: property.profile.location.address,
        taxIdentifier: platformConfig.taxDetails.taxId
      }
    });

    await invoice.save();
    const pdfBuffer = await generatePDF(invoice, property);
    
    res.json({
      success: true,
      data: {
        invoice,
        pdfUrl: `/api/invoices/${invoice._id}/pdf`
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};


exports.getProperty = async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  
  if (req.user.role !== 'admin') {
    property.bankDetails = undefined;
  }
  
  res.json({ success: true, data: property });
};

exports.uploadPhotos = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const files = req.files;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    const photos = files.map(file => ({
      url: `/uploads/properties/${file.filename}`,
      caption: '',
      isPrimary: false
    }));

    // If no primary photo exists, set the first uploaded photo as primary
    if (!property.profile.photos.some(photo => photo.isPrimary)) {
      photos[0].isPrimary = true;
    }

    property.profile.photos.push(...photos);
    await property.save();

    res.json({
      success: true,
      data: property.profile.photos
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}; 
