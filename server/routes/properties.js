const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/propertyController");
const { auth, checkRole } = require("../middleware/auth");
const Property = require("../models/Property");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const sanitize = require("sanitize-filename");
const fs = require("fs");

// Configure absolute paths for uploads
const uploadDir = path.join(__dirname, "../../uploads/properties");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Improved Multer configuration with absolute paths
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const cleanName = sanitize(file.originalname);
    const ext = path.extname(cleanName);
    const baseName = path.basename(cleanName, ext);
    cb(null, `property-${Date.now()}-${baseName}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  allowedTypes.includes(file.mimetype)
    ? cb(null, true)
    : cb(
        new Error("Invalid file type. Only JPEG, PNG, and WEBP are allowed!"),
        false
      );
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// Unified error handling middleware
const handleErrors = (res, error, defaultMessage = "An error occurred") => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: error.message || defaultMessage,
    error: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
};

// Create property with enhanced validation
// In your propertyRoutes.js
router.post(
  "/",
  auth,
  checkRole(["admin", "manager"]),
  upload.array("photos"),
  async (req, res) => {
    try {
      console.log("Received property creation request");
      console.log("Body:", req.body);
      console.log("Files:", req.files);
      console.log("User:", req.user);
      if (!req.body.title || !req.body.type) {
        return res.status(400).json({
          success: false,
          message: "Title and type are required",
        });
      }

      // Parse JSON strings
      let location = {},
        bankDetails = {};
      try {
        if (req.body.location) {
          location = JSON.parse(req.body.location);
        }
        if (req.body.bankDetails) {
          bankDetails = JSON.parse(req.body.bankDetails);
        }
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON in location or bank details",
        });
      }
  // Inside POST handler
  const generateUniqueIdentifier = () => {
    return (
      "PROP-" +
      Date.now().toString(36).toUpperCase() +
      Math.floor(1000 + Math.random() * 9000)
    );
  };
      // Create property object
      const propertyData = {
        title: req.body.title,
        type: req.body.type,
        identifier: generateUniqueIdentifier(),
        description: req.body.description || "",
        vendorType: req.body.vendorType || "individual",
        location,
        bankDetails,
        photos: req.files
          ? req.files.map((file) => ({
              url: `/uploads/properties/${file.filename}`,
              caption: "",
              isPrimary: false,
            }))
          : [],
        createdBy: req.user._id,
        managers: [req.user._id],
      };

      const property = new Property(propertyData);
      await property.save();
    


      res.status(201).json({
        success: true,
        property,
      });
    } catch (error) {
      console.error("Property creation error:", {
        message: error.message,
        stack: error.stack,
        body: req.body,
        files: req.files,
      });
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create property",
      });
    }
  }
);

// Update property with proper validation
router.put(
  "/:id",
  auth,
  checkRole(["admin", "manager"]),
  upload.none(), // Handle multipart without files
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Parse JSON fields
      if (updates.location) updates.location = JSON.parse(updates.location);
      if (updates.bankDetails)
        updates.bankDetails = JSON.parse(updates.bankDetails);

      const property = await Property.findByIdAndUpdate(id, updates, {
        new: true,
      });

      const isAuthorized =
        req.user.role === "admin" ||
        property.managers.some((m) => m.toString() === req.user._id.toString());
      if (!isAuthorized) {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized access" });
      }

      const allowedUpdates = [
        "title",
        "type",
        "description",
        "location",
        "bankDetails",
        "photos",
        "vendorType",
        "identifier"
      ];
      
      const validUpdates = Object.keys(updates).filter((key) =>
        allowedUpdates.includes(key)
      );

      validUpdates.forEach((update) => (property[update] = updates[update]));

      const updatedProperty = await property.save();
      req.app.locals.broadcast("property_profile_updated", property);
      res.json({ success: true, property });
    } catch (error) {
      handleErrors(res, error, "Error updating property");
    }
  }
);

// Enhanced invoice generation
router.post(
  "/:propertyId/invoice",
  auth,
  checkRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { platform } = req.body;

      if (!platform) {
        return res
          .status(400)
          .json({ success: false, message: "Platform is required" });
      }

      const property = await Property.findById(propertyId);
      if (!property) {
        return res
          .status(404)
          .json({ success: false, message: "Property not found" });
      }

      // Add actual invoice generation logic here
      const invoice = {
        invoiceNumber: `INV-${Date.now()}`,
        property: property._id,
        platform,
        amount: 1000, // Replace with actual calculation
        date: new Date(),
        generatedBy: req.user._id,
      };

      req.app.locals.broadcast("invoice_generated", invoice);
      res.json({ success: true, invoice });
    } catch (error) {
      handleErrors(res, error, "Error generating invoice");
    }
  }
);

// Photo upload with proper handling
router.post(
  "/:propertyId/photos",
  auth,
  checkRole(["admin", "manager"]),
  upload.array("photos", 10),
  async (req, res) => {
    try {
      const { propertyId } = req.params;

      if (!req.files?.length) {
        return res
          .status(400)
          .json({ success: false, message: "No photos uploaded" });
      }

      const property = await Property.findById(propertyId);
      if (!property) {
        return res
          .status(404)
          .json({ success: false, message: "Property not found" });
      }

      const newPhotos = req.files.map((file) => ({
        url: `/uploads/properties/${file.filename}`,
        filename: file.filename,
        caption: "",
        isPrimary: false,
      }));

      property.photos.push(...newPhotos);
      await property.save();

      req.app.locals.broadcast("photos_uploaded", {
        propertyId,
        photos: newPhotos,
      });

      res.json({
        success: true,
        message: "Photos uploaded successfully",
        photos: newPhotos,
      });
    } catch (error) {
      handleErrors(res, error, "Error uploading photos");
    }
  }
);
router.delete(
  "/:id",
  auth,
  checkRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const property = await Property.findByIdAndDelete(req.params.id);
      if (!property) {
        return res
          .status(404)
          .json({ success: false, message: "Property not found" });
      }
      res.json({ success: true, message: "Property deleted" });
    } catch (error) {
      handleErrors(res, error, "Error deleting property");
    }
  }
);

router.get("/", auth, async (req, res) => {
  try {
    const properties = await Property.find()
      .populate("createdBy", "name email")
      .populate("managers", "name email");
    res.json({ success: true, properties });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching properties" });
  }
});


module.exports = router;
