// server/routes/bookingAgents.js (New File)
const express = require('express');
const router = express.Router();
const BookingAgent = require('../models/BookingAgent');

router.get('/', async (req, res) => {
  try {
    const agents = await BookingAgent.find().sort({ name: 1 });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, commissionPercentage } = req.body;
    const agent = new BookingAgent({ name, commissionPercentage });
    await agent.save();
    res.status(201).json(agent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const agent = await BookingAgent.findByIdAndDelete(req.params.id);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;