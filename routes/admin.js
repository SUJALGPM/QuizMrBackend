const express = require("express");
const router = express.Router();

const multer = require('multer');

const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

const { handleAdminCreation, handleAdminLogin, handleAdminGet, handleUpdateAdmin, handleMrData, handleDoctorDataUnderAdmin, handleSuperAdminCount, handleSuperAdminCreate, handleCreateContentAdmin, handleReportAdminCreate, verifyJwtForClient } = require("../controllers/admin");

const { authenticateJwt } = require("../middlewares/auth");

const { handleAdminLogoPost, handleUpdateAdminLogo } = require("../controllers/adminlogo")


router.route("/create-admin").post(handleAdminCreation);
router.route("/admin-login").post(handleAdminLogin);

router.route("/get-admin/:id").get(handleAdminGet);
router.route("/update-admin/:id").patch(handleUpdateAdmin);

// admin mr and mrid Data
router.route("/mr-data/:id").get(handleMrData);

router.route('/v2/get/docter/name/:id').get(handleDoctorDataUnderAdmin);




// ADMIN CREATION LOGIC
router.route("/create-super-admin").post(authenticateJwt, handleSuperAdminCount, handleSuperAdminCreate);

router.route("/create-content-admin").post(authenticateJwt, handleCreateContentAdmin);


router.route("/create-report-admin").post(authenticateJwt, handleReportAdminCreate);





// verify token for json because in the client the jsonwebtoken is not working.
router.route("/verify-jwt-client/:token").get(verifyJwtForClient);



// admin logo's route
router.route("./create-admin-logo", upload.single('image')).post(handleAdminLogoPost);
router.route("./update-admin-logo", upload.single('image')).put(handleUpdateAdminLogo);



module.exports = router