const mongoose = require("mongoose");

const categoryPriceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  lowSeason: {
    type: Number,
    required: true,
    min: 1
  },
  highSeason: {
    type: Number,
    required: true,
    min: 1
  },
  currency: {
    type: String,
    default: "EUR",
    enum: ["USD", "EUR", "GBP", "INR", "JPY"]
  }
}, { timestamps: true });

module.exports = mongoose.model("CategoryPrice", categoryPriceSchema);