const express = require('express');
const router = express.Router();
const CategoryPrice = require('../models/CategoryPrice');
const { auth, checkRole, adminOnly } = require('../middleware/auth');

// Get all category prices
router.get('/', async (req, res) => {
  try {
    const categoryPrices = await CategoryPrice.find();
    res.json(categoryPrices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create or update category price (admin only)
router.put('/:type', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { type } = req.params;
    const updates = {
      description: req.body.description,
      lowSeason: req.body.lowSeason,
      highSeason: req.body.highSeason,
      currency: req.body.currency
    };

    const category = await CategoryPrice.findOneAndUpdate(
      { type },
      updates,
      { new: true, upsert: true, runValidators: true }
    );

    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a category (admin only)
router.delete('/:type', auth, adminOnly, async (req, res) => {
  try {
    const { type } = req.params;
    
    // Check if the category exists
    const category = await CategoryPrice.findOne({ type });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete the category
    await CategoryPrice.deleteOne({ type });
    
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Initialize default category prices
router.post('/initialize', auth, adminOnly, async (req, res) => {
  try {
    const defaultCategories = [
      {
        type: "Short Term Rental",
        description: "Short Term Rental (≤80 sq.m)",
        lowSeason: 8,
        highSeason: 12,
        sqm: 80,
        currency: "EUR"
      },
      {
        type: "Short Term Rental >80 sq.m",
        description: "Short Term Rental (>80 sq.m)",
        lowSeason: 9,
        highSeason: 15,
        sqm: 81,
        currency: "EUR"
      },
      {
        type: "Self Sustained Villa",
        description: "Self Sustained Villa",
        lowSeason: 9,
        highSeason: 18,
        sqm: null,
        currency: "EUR"
      },
      {
        type: "Self Sustained Residency <=80sq.m",
        description: "Self Sustained Residency (≤80sq.m)",
        lowSeason: 8,
        highSeason: 14,
        sqm: 80,
        currency: "EUR"
      },
      {
        type: "Self Sustained Residency >80sq.m",
        description: "Self Sustained Residency (>80sq.m)",
        lowSeason: 9,
        highSeason: 19,
        sqm: 81,
        currency: "EUR"
      }
    ];

    // Insert default categories if they don't exist
    const operations = defaultCategories.map(category => ({
      updateOne: {
        filter: { type: category.type },
        update: {
          $set: {
            ...category,
            sqm: category.sqm !== null ? Number(category.sqm) : null
          }
        },
        upsert: true
      }
    }));

    await CategoryPrice.bulkWrite(operations);
    
    const categoryPrices = await CategoryPrice.find();
    res.json(categoryPrices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;