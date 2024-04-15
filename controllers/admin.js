
const AdminModel = require("../models/admin");
const tlmModel = require("../models/Tlm");
const slmModel = require("../models/Slm");
const flmModel = require("../models/Flm");
const doctorModel = require("../models/Quiz");
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken");
const Mr = require("../models/Mr");

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
    verifyJwtForClient
}





