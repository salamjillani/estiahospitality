const express = require('express');
const router = express.Router();
const Pricing = require('../models/Pricing');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const pricings = await Pricing.find().populate('property', 'title type');
    res.json(pricings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/property/:propertyId', auth, async (req, res) => {
  try {
    const pricings = await Pricing.find({ property: req.params.propertyId });
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
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { type, month, year, blockPrices, datePrices, property } = req.body;
    
    const pricing = new Pricing({
      type,
      month,
      year,
      blockPrices,
      datePrices: datePrices.map(dp => ({
        date: new Date(dp.date),
        price: dp.price
      })),
      property
    });

    await pricing.save();
    res.status(201).json(pricing);
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