const express = require('express');
const router = express.Router();
const Pricing = require('../models/Pricing');
const Property = require('../models/Property');
const { auth, adminOnly } = require('../middleware/auth');
const mongoose = require('mongoose'); 

router.get('/', async (req, res) => {
  try {
    const pricings = await Pricing.find().populate('property', 'title type');
    
    // Map date objects to ISO strings for datePrices
    const formattedPricings = pricings.map(pricing => {
      const formattedPricing = pricing.toObject();
      if (formattedPricing.datePrices && formattedPricing.datePrices.length > 0) {
        formattedPricing.datePrices = formattedPricing.datePrices.map(dp => ({
          ...dp,
          date: dp.date instanceof Date ? dp.date.toISOString() : dp.date
        }));
      }
      return formattedPricing;
    });
    
    res.json(formattedPricings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/property/:propertyId', auth, async (req, res) => {
  try {
    const pricings = await Pricing.find({
      $or: [
        { property: req.params.propertyId },
        { type: 'date', isGlobalTemplate: true }
      ]
    });
    res.json(pricings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const updatedPricing = await Pricing.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        datePrices: req.body.datePrices.map(dp => ({
          date: new Date(dp.date),
          price: dp.price
        }))
      },
      { new: true }
    );
    res.json(updatedPricing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});



router.post('/bulk', auth, adminOnly, async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    
    const { type, month, year, blockPrices, datePrices, applyToAllProperties } = req.body;
    const now = new Date();
    let template;
    let updatedPricings = [];

    if (applyToAllProperties) {
      // Create global template
      template = new Pricing({
        type,
        month,
        year,
        blockPrices,
        datePrices: datePrices.map(dp => ({
          date: new Date(dp.date),
          price: dp.price
        })),
        isGlobalTemplate: true,
        createdAt: now,
        updatedAt: now
      });
      
      await template.save({ session });

      // Apply to all properties
      const properties = await Property.find().session(session);
      
      for (const property of properties) {
        // Check if pricing for this property and timeframe already exists
        const existingPricing = await Pricing.findOne({
          property: property._id,
          type,
          ...(type === 'monthly' && { month, year })
        }).session(session);

        if (existingPricing) {
          // Update existing pricing
          existingPricing.blockPrices = blockPrices;
          existingPricing.datePrices = datePrices.map(dp => ({
            date: new Date(dp.date),
            price: dp.price
          }));
          existingPricing.updatedAt = now;
          await existingPricing.save({ session });
          updatedPricings.push(existingPricing);
        } else {
          // Create new pricing
          const newPricing = new Pricing({
            property: property._id,
            type,
            month,
            year,
            blockPrices,
            datePrices: datePrices.map(dp => ({
              date: new Date(dp.date),
              price: dp.price
            })),
            isGlobalTemplate: false,
            createdAt: now,
            updatedAt: now
          });
          
          await newPricing.save({ session });
          updatedPricings.push(newPricing);
        }
      }
    }

    await session.commitTransaction();
    session.endSession();
    
    // Fetch updated pricings with populated property data
    const finalPricings = await Pricing.find({
      $or: [
        { _id: template?._id },
        { _id: { $in: updatedPricings.map(p => p._id) } }
      ]
    }).populate('property', 'title');

    res.json({ pricings: finalPricings });
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    res.status(500).json({
      message: err.message,
      errorDetails: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});


router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { type, month, year, blockPrices, datePrices, property, isGlobalTemplate } = req.body;
    
    // For date pricing, create a single record marked as global template
    if (type === 'date') {
      // Check if a similar date pricing already exists
      const existingDatePricing = await Pricing.findOne({
        type: 'date',
        isGlobalTemplate: true,
        'datePrices.date': { 
          $in: datePrices.map(dp => new Date(dp.date)) 
        }
      });
      
      if (existingDatePricing) {
        return res.status(400).json({ 
          message: "A date pricing overlapping with these dates already exists" 
        });
      }
      
      const pricing = new Pricing({
        type: 'date',
        isGlobalTemplate: true,
        datePrices: datePrices.map(dp => ({
          date: new Date(dp.date),
          price: Number(dp.price)
        }))
      });
      
      const savedPricing = await pricing.save();
      return res.status(201).json(savedPricing);
    }
    
    // For monthly pricing
    const pricing = new Pricing({
      type,
      month,
      year,
      blockPrices,
      datePrices: [],
      property: !isGlobalTemplate ? property : undefined,
      isGlobalTemplate
    });

    const savedPricing = await pricing.save();
    return res.status(201).json(savedPricing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Pricing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pricing deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;