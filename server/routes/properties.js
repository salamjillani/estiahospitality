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

router.post(
  "/",
  auth,
  checkRole(["admin", "manager"]),
  upload.array("photos"),
  async (req, res) => {
    try {
      if (typeof req.body.type !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid type format - must be a string",
        });
      }
      const validTypes = ["villa", "holiday_apartment", "hotel", "cottage"];
      const receivedType = req.body.type?.trim().toLowerCase();

      if (!receivedType || !validTypes.includes(receivedType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid property type. Valid types are: ${validTypes.join(
            ", "
          )}`,
        });
      }
      console.log("Received type:", req.body.type);
      console.log("Body:", req.body);
      console.log("Files:", req.files);
      console.log("User:", req.user);
      if (
        !req.body.type ||
        typeof req.body.type !== "string" ||
        !["villa", "holiday_apartment", "hotel", "cottage"].includes(
          req.body.type.trim().toLowerCase()
        )
      ) {
        return res
          .status(400)
          .json({ message: "Invalid or missing property type" });
      }

      console.log("Received type:", receivedType);

      let location = {};
      let bankDetails = {};

      try {
        location = req.body.location ? JSON.parse(req.body.location) : {};
        bankDetails = req.body.bankDetails
          ? JSON.parse(req.body.bankDetails)
          : {};
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON in location or bank details",
          error: parseError.message,
        });
      }

      // Process uploaded photos
      const photos = req.files
        ? req.files.map((file, index) => {
            // Get the corresponding photo metadata if it exists
            let photoData = {};
            try {
              photoData = req.body.photoData
                ? JSON.parse(req.body.photoData[index])
                : {};
            } catch (e) {
              photoData = {};
            }

            return {
              url: `/uploads/properties/${file.filename}`,
              filename: file.filename,
              caption: photoData.caption || "",
              isPrimary: photoData.isPrimary || false,
            };
          })
        : [];

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
        type: receivedType,
        identifier: generateUniqueIdentifier(),
        profile: {
          description: req.body.description,
          location: {
            address: location.address,
            city: location.city,
            country: location.country,
            postalCode: location.postalCode,
          },
        },
        vendorType: req.body.vendorType || "individual",

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

// Return the complete populated property data
const populatedProperty = await Property.findById(property._id)
  .populate('createdBy', 'name email')
  .populate('managers', 'name email');

      // Send successful response with the created property
      res.status(201).json({
        success: true,
        property,
      });
    } catch (error) {
      console.error("Property creation error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create property",
      });
    }
  }
);

router.put(
  "/:id",
  auth,
  checkRole(["admin", "manager"]),
  upload.array("photos"),
  async (req, res) => {
    try {
      const { id } = req.params;
      let updates = { ...req.body };

      // Modified JSON parsing logic
      try {
        // Parse profile if exists
        if (updates.profile && typeof updates.profile === "string") {
          updates.profile = JSON.parse(updates.profile);
        }

        // Parse location if sent separately
        if (updates.location && typeof updates.location === "string") {
          updates.location = JSON.parse(updates.location);
          updates.profile = updates.profile || {};
          updates.profile.location = updates.location;
        }

        // Parse bankDetails if exists
        if (updates.bankDetails && typeof updates.bankDetails === "string") {
          updates.bankDetails = JSON.parse(updates.bankDetails);
        }
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON in profile, location, or bank details",
          error: parseError.message,
        });
      }

      if (!updates.type) {
        const existingProperty = await Property.findById(id);
        if (existingProperty) {
          updates.type = existingProperty.type;
        }
      }

      if (
        updates.type &&
        !["villa", "holiday_apartment", "hotel", "cottage"].includes(
          updates.type
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid property type. Must be one of: villa, holiday_apartment, hotel, cottage",
        });
      }

      try {
        if (typeof updates.location === "string") {
          const locationData = JSON.parse(updates.location);

          updates.profile = {
            ...(updates.profile || {}),
            location: {
              address: locationData.address,
              city: locationData.city,
              country: locationData.country,
              postalCode: locationData.postalCode,
            },
          };
        }

        if (updates.location) {
          updateData.profile = {
            ...(property.profile?.toObject() || {}),
            location: updates.location,
          };
        }

        if (typeof updates.bankDetails === "string") {
          updates.bankDetails = JSON.parse(updates.bankDetails);
        }
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON in location or bank details",
          error: parseError.message,
        });
      }
      if (req.files?.length) {
        const newPhotos = req.files.map((file) => ({
          url: `/uploads/properties/${file.filename}`, 
          caption: "",
          isPrimary: false,
        }));
        updates.$push = { photos: { $each: newPhotos } };
      }

      // Preserve existing photos
      const existingProperty = await Property.findById(id);
      if (existingProperty?.photos) {
        updates.photos = existingProperty.photos;
      }

      

      // Find and verify authorization
      const property = await Property.findById(id);
      if (!property) {
        return res.status(404).json({
          success: false,
          message: "Property not found",
        });
      }

      const isAuthorized =
        req.user.role === "admin" ||
        property.managers.some((m) => m.toString() === req.user._id.toString());

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access",
        });
      }

      // Update only allowed fields
      const allowedUpdates = [
        "title",
        "type",
        "profile",
        "bankDetails",
        "photos",
        "vendorType",
        "identifier",
      ];

      const updateData = {
        ...updates,
        profile: {
          ...(updates.profile || {}),
        },
        bankDetails: {
          ...(updates.bankDetails || {}),
        },
      };

      const updatedProperty = await Property.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedProperty) {
        return res.status(404).json({
          success: false,
          message: "Property not found after update",
        });
      }

      // Broadcast update event if needed
      if (req.app.locals.broadcast) {
        req.app.locals.broadcast("property_updated", updatedProperty);
      }
      console.log("Updated property:", updatedProperty);
      res.json({
        success: true,
        property: updatedProperty,
      });
    } catch (error) {
      console.error("Property update error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error updating property",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
    console.log("Received update payload:", req.body);
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
      .populate("managers", "name email")
      .lean();

    // Corrected formatting: Keep photos at the top level
    const formattedProperties = properties.map((property) => ({
      ...property,
      photos: property.photos?.map(photo => ({
        url: photo?.url || '',
        caption: photo?.caption || '',
        isPrimary: photo?.isPrimary || false
      })) || [],
      profile: {
        description: property.profile?.description || "",
        location: {
          address: property.profile?.location?.address || "",
          city: property.profile?.location?.city || "",
          country: property.profile?.location?.country || "",
          postalCode: property.profile?.location?.postalCode || "",
        },
      },
      // Keep photos array at top level
      photos:
        property.photos?.map((photo) => ({
          url: photo.url || "",
          caption: photo.caption || "",
          isPrimary: photo.isPrimary || false,
        })) || [],
      bankDetails: property.bankDetails || {
        accountHolder: "",
        accountNumber: "",
        bankName: "",
        swiftCode: "",
        iban: "",
        currency: "USD",
      },
    }));

    res.json({
      success: true,
      properties: formattedProperties,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching properties",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});


module.exports = router;
