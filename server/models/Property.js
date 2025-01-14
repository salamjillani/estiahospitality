const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['cottage', 'apartment', 'villa', 'room'],
    },
    identifier: {
      type: String,
      required: true,
      unique: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    managers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure unique identifiers
propertySchema.pre('save', async function (next) {
  if (!this.isModified('identifier')) return next();
  const existingProperty = await Property.findOne({ identifier: this.identifier });
  if (existingProperty) {
    throw new Error('Property identifier must be unique');
  }
  next();
});

// Middleware to populate managers and owner fields when querying properties
propertySchema.pre(/^find/, function (next) {
  this.populate('owner', 'name email')
      .populate('managers', 'name email');
  next();
});

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
