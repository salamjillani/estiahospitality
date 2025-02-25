// server/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["client", "owner", "admin"],
      default: "client",
    },
    ownedProperties: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    ],
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],

    isVerified: {
      type: Boolean,
      default: false,
    },
    adminSecretUsed: {
      type: Boolean,
      default: false,
    },
    permissions: {
      canManageProperties: { type: Boolean, default: false },
      canManageBookings: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
    },
    managedProperties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
      },
    ],
    assignedProperties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
