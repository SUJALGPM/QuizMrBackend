const express = require("express");
const router = express.Router();
const multer = require('multer');
const { handleAdminLogoPost, handleUpdateAdminLogo, getLogoById } = require("../controllers/adminlogo");

// Create a multer storage configuration
const storage = multer.diskStorage({
    destination: "./uploads",
    filename: function (req, file, cb) {

        const trimmedOriginalname = file.originalname.replace(/\s+/g, '');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const finalFilename = `${Date.now()}-${trimmedOriginalname}`;
        cb(null, finalFilename);
    }
});

const upload = multer({ storage: storage });


// Admin Logo's routes
router.route("/create-admin-logo").post(upload.single('image'), handleAdminLogoPost);
router.route("/update-admin-logo/:id").put(upload.single('image'), handleUpdateAdminLogo);
router.route("/get-logo/:id").get(getLogoById)

module.exports = router;
