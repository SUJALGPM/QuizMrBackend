const express = require("express")
const router = express.Router();
const multer = require('multer');

const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

const { createMr, loginMr, GetDoctorsByMR, handleAdminSideReports, handleAllMrDoctorsData, handleAllMrDoctorsDataV2, handleForgetPassword, handleTopMrByDoctor, handleTopCategoryChart, handleTop20Mr, handleUpload, handleMrsRegion, handleAllMrDoctorsDataV3, handleAdminMrs, handleGetMrById, handleMrUpdate } = require("../controllers/Mr");


router.post("/create-mr/:id", createMr);
router.post("/login-mr", loginMr);
router.get("/get-mr-doctors/:id", GetDoctorsByMR);
// router.post("/upload-sheet/:id", upload.single('file'), handleSheetUpload);
router.post("/upload-sheet/:id", upload.single('file'), handleUpload);
router.get("/admin-side-reports", handleAdminSideReports);
router.get("/get-all-doctor-mrs-data", handleAllMrDoctorsData);
router.get("/v2/get-all-doctor-mrs-data", handleAllMrDoctorsDataV2);
router.get("/v3/get-all-doctor-mrs-data", handleAllMrDoctorsDataV3);
router.post("/forget-mr-password", handleForgetPassword);
router.get("/top-mr-by-doctor", handleTopMrByDoctor);
router.get("/top-category-chart", handleTopCategoryChart);
router.get("/get-top-20-mrs/:adminId", handleTop20Mr);
router.get("/mr-all-region", handleMrsRegion);
router.get("/admin-mrs/:id", handleAdminMrs);
router.get("/get-mr-by-id/:id", handleGetMrById);
router.put("/update-mr-details", handleMrUpdate);






module.exports = router