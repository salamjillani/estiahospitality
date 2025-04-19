// In server/models/Pricing.js
const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
    type: {
      type: String,
      enum: ['monthly', 'date'],
      required: true
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: function() {
        return !this.isGlobalTemplate;
      }
    },
    isGlobalTemplate: {
      type: Boolean,
      default: false
    },
    month: {
      type: Number,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      min: new Date().getFullYear() - 1,
      max: new Date().getFullYear() + 5
    },
    datePrices: [{
      date: {
        type: Date,
        required: true,
        validate: {
          validator: function(v) {
            return !isNaN(new Date(v).getTime());
          },
          message: props => `${props.value} is not a valid date!`
        }
      },
      price: {
        type: Number,
        min: 1,
        required: true
      }
    }],
    blockPrices: [{
      startDay: {
        type: Number,
        min: 1,
        max: 31,
        required: true
      },
      endDay: {
        type: Number,
        min: 1,
        max: 31,
        required: true
      },
      price: {
        type: Number,
        min: 1,
        required: true
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  const Pricing = mongoose.model('Pricing', pricingSchema);
module.exports = Pricing;