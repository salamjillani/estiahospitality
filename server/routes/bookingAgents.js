// server/routes/bookingAgents.js (New File)
const express = require('express');
const router = express.Router();
const BookingAgent = require('../models/BookingAgent');
const { auth, checkRole} = require('../middleware/auth');

router.get('/',  auth, checkRole(['admin']), async (req, res) => {
  try {
    const agents = await BookingAgent.find().sort({ name: 1 });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { name, commissionPercentage } = req.body;
    const agent = new BookingAgent({ name, commissionPercentage });
    await agent.save();
    res.status(201).json(agent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const agent = await BookingAgent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    res.json(agent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const agent = await BookingAgent.findByIdAndDelete(req.params.id);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;