const express = require("express")
const router = express.Router();

const { postDrData, getDoctorName, handleUserDataById, handleUserQuizSubmit, handleLeaderBoardFilter, handleLeaderFilterByCategoryName, handleUsersStateAndName, handleOnlyNameWithId, handleUserCategory, handleUserCategoryWithQuestion, handleDoctorStatus, handleAddDoctorV2, handleUserQuizSubmitV2, handleDoctorUpdate } = require("../controllers/Quiz");



router.post("/user", postDrData);
router.get("/get/docter/name", getDoctorName);
router.get("/get/users/:userId", handleUserDataById);
router.post("/submit/score", handleUserQuizSubmit);
router.post("/v2/submit/score", handleUserQuizSubmitV2);
router.post("/get/filter/leaderboard", handleLeaderBoardFilter);
router.get("/get/leaderboard/:categoryName/:mrId", handleLeaderFilterByCategoryName);
router.get("/get/users-name-state-city", handleUsersStateAndName);
router.post('/get/get-only-name-with-id', handleOnlyNameWithId);
router.get("/get/user-category/:userId", handleUserCategory);
router.get("/get/user-category-with-mulquestions-fourquestions/:mrId", handleUserCategoryWithQuestion);
router.put("/update-doctor-detail", handleDoctorUpdate);
router.route("/old-new-doctor-list").get(handleDoctorStatus);
router.route("/v2/user").post(handleAddDoctorV2);





module.exports = router