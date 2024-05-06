const AdminModel = require("../models/admin");
const tlmModel = require("../models/Tlm");
const slmModel = require("../models/Slm");
const flmModel = require("../models/Flm");
const doctorModel = require("../models/Quiz");
const Mr = require("../models/Mr");
const mongoose = require("mongoose")
const moment = require('moment');
const jwt = require("jsonwebtoken");
const xlsx = require("xlsx");
const colors = require('colors');



const handleAdminCreation = async (req, res) => {
    try {
        const { Name, AdminId, Password, Gender, MobileNumber } = req.body;
        const admin = await AdminModel.findOne({ AdminId: AdminId });

        if (admin) {
            return res.status(400).json({
                msg: "AdminId Already Exitsts",
                success: false,
            })
        }

        const newAdmin = await new AdminModel({
            Name,
            AdminId,
            Password,
            Gender,
            MobileNumber,
        })

        await newAdmin.save();

        return res.status(200).json({
            success: true,
            newAdmin
        });
    }
    catch (error) {
        console.log('Error in handleTopMrByDoctor');
        let err = error.message;
        return res.status(500).json({
            msg: 'Internal Server Error',
            err,
        });
    }
};

const handleAdminLogin = async (req, res) => {
    try {
        const { AdminId, Password } = req.body;
        console.log(req.body);
        const admin = await AdminModel.findOne({ AdminId });
        console.log({ admin })
        if (admin) {
            if (admin.Password === Password) {

                console.log("process.env.SECRET: ", process.env.SECRET);
                const name = admin.Name;

                const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.SECRET);
                return res.status(200).json({
                    msg: "Login",
                    success: true,
                    admin,
                    token,
                    name
                })
            } else {
                return res.status(400).json({
                    msg: "Password is Incorrect",
                    success: false,
                })
            }
        } else {
            return res.status(400).json({
                msg: "Admin Not Found",
                success: false
            })
        }
    } catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: "Internal Server Error",
            errMsg
        })
    }
}

const handleAdminGet = async (req, res) => {

    try {
        const id = req.params.id;
        const admin = await AdminModel.findById({ _id: id })
        if (!admin) {
            return res.status(400).json({
                msg: "Admin Not Found"
            })
        }
        return res.json(admin);
    }
    catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: "Internal Server Error",
            errMsg
        })
    }
}

const handleUpdateAdmin = async (req, res) => {

    try {
        const id = req.params.id;
        const { Name, AdminId, Password, Gender, MobileNumber } = req.body;

        const admin = await AdminModel.findById({ _id: id });
        if (!admin) {
            return res.status(400).json({ msg: "Admin Not Found" });
        }
        const UpdatedOptions = {
            Name,
            MobileNumber,
            Gender,
            Password
        }
        const udpatedAdmin = await AdminModel.findByIdAndUpdate(id, UpdatedOptions, { new: true })
        console.log({ udpatedAdmin });
        return res.status(200).json({
            msg: "Admin Updated",
            success: true,
        });
    } catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: "Internal Server Error",
            errMsg
        })
    }
}

// const handleMrData = async (req, res) => {
//     try {
//         const id = req.params.id;
//         const admin = await AdminModel.findById(id).populate('Mrs', 'MRID _id USERNAME');

//         if (!admin) {
//             return res.status(400).json({ msg: "Admin not found" });
//         }

//         const mrData = admin.Mrs.map(mr => {
//             return {
//                 MRID: mr.MRID,
//                 mrName: mr.USERNAME,
//                 _id: mr._id,
//             };
//         });

//         console.log(mrData);

//         return res.status(200).json(mrData);
//     } catch (error) {
//         const errMsg = error.message;
//         console.log({ errMsg });
//         return res.status(500).json({
//             msg: "Internal Server Error",
//             errMsg
//         });
//     }
// };

const handleMrData = async (req, res) => {
    try {
        const adminId = req.params.id;

        // Query the Admin collection to find the Admin document by Admin ID
        const admin = await AdminModel.findById(adminId);

        // Check if admin exists
        if (!admin) {
            return res.status(404).json({ msg: "Admin not found" });
        }

        // Fetch Tlm data
        const tlmData = await tlmModel.find({ _id: { $in: admin.Tlm } });

        // Construct the output structure with Tlm data
        const adminDetailWithTlm = {
            ...admin.toObject(),
            Tlm: tlmData,
        };

        // Fetch MR data and construct the response
        const mrResponse = [];
        for (const tlm of adminDetailWithTlm.Tlm) {
            const slmData = await slmModel.find({ _id: { $in: tlm.Slm } });

            for (const slm of slmData) {
                const flmData = await flmModel.find({ _id: { $in: slm.Flm } });
                slm.Flm = flmData;

                for (const flm of flmData) {
                    const mrData = await Mr.find({ _id: { $in: flm.Mrs } }).select('MRID USERNAME _id');
                    mrResponse.push(...mrData.map(mr => ({
                        MRID: mr.MRID,
                        mrName: mr.USERNAME,
                        _id: mr._id,
                    })));
                }
            }

            tlm.Slm = slmData;
        }

        res.status(201).json(mrResponse);

    } catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: "Internal Server Error",
            errMsg
        });
    }
};

const handleDoctorDataUnderAdmin = async (req, res) => {
    try {
        // const adminId = req.params.id;

        // if (!mongoose.Types.ObjectId.isValid(adminId)) {
        //     return res.status(400).json({ error: 'Invalid admin ID format' });
        // }

        // const adminData = await AdminModel.findById(adminId).populate({
        //     path: 'Mrs',
        //     model: 'Mr',
        //     options: { strictPopulate: false }
        // });

        // if (!adminData || !adminData.Mrs || adminData.Mrs.length === 0) {
        //     return res.status(404).json({ error: 'Admin not found or has no related MR data' });
        // }


        const adminId = req.params.id;
        console.log('adminId', adminId);

        // Query the Admin collection to find the Admin document by Admin ID
        const admin = await AdminModel.findById(adminId);

        //Check admin exits or not...
        if (!admin) {
            return res.status(404).json({ msg: "Admin not found" });
        }

        // Fetch Tlm data
        const tlmData = await tlmModel.find({ _id: { $in: admin.Tlm } });

        // Construct the output structure with Tlm data
        const adminDetailWithTlm = {
            ...admin.toObject(),
            Tlm: tlmData,
        };

        //Fetch MRdata.....
        const mrIds = [];

        // Fetch Slm data for each Tlm...
        for (const tlm of adminDetailWithTlm.Tlm) {
            const slmData = await slmModel.find({ _id: { $in: tlm.Slm } });

            for (const slm of slmData) {
                const flmData = await flmModel.find({ _id: { $in: slm.Flm } });
                slm.Flm = flmData;

                for (const flm of flmData) {
                    const mrData = await Mr.find({ _id: { $in: flm.Mrs } }).select('_id');
                    mrIds.push(mrData);
                }
            }

            tlm.Slm = slmData;
        }

        // Flatten the array of arrays and extract _id values
        const flattenedIds = mrIds.flatMap(ids => ids.map(idObj => idObj._id));
        console.log("ids :", flattenedIds);


        // const mrIdsArray = adminData.Mrs.map(mr => mr._id);

        const doctorsArray = await doctorModel.find({ mrReference: { $in: flattenedIds } })
            .populate('mrReference', 'MRID HQ REGION BUSINESSUNIT DOJ USERNAME _id EMAIL')
            .populate({ path: 'quizCategories', model: 'QuizCategory' })
            .exec();

        // Map the result to include quizCategories
        const formattedDoctorsArray = doctorsArray.map(doctor => ({
            _id: doctor._id,
            doctorName: doctor.doctorName,
            scCode: doctor.scCode,
            city: doctor.city,
            state: doctor.state,
            locality: doctor.locality,
            speciality: doctor.speciality,
            quizCategories: doctor.quizCategories,
            mrReference: {
                mrid: doctor.mrReference._id,
                mrName: doctor.mrReference.USERNAME,
                MRID: doctor.mrReference.MRID,
                mrEmail: doctor.mrReference.EMAIL,
                HQ: doctor.mrReference.HQ,
                REGION: doctor.mrReference.REGION,
                BUSINESSUNIT: doctor.mrReference.BUSINESSUNIT,
                DOJ: doctor.mrReference.DOJ,
            },
        }));

        return res.json(formattedDoctorsArray);
    } catch (error) {
        console.error(error);
        const errorMessage = error.message;
        return res.status(500).json({ message: 'Internal Server Error', errorMessage });
    }
};

const handleSuperAdminCount = async (req, res, next) => {
    const superAdminCount = await AdminModel.countDocuments({ Admin_TYPE: 'SUPER_ADMIN' });
    if (superAdminCount >= 3) {
        return req.status(403).json({
            msg: "Can't create more than 3 super admin"
        })
    }
    next();
}

const handleSuperAdminCreate = async (req, res) => {
    try {
        const userId = req.headers['userId'];
        const role = req.headers['userRole'];
        const admin1 = await AdminModel.findById({ _id: userId });
        if (!admin1) return res.json({ msg: "Main Admin Not Found" })
        if (role !== '1') {
            return res.json("You are not Default admin");
        }
        const { Name, AdminId, Password, Gender, MobileNumber } = req.body;
        const admin = await AdminModel.findOne({ AdminId: AdminId });
        if (admin) {
            return res.status(400).json({
                msg: "AdminId Already Exitsts",
                success: false,
            })
        }
        const newAdmin = new AdminModel({
            Name,
            AdminId,
            Password,
            Gender,
            MobileNumber,
            role: "SUPER_ADMIN",
        })
        if (newAdmin.role === 'SUPER_ADMIN') {
            const superAdminCount = await AdminModel.countDocuments({ role: 'SUPER_ADMIN' });
            if (superAdminCount >= 3) {
                return res.status(403).json({
                    msg: "Can't create more than 3 super admin",
                });
            }
            newAdmin.SUPER_ADMIN_COUNT += 1;
        }
        await newAdmin.save();
        return res.status(200).json({
            success: true,
            newAdmin
        });
    } catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: "Internal Server Error",
            errMsg
        });
    }
}

const handleCreateContentAdmin = async (req, res) => {
    try {
        const userId = req.headers['userId'];
        const role = req.headers['userRole'];

        let adminCheck = await AdminModel.findById({ _id: userId });
        if (!adminCheck) return res.json({ msg: "No Admin Type Found" });

        if (role !== 'SUPER_ADMIN') return res.json({ msg: "Only SuperAdmin Create Content Admin" });

        const { Name, AdminId, Password, Gender, MobileNumber } = req.body;
        console.log({ Name, AdminId, Password, Gender, MobileNumber })
        const admin = await AdminModel.findOne({ AdminId: AdminId });
        if (admin) {
            return res.status(400).json({
                msg: "Content Admin Already Exitsts",
                success: false,
            })
        }

        const contentAdmin = new AdminModel({
            Name,
            AdminId,
            Password,
            Gender,
            MobileNumber,
            role: "CONTENT_ADMIN"
        })
        await contentAdmin.save();
        return res.status(200).json({
            success: true,
            contentAdmin
        });
    }
    catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: "Internal Server Error",
            errMsg
        });
    }
}

const handleReportAdminCreate = async (req, res) => {
    try {
        const userId = req.headers['userId'];
        const role = req.headers['userRole'];
        let adminCheck = await AdminModel.findById({ _id: userId });
        if (!adminCheck) return res.json({ msg: "No Admin Type Found" });
        if (role !== 'SUPER_ADMIN') return res.json({ msg: "Only SuperAdmin Create Report Admin" });
        const { Name, AdminId, Password, Gender, MobileNumber } = req.body;
        const admin = await AdminModel.findOne({ AdminId: AdminId });
        if (admin) {
            return res.status(400).json({
                msg: "Report Admin Already Exitsts",
                success: false,
            })
        }
        const reportAdmin = new AdminModel({
            Name,
            AdminId,
            Password,
            Gender,
            MobileNumber,
            role: "REPORT_ADMIN"
        })
        await reportAdmin.save();
        return res.status(200).json({
            success: true,
            reportAdmin
        });
    }
    catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: "Internal Server Error in Report Admin creation ",
            errMsg
        });
    }
}

const verifyJwtForClient = async (req, res) => {

    try {
        const token = req.params.token;
        if (token) {
            const decodedToken = await jwt.verify(token, process.env.SECRET);
            const userRole = decodedToken.role;
            const userId = decodedToken.id;

            return res.json({ userRole, userId })
        } else {
            return res.json({ msg: "token not found" })
        }
    } catch (error) {
        console.error('Error decoding JWT:', error.message);
        const errMessage = error.message
        return res.json({ msg: errMessage })
    }
}

// const handleExcelsheetUpload = async (req, res) => {
//     try {
//         // Admin Exist or not checking......
//         const AdminId = req.params.id;
//         const admin = await AdminModel.findById(AdminId);
//         if (!admin) {
//             return res.status(400).json({
//                 msg: "Admin Not Found"
//             });
//         }

//         // EXCEL SHEET Upload file....
//         const workbook = xlsx.readFile(req.file.path);
//         const sheetName = workbook.SheetNames[0];
//         const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//         // For loop the sheet data to store in various collections
//         for (const row of sheetData) {
//             console.log('Sheet Data:', row);

//             // Check the TLM exists or not
//             let existTlm = await tlmModel.findOne({ TLMEmpID: row.TLMID });
//             if (!existTlm) {
//                 // TLM doesn't exist, create new TLM
//                 existTlm = new tlmModel({
//                     TLMEmpID: row.TLMID,
//                     TLMName: row.TLMNAME,
//                     Password: row.TLMPASSWORD,
//                     HQ: row.TLMHQ,
//                     ZONE: row.TLMZONE,
//                 });
//                 await existTlm.save();
//                 admin.Tlm.push(existTlm._id);
//                 await admin.save();
//             }

//             // Check the SLM exists or not
//             let existSlm = await slmModel.findOne({ SLMEmpID: row.SLMID });
//             if (!existSlm) {
//                 // SLM doesn't exist, create new SLM
//                 existSlm = new slmModel({
//                     SLMEmpID: row.SLMID,
//                     SLMName: row.SLMNAME,
//                     Password: row.SLMPASSWORD,
//                     HQ: row.SLMHQ,
//                     REGION: row.SLMREGION,
//                     ZONE: row.SLMZONE,
//                 });
//                 await existSlm.save();
//                 existTlm.Slm.push(existSlm._id);
//                 await existTlm.save();
//             }

//             // Check the FLM exists or not
//             let existFlm = await flmModel.findOne({ FLMEmpID: row.FLMID });
//             if (!existFlm) {
//                 // FLM doesn't exist, create new FLM
//                 existFlm = new flmModel({
//                     FLMEmpID: row.FLMID,
//                     BDMName: row.FLMNAME,
//                     Password: row.FLMPASSWORD,
//                     HQ: row.FLMHQ,
//                     REGION: row.FLMREGION,
//                     ZONE: row.FLMZONE,
//                 });
//                 await existFlm.save();
//                 existSlm.Flm.push(existFlm._id);
//                 await existSlm.save();
//             }

//             // Check the MR exists or not
//             let existingMr = await Mr.findOne({ MRID: row.MRID });
//             const cleanDOJ = row.MRDOJ.replace("`", "");
//             if (!existingMr) {
//                 // MR doesn't exist, create new MR
//                 existingMr = new Mr({
//                     MRID: row.MRID,
//                     USERNAME: row.MRNAME,
//                     EMAIL: row.MREMAIL,
//                     PASSWORD: row.MRPASSWORD,
//                     ROLE: row.MRROLE,
//                     HQ: row.MRHQ,
//                     REGION: row.MRREGION,
//                     ZONE: row.MRZONE,
//                     BUSINESSUNIT: row.MRBUSSINESSUNIT,
//                     DOJ: cleanDOJ,
//                 });
//                 await existingMr.save();
//                 existFlm.Mrs.push(existingMr._id);
//                 await existFlm.save();
//             }

//             // // Check if a doctor with the same SCCode already exists
//             // let existingDoctor = await DoctorModel.findOne({ SCCode: row.SCCode.replace('`', '') });
//             // if (!existingDoctor) {

//             //     // Remove the backtick from SCCode
//             //     const cleanSCCode = row.SCCode.replace('`', '');

//             //     // Map "Active" and "Inactive" to Boolean values
//             //     let doctorStatus = true; // Assume default status is "Active"
//             //     if (row.DoctorStatus === "inactive") {
//             //         doctorStatus = false;
//             //     }

//             //     // Create a new doctor entry
//             //     existingDoctor = new DoctorModel({
//             //         SCCode: cleanSCCode,
//             //         DoctorName: row.DoctorName,
//             //         Specialty: row.Specialty,
//             //         Place: row.Place,
//             //         CLASS: row.CLASS,
//             //         VF: row.VF,
//             //         DoctorPotential: row.DoctorPotential,
//             //         POBStatus: row.POBStatus,
//             //         POBCount: row.POBCount,
//             //         DoctorStatus: doctorStatus,
//             //         doc: Date.now()
//             //     });
//             //     await existingDoctor.save();

//             //     // Associate the doctor with the MR
//             //     existingMr.doctors.push(existingDoctor._id);
//             //     await existingMr.save();
//             // }

//             // // Check if a doctor with the same SCCode already exists
//             // let existingPatient = await PatientModel.findOne({ PatientName: row.PatientName });
//             // if (!existingPatient) {

//             //     // Map "Active" and "Inactive" to Boolean values
//             //     let patientStatus = true; // Assume default status is "Active"
//             //     if (row.PatientStatus === "DISCONTINUE") {
//             //         patientStatus = false;
//             //     }

//             //     //Calculation of total..
//             //     const calculateTotal = row.Price * row.NoDose;

//             //     // Extract age from the row data and parse it as an integer
//             //     const age = parseInt(row['Age ']);

//             //     // Create a new doctor entry
//             //     existingPatient = new PatientModel({
//             //         PatientName: row.PatientName,
//             //         Age: age,
//             //         Gender: row.Gender,
//             //         MobileNumber: row.MobileNumber,
//             //         Location: row.Location,
//             //         // NoUnitPurchased: row.NoUnitPurchased,
//             //         Month: row.Month,
//             //         Year: row.Year,
//             //         PatientStatus: patientStatus,
//             //         Reason: row.Reason,
//             //         doc: Date.now(),
//             //         PatientType: row.PatientType,
//             //         Repurchase: {
//             //             DurationOfTherapy: row.DurationOfTherapy,
//             //             TotolCartiridgesPurchase: row.NoUnitPurchased,
//             //             DateOfPurchase: row.DateOfPurchase,
//             //             Delivery: row.Delivery,
//             //             TherapyStatus: row.TherapyStatus,
//             //             UnitsPrescribe: row.UnitsPrescribe,
//             //             Indication: row.Indication,
//             //             Price: row.Price,
//             //             NoDose: row.NoDose,
//             //             Total: calculateTotal,
//             //             Brands: row.Brands
//             //         }
//             //     });
//             //     await existingPatient.save();

//             //     // Associate the patient with the doctor
//             //     existingDoctor.patients.push(existingPatient._id);
//             //     await existingDoctor.save();
//             // }
//         }

//         res.status(200).json({ message: "Data uploaded successfully" });
//     } catch (error) {
//         console.error(error);
//         const err = error.message;
//         res.status(500).json({
//             error: 'Internal server error',
//             err
//         });
//     }
// }

const handleExcelsheetUpload = async (req, res) => {
    try {
        // Admin Exist or not checking......
        const AdminId = req.params.id;
        const admin = await AdminModel.findById(AdminId);
        if (!admin) {
            return res.status(400).json({
                msg: "Admin Not Found"
            });
        }

        // EXCEL SHEET Upload file....
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // For loop the sheet data to store in various collections
        for (const row of sheetData) {
            console.log("SheetDataExcel :", row);

            // Check the TLM exists or not
            let existTlm = await tlmModel.findOne({ TLMEmpID: row.TLMID });
            if (existTlm) {
                // Update existing TLM data if it already exists
                existTlm.TLMName = row.TLMNAME;
                existTlm.Password = row.TLMPASSWORD;
                existTlm.HQ = row.TLMHQ;
                existTlm.ZONE = row.TLMZONE;
                await existTlm.save();
            } else {
                // TLM doesn't exist, create new TLM
                existTlm = new tlmModel({
                    TLMEmpID: row.TLMID,
                    TLMName: row.TLMNAME,
                    Password: row.TLMPASSWORD,
                    HQ: row.TLMHQ,
                    ZONE: row.TLMZONE,
                });
                await existTlm.save();
                admin.Tlm.push(existTlm._id);
                await admin.save();
            }

            // Check the SLM exists or not
            let existSlm = await slmModel.findOne({ SLMEmpID: row.SLMID });
            if (existSlm) {
                // Update existing SLM data if it already exists
                existSlm.SLMName = row.SLMNAME;
                existSlm.Password = row.SLMPASSWORD;
                existSlm.HQ = row.SLMHQ;
                existSlm.REGION = row.SLMREGION;
                existSlm.ZONE = row.SLMZONE;
                await existSlm.save();
            } else {
                // SLM doesn't exist, create new SLM
                existSlm = new slmModel({
                    SLMEmpID: row.SLMID,
                    SLMName: row.SLMNAME,
                    Password: row.SLMPASSWORD,
                    HQ: row.SLMHQ,
                    REGION: row.SLMREGION,
                    ZONE: row.SLMZONE,
                });
                await existSlm.save();
                existTlm.Slm.push(existSlm._id);
                await existTlm.save();
            }

            // Check the FLM exists or not
            let existFlm = await flmModel.findOne({ FLMEmpID: row.FLMID });
            if (existFlm) {
                // Update existing FLM data if it already exists
                existFlm.BDMName = row.FLMNAME;
                existFlm.Password = row.FLMPASSWORD;
                existFlm.HQ = row.FLMHQ;
                existFlm.REGION = row.FLMREGION;
                existFlm.ZONE = row.FLMZONE;
                await existFlm.save();
            } else {
                // FLM doesn't exist, create new FLM
                existFlm = new flmModel({
                    FLMEmpID: row.FLMID,
                    BDMName: row.FLMNAME,
                    Password: row.FLMPASSWORD,
                    HQ: row.FLMHQ,
                    REGION: row.FLMREGION,
                    ZONE: row.FLMZONE,
                });
                await existFlm.save();
                existSlm.Flm.push(existFlm._id);
                await existSlm.save();
            }

            // Check the MR exists or not
            let existingMr = await Mr.findOne({ MRID: row.MRID });
            // const cleanDOJ = row.MRDOJ.replace("`", "");
            const cleanDOJ = typeof row.MRDOJ === 'string' ? row.MRDOJ.replace("`", "") : row.MRDOJ;
            if (existingMr) {
                // Update existing MR data if it already exists
                existingMr.USERNAME = row.MRNAME;
                existingMr.EMAIL = row.MREMAIL;
                existingMr.PASSWORD = row.MRPASSWORD;
                existingMr.ROLE = row.MRROLE;
                existingMr.HQ = row.MRHQ;
                existingMr.REGION = row.MRREGION;
                existingMr.ZONE = row.MRZONE;
                existingMr.BUSINESSUNIT = row.MRBUSSINESSUNIT;
                existingMr.DOJ = cleanDOJ;
                await existingMr.save();
            } else {
                // MR doesn't exist, create new MR
                existingMr = new Mr({
                    MRID: row.MRID,
                    USERNAME: row.MRNAME,
                    EMAIL: row.MREMAIL,
                    PASSWORD: row.MRPASSWORD,
                    ROLE: row.MRROLE,
                    HQ: row.MRHQ,
                    REGION: row.MRREGION,
                    ZONE: row.MRZONE,
                    BUSINESSUNIT: row.MRBUSSINESSUNIT,
                    DOJ: cleanDOJ,
                });
                await existingMr.save();
                existFlm.Mrs.push(existingMr._id);
                await existFlm.save();
            }
        }

        res.status(200).json({ message: "Data uploaded successfully", success: true });
    } catch (error) {
        console.error(error);
        const err = error.message;
        res.status(500).json({
            error: 'Internal server error',
            err
        });
    }
}

// const handleDetailReportAdminPanel = async (req, res) => {
//     try {
//         const adminId = req.params.id;

//         //Check admin id is getting or not..
//         if (!adminId) {
//             return res.status(404).send({ message: "Admin ID not found...!!", success: false });
//         }

//         //check admin exist or not..
//         const adminExist = await AdminModel.findById(adminId).populate({
//             path: 'Tlm',
//             model: 'Tlm',
//             populate: {
//                 path: 'Slm',
//                 model: 'Slm',
//                 populate: {
//                     path: 'Flm',
//                     model: 'Flm',
//                     populate: {
//                         path: 'Mrs',
//                         model: 'Mr',
//                         populate: {
//                             path: 'Doctors',
//                             model: 'Quiz',
//                         }
//                     }
//                 }
//             }
//         });


//         if (!adminExist) {
//             return res.status(401).send({ message: "Admin not found..!!!", success: false });
//         }


//         //Store in empty conatiner...
//         const detailPatientlist = [];

//         //Loop Data of mr...
//         for (const tlm of adminExist.Tlm) {
//             for (const slm of tlm.Slm) {
//                 for (const flm of slm.Flm) {
//                     for (const mrs of flm.Mrs) {
//                         for (const doctors of mrs.Doctors) {
//                             const report = {
//                                 AID: adminExist.AdminId || '',
//                                 ANAME: adminExist.Name || '',
//                                 AROLE: adminExist.role || '',
//                                 AGENDER: adminExist.Gender || '',
//                                 ACONTACT: adminExist.MobileNumber || '',
//                                 TID: tlm.TLMEmpID,
//                                 TNAME: tlm.TLMName,
//                                 THQ: tlm.HQ,
//                                 TZONE: tlm.ZONE,
//                                 SID: slm.SLMEmpID || '',
//                                 SNAME: slm.SLMName || '',
//                                 SHQ: slm.HQ || '',
//                                 SREGION: slm.REGION || '',
//                                 SZONE: slm.ZONE || '',
//                                 FID: flm.FLMEmpID || '',
//                                 FNAME: flm.BDMName || '',
//                                 FHQ: flm.HQ || '',
//                                 FREGION: flm.REGION || '',
//                                 FZONE: flm.ZONE || '',
//                                 MID: mrs.MRID || '',
//                                 MNAME: mrs.USERNAME || '',
//                                 MPASS: mrs.PASSWORD || '',
//                                 MEMAIL: mrs.EMAIL || '',
//                                 MROLE: mrs.ROLE || '',
//                                 MREGION: mrs.REGION || '',
//                                 MZONE: mrs.ZONE || '',
//                                 MHQ: mrs.HQ || '',
//                                 MBUSINESSUNIT: mrs.BUSINESSUNIT || '',
//                                 MDOJ: moment(mrs.DOJ, 'DD/MM/YYYY').format('DD-MM-YYYY') || '',
//                                 DNAME: doctors.doctorName || '',
//                                 DNUMBER: doctors.scCode || '',
//                                 DEMAIL: doctors.email || '',
//                                 DSPEC: doctors.speciality || '',
//                                 DCITY: doctors.city || '',
//                                 DSTATE: doctors.state || '',
//                                 DLOCALITY: doctors.locality || '',
//                                 DPINCODE: doctors.pincode || '',
//                                 DDOC: moment(doctors.doc).format('DD-MM-YYYY') || '',
//                             }
//                             detailPatientlist.push(report);
//                         }
//                     }
//                 }
//             }
//         }

//         // //Send the response of loop data...
//         res.status(201).json(detailPatientlist);

//     } catch (error) {
//         console.error(error);
//         res.status(500).send({ message: "Internal Server Error", success: false });
//     }
// }


const handleDetailReportAdminPanel = async (req, res) => {
    try {
        const adminId = req.params.id;

        // Check admin id is getting or not..
        if (!adminId) {
            return res.status(404).send({ message: "Admin ID not found...!!", success: false });
        }

        // Fetch admin data including all related documents
        const adminExist = await AdminModel.findById(adminId).populate({
            path: 'Tlm',
            model: 'Tlm',
            populate: {
                path: 'Slm',
                model: 'Slm',
                populate: {
                    path: 'Flm',
                    model: 'Flm',
                    populate: {
                        path: 'Mrs',
                        model: 'Mr',
                    }
                }
            }
        });

        // Handle admin not found
        if (!adminExist) {
            return res.status(401).send({ message: "Admin not found..!!!", success: false });
        }

        // Store in empty container...
        const detailPatientlist = [];

        // Loop Data of mr...
        for (const tlm of adminExist.Tlm) {
            for (const slm of tlm.Slm) {
                for (const flm of slm.Flm) {
                    for (const mrs of flm.Mrs) {
                        const report = {
                            AID: adminExist.AdminId || '',
                            ANAME: adminExist.Name || '',
                            AROLE: adminExist.role || '',
                            AGENDER: adminExist.Gender || '',
                            ACONTACT: adminExist.MobileNumber || '',
                            TID: tlm.TLMEmpID,
                            TNAME: tlm.TLMName,
                            THQ: tlm.HQ,
                            TZONE: tlm.ZONE,
                            SID: slm.SLMEmpID || '',
                            SNAME: slm.SLMName || '',
                            SHQ: slm.HQ || '',
                            SREGION: slm.REGION || '',
                            SZONE: slm.ZONE || '',
                            FID: flm.FLMEmpID || '',
                            FNAME: flm.BDMName || '',
                            FHQ: flm.HQ || '',
                            FREGION: flm.REGION || '',
                            FZONE: flm.ZONE || '',
                            MID: mrs.MRID || '',
                            MNAME: mrs.USERNAME || '',
                            MPASS: mrs.PASSWORD || '',
                            MEMAIL: mrs.EMAIL || '',
                            MROLE: mrs.ROLE || '',
                            MREGION: mrs.REGION || '',
                            MZONE: mrs.ZONE || '',
                            MHQ: mrs.HQ || '',
                            MBUSINESSUNIT: mrs.BUSINESSUNIT || '',
                            MDOJ: moment(mrs.DOJ, 'DD/MM/YYYY').format('DD-MM-YYYY') || '',
                        };

                        // Check if the MR has doctors, if not, add an empty doctor object
                        if (mrs.Doctors.length === 0) {
                            report.DNAME = '';
                            report.DNUMBER = '';
                            report.DEMAIL = '';
                            report.DSPEC = '';
                            report.DCITY = '';
                            report.DSTATE = '';
                            report.DLOCALITY = '';
                            report.DPINCODE = '';
                            report.DDOC = '';
                        } else {
                            // Include doctor details if available
                            const doctors = mrs.Doctors[0]; // Assuming only one doctor is associated with MR
                            report.DNAME = doctors.doctorName || '';
                            report.DNUMBER = doctors.scCode || '';
                            report.DEMAIL = doctors.email || '';
                            report.DSPEC = doctors.speciality || '';
                            report.DCITY = doctors.city || '';
                            report.DSTATE = doctors.state || '';
                            report.DLOCALITY = doctors.locality || '';
                            report.DPINCODE = doctors.pincode || '';
                            report.DDOC = moment(doctors.doc).format('DD-MM-YYYY') || '';
                        }

                        detailPatientlist.push(report);
                    }
                }
            }
        }

        // Send the response of loop data...
        res.status(201).json(detailPatientlist);

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal Server Error", success: false });
    }
}








module.exports = {
    handleAdminCreation,
    handleAdminLogin,
    handleAdminGet,
    handleUpdateAdmin,
    handleMrData,
    handleDoctorDataUnderAdmin,
    handleSuperAdminCount,
    handleSuperAdminCreate,
    handleCreateContentAdmin,
    handleReportAdminCreate,
    verifyJwtForClient,
    handleExcelsheetUpload,
    handleDetailReportAdminPanel
}





