const mrModel = require("../models/Mr");
const Quiz = require("../models/Quiz");
const xlsx = require("xlsx");
var nodemailer = require('nodemailer');
const AdminModel = require("../models/admin");
const flmModel = require("../models/Flm");
const SlmModel = require("../models/Slm");
const TlmModel = require("../models/Tlm");

// const handleSheetUpload = async (req, res) => {
//     try {
//         const AdminId = req.params.id;
//         const admin = await AdminModel.findById({ _id: AdminId });
//         if (!admin) {
//             return res.status(400).json({
//                 msg: "Admin Not Found"
//             })
//         }
//         const workbook = xlsx.readFile(req.file.path);
//         const sheetName = workbook.SheetNames[0];
//         const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
//         for (const row of sheetData) {
//             console.log({ row });
//             const existingMr = await mrModel.findOne({ MRID: row.MRID });
//             if (existingMr) {
//                 const newDoctor = await new Quiz({
//                     doctorName: row.doctorName,
//                     scCode: row.scCode,
//                     city: row.city,
//                     state: row.state,
//                     locality: row.locality,
//                     mrReference: existingMr._id
//                 })
//                 console.log({ newDoctor })
//                 await existingMr.save();
//                 await newDoctor.save();
//             } else {
//                 const newMr = await mrModel.create({
//                     USERNAME: row.USERNAME,
//                     MRID: row.MRID,
//                     PASSWORD: row.PASSWORD,
//                     EMAIL: row.EMAIL,
//                     ROLE: row.ROLE,
//                     HQ: row.HQ,
//                     REGION: row.REGION,
//                     BUSINESSUNIT: row.BUSINESSUNIT,
//                     DOJ: row.DOJ,
//                     SCCODE: row.SCCODE,
//                 })
//                 await newMr.save();
//                 admin.Mrs.push(newMr._id);
//                 await admin.save();
//                 const newDoctor = await new Quiz({
//                     doctorName: row.doctorName,
//                     scCode: row.scCode,
//                     city: row.city,
//                     state: row.state,
//                     locality: row.locality,
//                     mrReference: newMr._id
//                 })
//                 await newDoctor.save();
//             }
//         }
//         res.status(200).json({ message: 'Data uploaded successfully' });
//     } catch (error) {
//         console.error(error);
//         const err = error.message;
//         res.status(500).json({ error: 'Internal server error', err });
//     }
// };

const createMr = async (req, res) => {
  try {
    const flmId = req.params.id;
    const flm = await flmModel.findById({ _id: flmId });

    if (!flm) {
      return res.status(400).json({
        msg: "Flm Not Found",
      });
    }

    const { USERNAME, MRID, PASSWORD, EMAIL, ROLE, HQ, REGION, ZONE, BUSINESSUNIT, DOJ } = req.body;

    let mr;

    mr = await mrModel.findOne({ MRID: MRID });


    if (mr) return res.status(400).json({ msg: "MR is already Exists", MRID });

    const mrExistEmail = await mrModel.findOne({ EMAIL: EMAIL });
    if (mrExistEmail) {
      return res.status(501).send({ message: "MR with same email found in database..!!", success: false });
    }

    mr = new mrModel({ USERNAME, MRID, PASSWORD, EMAIL, ROLE, HQ, REGION, ZONE, BUSINESSUNIT, DOJ });

    mr.loginLogs.push({
      timestamp: new Date(),
      cnt: 1,
    });


    await mr.save();
    flm.Mrs.push(mr._id);

    await flm.save();
    return res.status(200).json(mr);

  } catch (error) {
    console.log("Error in CreateMr");
    let err = error.message;
    return res.status(500).json({
      msg: "Internal Server Error",
      err,
    });
  }
};

const loginMr = async (req, res) => {
  try {
    const { MRID, PASSWORD } = req.body;

    if (!PASSWORD || !MRID) {
      return res.status(401).send({ message: "Plz fill all credentials..!!", success: false });
    }

    let mr = await mrModel.findOne({ MRID: MRID });

    if (!mr)
      return res.status(400).json({
        msg: "Mr Not Found",
      });


    if (mr.PASSWORD !== PASSWORD) {
      return res.status(402).send({ message: "Plz fill correct credentials..!!", success: false });
    }

    mr.loginLogs.push({
      timestamp: new Date(),
      cnt: mr.loginLogs.length + 1,
    });

    console.log(mr.loginLogs);
    await mr.save();

    const mrId = mr._id;
    const mrName = mr.USERNAME;

    return res.status(200).json({
      success: true,
      mrId,
      MRID,
      mrName
    });
  } catch (error) {
    console.log("Error in Login");
    let err = error.message;
    return res.status(500).json({
      msg: "Internal Server Error",
      err,
    });
  }
};

const GetDoctorsByMR = async (req, res) => {
  const mrId = req.params.id;
  try {
    const doctors = await Quiz.find({ mrReference: mrId });

    return res.json({ doctors });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const handleAdminSideReports = async (req, res) => {
  try {
    const doctors = await Quiz.find({});
    const mrs = await mrModel.find({});

    let mostPlayedCategoryName = "";
    let maxTotalPoints = 0;

    let lowestPlayedCategoryName = "";
    let minTotalPoints = 120000;

    doctors.forEach((doctor) => {
      doctor.quizCategories.forEach((category) => {
        if (category.TotalPoints > maxTotalPoints) {
          maxTotalPoints = category.TotalPoints;
          mostPlayedCategoryName = category.categoryName;
        }

        if (category.TotalPoints < minTotalPoints) {
          minTotalPoints = category.TotalPoints;
          lowestPlayedCategoryName = category.categoryName;
        }
      });
    });

    let mostLoginLogsMR = null;
    let maxLoginLogsCount = -1;

    // Find MR with the most login logs
    mrs.forEach((mr) => {
      const loginLogsCount = mr.loginLogs.length;
      if (loginLogsCount > maxLoginLogsCount) {
        maxLoginLogsCount = loginLogsCount;
        mostLoginLogsMR = {
          USERNAME: mr.USERNAME,
          MRID: mr.MRID,
          loginLogsCount: loginLogsCount,
        };
      }
    });

    const adminReports = {
      doctors: doctors.length,
      mrs: mrs.length,
      mostPlayedCategory: mostPlayedCategoryName,
      maxTotalPoints: maxTotalPoints,
      lowestPlayedCategory: lowestPlayedCategoryName,
      minTotalPoints: minTotalPoints,
      mostLoginLogsMR: mostLoginLogsMR,
    };

    res.json(adminReports);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const handleAllMrDoctorsData = async (req, res) => {
  try {
    const mrsAndDoctors = await mrModel.aggregate([
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "mrReference",
          as: "doctors",
        },
      },
      {
        $unwind: "$doctors",
      },
      {
        $group: {
          _id: "$_id", // Group by MR ID
          USERNAME: { $first: "$USERNAME" },
          MRID: { $first: "$MRID" },
          PASSWORD: { $first: "$PASSWORD" },
          EMAIL: { $first: "$EMAIL" },
          ROLE: { $first: "$ROLE" },
          HQ: { $first: "$HQ" },
          REGION: { $first: "$REGION" },
          BUSINESSUNIT: { $first: "$BUSINESSUNIT" },
          DOJ: { $first: "$DOJ" },
          LOGINLOGS: { $sum: { $size: "$loginLogs" } },
          doctors: {
            $push: {
              doctorName: "$doctors.doctorName",
              scCode: "$doctors.scCode",
              city: "$doctors.city",
              state: "$doctors.state",
            },
          },
        },
      },
      {
        $unwind: "$doctors",
      },
      {
        $project: {
          _id: 0,
          USERNAME: 1,
          MRID: 1,
          PASSWORD: 1,
          EMAIL: 1,
          ROLE: 1,
          HQ: 1,
          REGION: 1,
          BUSINESSUNIT: 1,
          DOJ: 1,
          LOGINLOGS: 1,
          doctorName: "$doctors.doctorName",
          scCode: "$doctors.scCode",
          city: "$doctors.city",
          state: "$doctors.state",
        },
      },
    ]);

    const header = [
      "USERNAME",
      "MRID",
      "PASSWORD",
      "EMAIL",
      "ROLE",
      "HQ",
      "REGION",
      "BUSINESSUNIT",
      "DOJ",
      "LOGINLOGS",
      "doctorName",
      "scCode",
      "city",
      "state",
    ];

    const rows = mrsAndDoctors.map((row) => header.map((field) => row[field]));

    const result = [...rows];

    return res.json(result);
  } catch (error) {
    console.error(error);
    const errMsg = error.message;
    return res
      .status(500)
      .json({ success: false, errMsg, error: "Internal Server Error" });
  }
};

function formatDate(date) {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

const handleAllMrDoctorsDataV2 = async (req, res) => {
  try {
    const mrsAndDoctors = await mrModel.aggregate([
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "mrReference",
          as: "doctors",
        },
      },
      {
        $unwind: { path: "$doctors", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$_id",
          USERNAME: { $first: "$USERNAME" },
          MRID: { $first: "$MRID" },
          PASSWORD: { $first: "$PASSWORD" },
          EMAIL: { $first: "$EMAIL" },
          ROLE: { $first: "$ROLE" },
          HQ: { $first: "$HQ" },
          REGION: { $first: "$REGION" },
          BUSINESSUNIT: { $first: "$BUSINESSUNIT" },
          DOJ: { $first: "$DOJ" },
          LOGINLOGS: { $sum: { $size: "$loginLogs" } },
          doctors: {
            $push: {
              doctorName: "$doctors.doctorName",
              scCode: "$doctors.scCode",
              city: "$doctors.city",
              locality: "$doctors.locality",
              state: "$doctors.state",
              doc: "$doctors.doc",
              quizCategories: {
                $ifNull: ["$doctors.quizCategories", []],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          USERNAME: 1,
          MRID: 1,
          PASSWORD: 1,
          EMAIL: 1,
          ROLE: 1,
          HQ: 1,
          REGION: 1,
          BUSINESSUNIT: 1,
          DOJ: 1,
          LOGINLOGS: 1,
          doctors: 1,
        },
      },
    ]);

    const rows = mrsAndDoctors.flatMap((row) => {
      const mrData = [
        row.USERNAME,
        row.MRID,
        row.PASSWORD,
        row.EMAIL,
        row.ROLE,
        row.HQ,
        row.REGION,
        row.BUSINESSUNIT,
        row.DOJ,
        row.LOGINLOGS,
      ];
      const doctorsData = row.doctors.map((doctor) => {
        const categoryCount = doctor.quizCategories.length;
        const totalCategoryPlayed = {
          TotalCategoryPlayed: categoryCount,
        };

        const categoryData = doctor.quizCategories.map((category) => {
          return [
            {
              categoryName: category.categoryName,
              Points: category.TotalPoints || 0,
              DateOfPlayed: formatDate(new Date(category.doc)),
            },
          ];
        });

        return [
          ...mrData,
          doctor.doctorName,
          doctor.scCode || "",
          doctor.city || "",
          doctor.locality || "",
          doctor.state || "",
          doctor.doc || "Date Not Available",
          ...categoryData,
          totalCategoryPlayed,
        ];
      });

      return doctorsData;
    });

    return res.json(rows);
  } catch (error) {
    console.error(error);
    const errMsg = error.message;
    return res
      .status(500)
      .json({ success: false, errMsg, error: "Internal Server Error" });
  }
};

const handleAllMrDoctorsDataV3 = async (req, res) => {
  try {
    const mrsAndDoctors = await mrModel.aggregate([
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "mrReference",
          as: "doctors",
        },
      },
      {
        $unwind: { path: "$doctors", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$_id",
          USERNAME: { $first: "$USERNAME" },
          MRID: { $first: "$MRID" },
          PASSWORD: { $first: "$PASSWORD" },
          EMAIL: { $first: "$EMAIL" },
          ROLE: { $first: "$ROLE" },
          HQ: { $first: "$HQ" },
          REGION: { $first: "$REGION" },
          BUSINESSUNIT: { $first: "$BUSINESSUNIT" },
          DOJ: { $first: "$DOJ" },
          LOGINLOGS: { $sum: { $size: "$loginLogs" } },
          doctors: {
            $push: {
              doctorName: "$doctors.doctorName",
              scCode: "$doctors.scCode",
              city: "$doctors.city",
              locality: "$doctors.locality",
              state: "$doctors.state",
              doc: "$doctors.doc",
              quizCategories: {
                $ifNull: ["$doctors.quizCategories", []],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          USERNAME: 1,
          MRID: 1,
          PASSWORD: 1,
          EMAIL: 1,
          ROLE: 1,
          HQ: 1,
          REGION: 1,
          BUSINESSUNIT: 1,
          DOJ: 1,
          LOGINLOGS: 1,
          doctors: 1,
        },
      },
    ]);

    const rows = mrsAndDoctors.flatMap((row) => {
      const mrData = [
        row.USERNAME,
        row.MRID,
        row.PASSWORD,
        row.EMAIL,
        row.ROLE,
        row.HQ,
        row.REGION,
        row.BUSINESSUNIT,
        row.DOJ,
        row.LOGINLOGS,
      ];
      const doctorsData = row.doctors.map((doctor) => {
        const categoryCount = doctor.quizCategories.length;
        const totalCategoryPlayed = {
          TotalCategoryPlayed: categoryCount,
        };

        const totalPointsInCategory = doctor.quizCategories.reduce(
          (totalPoints, category) => {
            return totalPoints + (category.TotalPoints || 0);
          },
          0
        );

        const categoryData = doctor.quizCategories.map((category) => {
          return [
            {
              categoryName: category.categoryName,
              Points: category.TotalPoints || 0,
              DateOfPlayed: formatDate(new Date(category.doc)),
            },
          ];
        });

        return [
          ...mrData,
          doctor.doctorName,
          doctor.scCode || "",
          doctor.city || "",
          doctor.locality || "",
          doctor.state || "",
          doctor.doc || "Date Not Available",
          ...categoryData,
          totalCategoryPlayed,
          totalPointsInCategory,
        ];
      });

      return doctorsData;
    });

    return res.json(rows);
  } catch (error) {
    console.error(error);
    const errMsg = error.message;
    return res
      .status(500)
      .json({ success: false, errMsg, error: "Internal Server Error" });
  }
};

const handleForgetPassword = async (req, res) => {
  try {
    const { MRID } = req.body;
    const mrExist = await mrModel.findOne({ MRID: MRID });

    if (!mrExist) {
      return res.status(404).send({ message: "MR Not found...!!!", success: false });
    }

    // Send the password directly via email
    const password = mrExist.PASSWORD;
    const email = mrExist.EMAIL;
    const name = mrExist.USERNAME;

    // NodeMailer Configuration
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'digilateraldev@gmail.com',
        pass: 'ohax atcp umht xked'
      }
    });

    // Email content
    var mailOptions = {
      from: 'digiLateralQuizPanel@gmail.com',
      to: email,
      subject: 'Password API correctly working take your Password...',
      html: `
              <div style="border: 1px solid #000; padding: 10px; text-align: center;">
                <h3 style="text-align: center;">Dear : ${name}</h3>
                <p> Your Password For <span style="background-color: blue; color: white; padding: 3px;">4ForSure Quiz</span> : ${password}</p>
                <p>Please keep this information secure.</p>
                <p>If you didn't request this, please ignore this email.</p>
              </div>
            `
    };

    // Send the email
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res.status(500).send({ message: "Error sending email", success: false });
      } else {
        console.log('Email sent: ' + info.response);
        return res.status(200).send({ message: "Password sent successfully", success: true });
      }
    });

    res.status(201).json({ message: `MR NAME : ${name} PASSWORD RESTORE SUCCESSFULLY...`, success: true });

  } catch (err) {
    console.log(err);
  }
};

const handleTopCategoryChart = async (req, res) => {
  try {
    const result = await Quiz.aggregate([
      {
        $unwind: "$quizCategories",
      },
      {
        $group: {
          _id: "$quizCategories.categoryName",
          Count: { $sum: 1 },
        },
      },
      {
        $project: {
          categoryName: "$_id",
          Count: 1,
          _id: 0,
        },
      },
    ]);

    return res.json(result);
  } catch (error) {
    console.log("Error in handleTopCategoryChart");
    let err = error.message;
    return res.status(500).json({
      msg: "Internal Server Error",
      err,
    });
  }
};

const handleTopMrByDoctor = async (req, res) => {
  try {
    const result = await mrModel.aggregate([
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "mrReference",
          as: "doctors",
        },
      },
      {
        $addFields: {
          doctorCount: { $size: "$doctors" },
        },
      },
      {
        $project: {
          _id: 1,
          MRID: 1,
          USERNAME: 1,
          doctorCount: 1,
        },
      },
      {
        $sort: { doctorCount: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    return res.json(result);
  } catch (error) {
    console.log("Error in handleTopMrByDoctor");
    let err = error.message;
    return res.status(500).json({
      msg: "Internal Server Error",
      err,
    });
  }
};

// const handleTop20Mr = async (req, res) => {
//   try {
//     const adminId = req.params.adminId; // Extract Admin ID from request parameters
//     console.log('adminId', adminId);
//     // Query the Admin collection to find the Admin document by Admin ID
//     const admin = await AdminModel.findById(adminId).populate('Mrs');
//     console.log('admin', admin);
//     if (!admin) {
//       return res.status(404).json({ msg: "Admin not found" });
//     }

//     const mrIds = admin.Mrs.map(mr => mr._id); // Extract MR IDs from the Admin document

//     // Use MR IDs obtained from the Admin document in the aggregation pipeline
//     const top20MRS = await mrModel.aggregate([
//       {
//         $match: { _id: { $in: mrIds } }
//       },
//       {
//         $lookup: {
//           from: "quizzes",
//           localField: "_id",
//           foreignField: "mrReference",
//           as: "doctors",
//         },
//       },
//       {
//         $addFields: {
//           totalDoctors: { $size: "$doctors" },
//         },
//       },
//       {
//         $sort: { totalDoctors: -1 },
//       },
//       {
//         $limit: 20,
//       },
//       {
//         $project: {
//           USERNAME: 1,
//           ZONE: 1,
//           REGION: 1,
//           HQ: 1,
//           totalDoctors: 1,
//         },
//       },
//     ]);

//     res.send(top20MRS);
//   } catch (error) {
//     console.log("Error in handleTop20Mr", error);
//     let err = error.message;
//     return res.status(500).json({
//       msg: "Internal Server Error",
//       err,
//     });
//   }
// };

const handleTop20Mr = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    console.log('adminId', adminId);

    // Query the Admin collection to find the Admin document by Admin ID
    const admin = await AdminModel.findById(adminId);

    //Check admin exits or not...
    if (!admin) {
      return res.status(404).json({ msg: "Admin not found" });
    }

    // Fetch Tlm data
    const tlmData = await TlmModel.find({ _id: { $in: admin.Tlm } });

    // Construct the output structure with Tlm data
    const adminDetailWithTlm = {
      ...admin.toObject(),
      Tlm: tlmData,
    };

    //Fetch MRdata.....
    const mrIds = [];

    // Fetch Slm data for each Tlm...
    for (const tlm of adminDetailWithTlm.Tlm) {
      const slmData = await SlmModel.find({ _id: { $in: tlm.Slm } });

      for (const slm of slmData) {
        const flmData = await flmModel.find({ _id: { $in: slm.Flm } });
        slm.Flm = flmData;

        for (const flm of flmData) {
          const mrData = await mrModel.find({ _id: { $in: flm.Mrs } }).select('_id');
          mrIds.push(mrData);
        }
      }

      tlm.Slm = slmData;
    }

    // Flatten the array of arrays and extract _id values
    const flattenedIds = mrIds.flatMap(ids => ids.map(idObj => idObj._id));
    console.log("ids :", flattenedIds);

    // Use MR IDs obtained from the Admin document in the aggregation pipeline
    const top20MRS = await mrModel.aggregate([
      {
        $match: { _id: { $in: flattenedIds } }
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "mrReference",
          as: "doctors",
        },
      },
      {
        $addFields: {
          totalDoctors: { $size: "$doctors" },
        },
      },
      {
        $sort: { totalDoctors: -1 },
      },
      {
        $limit: 20,
      },
      {
        $project: {
          USERNAME: 1,
          ZONE: 1,
          REGION: 1,
          HQ: 1,
          totalDoctors: 1,
        },
      },
    ]);

    res.send(top20MRS);
  } catch (error) {
    console.log("Error in handleTop20Mr", error);
    let err = error.message;
    return res.status(500).json({
      msg: "Internal Server Error",
      err,
    });
  }
};

const handleUpload = async (req, res) => {
  try {
    const AdminId = req.params.id;
    const admin = await AdminModel.findById({ _id: AdminId });
    if (!admin) {
      return res.status(400).json({
        msg: "Admin Not Found",
      });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    for (const row of sheetData) {
      console.log({ row });
      const existingMr = await mrModel.findOne({ MRID: row.MRID });
      if (existingMr) {
        existingMr.USERNAME = row.USERNAME;
        existingMr.PASSWORD = row.PASSWORD;
        existingMr.EMAIL = row.EMAIL;
        existingMr.ROLE = row.ROLE;
        existingMr.HQ = row.HQ;
        existingMr.REGION = row.REGION;
        existingMr.BUSINESSUNIT = row.BUSINESSUNIT;
        existingMr.DOJ = row.DOJ;
        await existingMr.save();
        // Create a new Quiz entry if needed

        const cleanSCCode = row.SCCode.replace("`", "");

        const newDoctor = await new Quiz({
          doctorName: row.doctorName,
          scCode: cleanSCCode,
          city: row.city,
          state: row.state,
          locality: row.locality,
          doc: Date.now(),
          mrReference: existingMr._id,
        });
        console.log({ newDoctor });

        // Save the new Quiz entry
        await newDoctor.save();
      } else {
        const newMr = await new mrModel({
          USERNAME: row.USERNAME,
          MRID: row.MRID,
          PASSWORD: row.PASSWORD,
          EMAIL: row.EMAIL,
          ROLE: row.ROLE,
          HQ: row.HQ,
          REGION: row.REGION,
          BUSINESSUNIT: row.BUSINESSUNIT,
          DOJ: row.DOJ,
        });
        await newMr.save();

        admin.Mrs.push(newMr._id);
        const cleanSCCode = row.SCCode.replace("`", "");
        await admin.save();
        const newDoctor = await new Quiz({
          doctorName: row.doctorName,
          scCode: cleanSCCode,
          city: row.city,
          state: row.state,
          locality: row.locality,
          doc: Date.now(),
          mrReference: newMr._id,
        });
        await newDoctor.save();
      }
    }
    res.status(200).json({ message: "Data uploaded successfully" });
  } catch (error) {
    console.error(error);
    const err = error.message;
    res.status(500).json({
      error: "Internal server error",
      err,
    });
  }
};

const handleMrsRegion = async (req, res) => {
  try {
    const regions = await mrModel.find({}).select("REGION , _id").lean();
    const uniqueRegionsSet = new Set();
    const uniqueRegions = regions.filter((region) => {
      if (!uniqueRegionsSet.has(region.REGION)) {
        uniqueRegionsSet.add(region.REGION);
        return true;
      }
      return false;
    });

    return res.json(uniqueRegions);
  } catch (error) {
    console.error(error);
    const err = error.message;
    res.status(500).json({
      error: "Internal server error",
      err,
    });
  }
};

const handleAdminMrs = async (req, res) => {
  try {
    // const id = req.params.id;

    // const admin = await AdminModel.findById({ _id: id });
    // if (!admin) {
    //   return res.json({ msg: "Admin not found" });
    // }

    // await admin.populate("Mrs");

    // const mrs = admin.Mrs;

    // return res.json(mrs);


    const adminId = req.params.id;
    console.log('adminId', adminId);

    // Query the Admin collection to find the Admin document by Admin ID
    const admin = await AdminModel.findById(adminId);

    //Check admin exits or not...
    if (!admin) {
      return res.status(404).json({ msg: "Admin not found" });
    }

    // Fetch Tlm data
    const tlmData = await TlmModel.find({ _id: { $in: admin.Tlm } });

    // Construct the output structure with Tlm data
    const adminDetailWithTlm = {
      ...admin.toObject(),
      Tlm: tlmData,
    };

    //Fetch MRdata.....
    const mrResponse = [];

    // Fetch Slm data for each Tlm...
    for (const tlm of adminDetailWithTlm.Tlm) {
      const slmData = await SlmModel.find({ _id: { $in: tlm.Slm } });

      for (const slm of slmData) {
        const flmData = await flmModel.find({ _id: { $in: slm.Flm } });
        slm.Flm = flmData;

        for (const flm of flmData) {
          const mrData = await mrModel.find({ _id: { $in: flm.Mrs } });
          // mrResponse.push(mrData);
          mrResponse.push(...mrData);
        }
      }

      tlm.Slm = slmData;
    }

    return res.json(mrResponse.flat());

  } catch (error) {
    console.error(error);
    const err = error.message;
    res.status(500).json({
      error: "Internal server error",
      err,
    });
  }
};

const handleGetMrById = async (req, res) => {
  try {
    const mr = await mrModel.findById({ _id: req.params.id });
    return res.status(200).json(mr);
  } catch (error) {
    console.error(error);
    const err = error.message;
    res.status(500).json({
      error: "Internal server error",
      err,
    });
  }
};

const handleMrUpdate = async (req, res) => {
  try {
    console.log(req.body);
    const mr = req.body;
    const mrdetails = await mrModel.findByIdAndUpdate({ _id: mr.id }, mr, {
      new: true,
    });
    console.log(mrdetails);

    return res.status(200).json(mrdetails);
  } catch (error) {
    console.error(error);
    const err = error.message;
    res.status(500).json({
      error: "Internal server error",
      err,
    });
  }
};

module.exports = {
  createMr,
  loginMr,
  GetDoctorsByMR,
  // handleSheetUpload,
  handleAdminSideReports,
  handleAllMrDoctorsData,
  handleAllMrDoctorsDataV2,
  handleAllMrDoctorsDataV3,
  handleForgetPassword,
  handleTopMrByDoctor,
  handleTopCategoryChart,
  handleTop20Mr,
  handleUpload,
  handleMrsRegion,
  handleAdminMrs,
  handleGetMrById,
  handleMrUpdate,
};
