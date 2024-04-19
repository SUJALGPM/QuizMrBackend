const Quiz = require("../models/Quiz");
const mrModel = require("../models/Mr");
const axios = require("axios");

// exports.postDrData = async (req, res) => {
//   const { doctorName, speciality, email, city, state, mrId, scCode, locality, pincode, date } = req.body;

//   let mr = await mrModel.findById({ _id: mrId });
//   if (!mr) return res.status(400).json({ msg: "MR Not Found" });
//   let doctor = await Quiz.findOne({ scCode });
//   if (doctor) return res.status(400).json({ msg: "Same ScCODE is find in the database" });



//   try {

//     const docterEmailCheck = await Quiz.findOne({ email: email });
//     if (doctorEmailCheck) {
//       return res.status(501).send({ message: "Doctor Email must be unqiue", success: false });
//     }

//     const newDoctor = new Quiz({
//       doctorName: doctorName,
//       speciality: speciality,
//       email: email,
//       city: city,
//       state: state,
//       scCode: scCode,
//       locality: locality,
//       pincode: pincode,
//       doc: date ? new Date(date) : Date.now(),
//       mrReference: mr._id,
//     });

//     const data = await newDoctor.save();
//     const Id = data._id;
//     return res.status(201).json({
//       message: "Doctor data inserted",
//       Id,
//       data: data
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

exports.postDrData = async (req, res) => {

  const { doctorName, speciality, email, city, state, mrId, scCode, locality, pincode, date } = req.body;

  // // Validate email format
  // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // if (!emailRegex.test(email)) {
  //   return res.status(400).json({ msg: "Invalid email format" });
  // }

  let mr = await mrModel.findById({ _id: mrId });
  if (!mr) return res.status(400).json({ msg: "MR Not Found" });

  let doctor = await Quiz.findOne({ scCode });
  if (doctor) return res.status(400).json({ msg: "Same Number is found in the database" });

  try {
    const doctorEmailCheck = await Quiz.findOne({ email: email });
    if (doctorEmailCheck) {
      return res.status(501).send({ message: "Doctor Email must be unique", success: false });
    }

    const newDoctor = new Quiz({
      doctorName: doctorName,
      speciality: speciality,
      email: email,
      city: city,
      state: state,
      scCode: scCode,
      locality: locality,
      pincode: pincode,
      doc: date ? new Date(date) : Date.now(),
      mrReference: mr._id,
    });

    const data = await newDoctor.save();
    const Id = data._id;
    return res.status(201).json({
      message: "Doctor data inserted",
      Id,
      data: data
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }

}

exports.getDoctorName = async (req, res) => {
  try {
    const doctorNames = await Quiz.find({}).populate({
      path: "mrReference",
      select: "MRID REGION HQ USERNAME DOJ",
    });
    let doctorNameArray = doctorNames.map((doc) => {
      const doctorData = {
        Id: doc._id,
        doctorName: doc.doctorName,
        scCode: doc.scCode,
        city: doc.city,
        state: doc.state,
        locality: doc.locality,
        quizCategories: doc.quizCategories,
      };

      if (doc.mrReference) {
        doctorData.hq = doc.mrReference.HQ;
        doctorData.mrId = doc.mrReference.MRID;
        doctorData.region = doc.mrReference.REGION;
        doctorData.username = doc.mrReference.USERNAME;

      } else {
        doctorData.hq = null;
        doctorData.mrId = null;
        doctorData.region = null;
        doctorData.username = null;
      }
      return doctorData;
    });

    console.log({ doctorNameArray });

    return res.json(doctorNameArray);
  } catch (error) {
    console.error(error);
    const errorMessage = error.message;
    return res
      .status(500)
      .json({ message: "Internal Server Error", errorMessage });
  }
};

exports.handleUserDataById = async (req, res) => {
  const userId = req.params.userId;
  try {
    let doctor = [];
    doctor = await Quiz.findById(userId);
    console.log({ doctor });

    res.json(doctor);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.handleUserQuizSubmit = async (req, res) => {
  const userId = req.body.userId;
  const totalPoints = req.body.totalPoints;
  const categoryName = req.body.categoryName;
  const date = req.body.date;

  try {
    const user = await Quiz.findById(userId);

    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    console.log("Before update - user.quizCategories:", user.quizCategories);

    // Create quizCategories array if it doesn't exist
    if (!user.quizCategories) {
      user.quizCategories = [];
    }

    console.log(
      "After initializing - user.quizCategories:",
      user.quizCategories
    );

    // Check if the category exists
    const existingCategory = user.quizCategories.find(
      (category) => category.categoryName === categoryName
    );

    if (!existingCategory) {
      console.log(`Adding new category: ${categoryName}`);
      // If the category doesn't exist, add it to the array
      user.quizCategories.push({
        categoryName,
        isPlayed: false,
        TotalPoints: 0,
        doc: date ? new Date(date) : Date.now(),
      });
    } else if (existingCategory.isPlayed) {
      return res.status(200).json({ msg: "Category already played" });
    }

    console.log("After updating - user.quizCategories:", user.quizCategories);

    // Update the category as played and set the total points
    const updatedCategory = user.quizCategories.find(
      (category) => category.categoryName === categoryName
    );
    updatedCategory.isPlayed = true;
    updatedCategory.TotalPoints = totalPoints;

    await user.save();

    const users = await Quiz.find({
      "quizCategories.categoryName": categoryName,
      "quizCategories.isPlayed": true,
    })
      .select("doctorName quizCategories")
      .exec();



    // Extract doctor names and scores from the result
    let categoryLeaderboard = users.map((user) => ({
      doctorName: user.doctorName,
      score: user.quizCategories.find(
        (category) => category.categoryName === categoryName
      ).TotalPoints,
    }));
    console.log(categoryLeaderboard);

    return res.status(200).json({
      msg: "QuizCategory updated successfully",
      categoryName,
      categoryLeaderboard,
    });
  } catch (error) {
    console.log("error: ", error);
    return res.status(400).json({ msg: "Internal Server Error", error });
  }
};

//In this api the score is udpated that is not right but this is first score api...
// exports.handleUserQuizSubmitV2 = async (req, res) => {
//   const userId = req.body.userId;
//   const totalPoints = req.body.totalPoints;
//   const categoryName = req.body.categoryName;
//   const date = req.body.date;

//   try {
//     const user = await Quiz.findById(userId);

//     if (!user) {
//       return res.status(401).json({ msg: "User not found" });
//     }

//     console.log("Before update - user.quizCategories:", user.quizCategories);

//     // Create quizCategories array if it doesn't exist
//     if (!user.quizCategories) {
//       user.quizCategories = [];
//     }



//     // Check if the category exists
//     const existingCategory = user.quizCategories.find(
//       (category) => category.categoryName === categoryName
//     );

//     console.log({});

//     if (!existingCategory) {
//       console.log(`Adding new category: ${categoryName}`);
//       // If the category doesn't exist, add it to the array
//       user.quizCategories.push({
//         categoryName,
//         isPlayed: false,
//         TotalPoints: 0,
//         doc: date ? new Date(date) : Date.now(),
//       });
//     } else if (existingCategory.isPlayed) {


//       // Update the category as played and set the total points
//       const updatedCategory = user.quizCategories.find(
//         (category) => category.categoryName === categoryName
//       );
//       updatedCategory.isPlayed = true;
//       updatedCategory.TotalPoints = totalPoints;
//       updatedCategory.doc = date ? new Date(date) : Date.now();

//       await user.save();

//       const users = await Quiz.find({
//         "quizCategories.categoryName": categoryName,
//         "quizCategories.isPlayed": true,
//       })
//         .select("doctorName quizCategories")
//         .exec();



//       // Extract doctor names and scores from the result
//       let categoryLeaderboard = users.map((user) => ({
//         doctorName: user.doctorName,
//         score: user.quizCategories.find(
//           (category) => category.categoryName === categoryName
//         ).TotalPoints,
//       }));

//       return res.status(200).json({

//         // version 2 
//         msg: "QuizCategory updated successfully ",
//         categoryName,
//         categoryLeaderboard,
//       });





//       // return res.status(200).json({ msg: "Category already played" });
//     }



//     // Update the category as played and set the total points
//     const updatedCategory = user.quizCategories.find(
//       (category) => category.categoryName === categoryName
//     );
//     updatedCategory.isPlayed = true;
//     updatedCategory.TotalPoints = totalPoints;

//     await user.save();

//     const users = await Quiz.find({
//       "quizCategories.categoryName": categoryName,
//       "quizCategories.isPlayed": true,
//     })
//       .select("doctorName quizCategories")
//       .exec();



//     // Extract doctor names and scores from the result
//     let categoryLeaderboard = users.map((user) => ({
//       doctorName: user.doctorName,
//       score: user.quizCategories.find(
//         (category) => category.categoryName === categoryName
//       ).TotalPoints,
//     }));

//     return res.status(200).json({
//       msg: "QuizCategory updated successfully",
//       categoryName,
//       categoryLeaderboard,
//     });
//   } catch (error) {
//     console.log("error: ", error);
//     return res.status(400).json({ msg: "Internal Server Error", error });
//   }
// };

let a = 0;

//In this api score added but the isPlayed value is false when the user played new category 1st time
// exports.handleUserQuizSubmitV2 = async (req, res) => {
//   const userId = req.body.userId;
//   const totalPoints = req.body.totalPoints;
//   const categoryName = req.body.categoryName;
//   const date = req.body.date;

//   try {
//     const user = await Quiz.findById(userId);

//     if (!user) {
//       return res.status(401).json({ msg: "User not found" });
//     }

//     console.log("Before update - user.quizCategories:", user.quizCategories);

//     // Create quizCategories array if it doesn't exist
//     if (!user.quizCategories) {
//       user.quizCategories = [];
//     }

//     // Check if the category exists
//     const existingCategory = user.quizCategories.find(
//       (category) => category.categoryName === categoryName
//     );

//     if (!existingCategory) {
//       console.log(`Adding new category: ${categoryName}`);
//       // If the category doesn't exist, add it to the array
//       user.quizCategories.push({
//         categoryName,
//         isPlayed: false,
//         TotalPoints: totalPoints,
//         doc: date ? new Date(date) : Date.now(),
//       });
//     } else if (existingCategory.isPlayed) {
//       // Add the new score to the existing totalPoints
//       const updatedCategory = user.quizCategories.find(
//         (category) => category.categoryName === categoryName
//       );
//       updatedCategory.TotalPoints += totalPoints; // Add to the existing score
//       updatedCategory.doc = date ? new Date(date) : Date.now(); // Update the date

//       await user.save();

//       const users = await Quiz.find({
//         "quizCategories.categoryName": categoryName,
//         "quizCategories.isPlayed": true,
//       })
//         .select("doctorName quizCategories")
//         .exec();

//       // Extract doctor names and scores from the result
//       let categoryLeaderboard = users.map((user) => ({
//         doctorName: user.doctorName,
//         score: user.quizCategories.find(
//           (category) => category.categoryName === categoryName
//         ).TotalPoints,
//       }));

//       return res.status(200).json({
//         msg: "QuizCategory updated successfully ",
//         categoryName,
//         categoryLeaderboard,
//       });
//     }

//     await user.save();

//     const users = await Quiz.find({
//       "quizCategories.categoryName": categoryName,
//       "quizCategories.isPlayed": true,
//     })
//       .select("doctorName quizCategories")
//       .exec();

//     // Extract doctor names and scores from the result
//     let categoryLeaderboard = users.map((user) => ({
//       doctorName: user.doctorName,
//       score: user.quizCategories.find(
//         (category) => category.categoryName === categoryName
//       ).TotalPoints,
//     }));

//     return res.status(200).json({
//       msg: "QuizCategory updated successfully",
//       categoryName,
//       categoryLeaderboard,
//     });
//   } catch (error) {
//     console.log("error: ", error);
//     return res.status(400).json({ msg: "Internal Server Error", error });
//   }
// };

exports.handleUserQuizSubmitV2 = async (req, res) => {
  const userId = req.body.userId;
  const totalPoints = req.body.totalPoints;
  const categoryName = req.body.categoryName;
  const date = req.body.date;

  try {
    const user = await Quiz.findById(userId);

    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    console.log("Before update - user.quizCategories:", user.quizCategories);

    // Create quizCategories array if it doesn't exist
    if (!user.quizCategories) {
      user.quizCategories = [];
    }

    // Check if the category exists
    const existingCategory = user.quizCategories.find(
      (category) => category.categoryName === categoryName
    );

    if (!existingCategory) {
      console.log(`Adding new category: ${categoryName}`);
      // If the category doesn't exist, add it to the array with isPlayed set to true
      user.quizCategories.push({
        categoryName,
        isPlayed: true, // Set isPlayed to true for a new category
        TotalPoints: totalPoints, // Initialize with the provided totalPoints
        doc: date ? new Date(date) : Date.now(),
      });
    } else if (existingCategory.isPlayed) {
      // Add the new score to the existing totalPoints
      const updatedCategory = user.quizCategories.find(
        (category) => category.categoryName === categoryName
      );
      updatedCategory.TotalPoints += totalPoints; // Add to the existing score
      updatedCategory.doc = date ? new Date(date) : Date.now(); // Update the date
    }

    await user.save();

    const users = await Quiz.find({
      "quizCategories.categoryName": categoryName,
      "quizCategories.isPlayed": true,
    })
      .select("doctorName quizCategories")
      .exec();

    // Extract doctor names and scores from the result
    let categoryLeaderboard = users.map((user) => ({
      doctorName: user.doctorName,
      score: user.quizCategories.find(
        (category) => category.categoryName === categoryName
      ).TotalPoints,
    }));

    return res.status(200).json({
      msg: "QuizCategory updated successfully",
      categoryName,
      categoryLeaderboard,
    });
  } catch (error) {
    console.log("error: ", error);
    return res.status(400).json({ msg: "Internal Server Error", error });
  }
};


exports.handleLeaderBoardFilter = async (req, res) => {
  const state = req.body.state;
  const categoryName = req.body.categoryName;

  try {
    if (!state || !categoryName) {
      return res.status(400).json({
        msg: "State and categoryName are required",
      });
    }

    // Find all users from the specified state
    const users = await Quiz.find({ state });

    if (!users || users.length === 0) {
      return res.status(404).json({
        msg: "No users found for the given state",
      });
    }

    console.log({ state });

    // Filter users by category and isPlayed flag
    const categoryLeaderboard = users
      .filter((user) => {
        const category = user.QuizCategory && user.QuizCategory[categoryName];
        return category && category.isPlayed === true;
      })
      .map((user) => ({
        doctorName: user.doctorName,
        score: user.QuizCategory[categoryName].TotalPoints,
      }));

    console.log({ categoryLeaderboard });

    return res.status(200).json({
      msg: "Leaderboard retrieved successfully",
      categoryLeaderboard,
    });
  } catch (error) {
    console.error("Error in handleLeaderBoardFilter Route: ", error);
    return res.status(500).json({
      msg: "Internal Server Error",
    });
  }
};

exports.handleLeaderFilterByCategoryName = async (req, res) => {
  const categoryName = req.params.categoryName;
  const { mrId } = req.params;
  console.log({ categoryName });
  try {
    if (!categoryName) {
      return res.status(400).json({
        msg: "CategoryName is required",
      });
    }

    if (!mrId) {
      return res.status(400).json({
        msg: "mrId is required",
      });
    }
    const users = await Quiz.find({
      "quizCategories.categoryName": categoryName,
      "quizCategories.isPlayed": true,
      mrReference: mrId,
    });

    const categoryLeaderboard = users.map((user) => ({
      doctorName: user.doctorName,
      state: user.state,
      score: user.quizCategories[0].TotalPoints,
    }));

    return res.status(200).json({
      msg: "Category leaderboard retrieved successfully",
      categoryLeaderboard,
    });
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({
      msg: "Internal Server Error",
    });
  }
};

exports.handleUsersStateAndName = async (req, res) => {
  try {
    const doctorDetails = await Quiz.find().select(
      "doctorName state city -_id"
    );
    console.log({ doctorDetails });
    return res.json(doctorDetails);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

exports.handleOnlyNameWithId = async (req, res) => {
  try {
    const { mrId } = req.body;
    const doctors = await Quiz.find({ mrReference: mrId }).select(
      "_id doctorName scCode city speciality state email pincode"
    );
    if (!doctors || doctors.length === 0) {
      return res.status(404).json({
        msg: "No Doctors Found for the specified MR",
      });
    }
    console.log({ doctors });

    return res.status(200).json(doctors);
  } catch (e) {
    console.log("error: ");
    return res.status(501).json({
      msg: "Error in handleOnlyNameWithId",
    });
  }
};

exports.handleUserCategory = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(401).json({
        msg: "User Id Required",
      });
    }

    const user = await Quiz.findById(userId).select("quizCategories").lean(); // Adjust the field name to match your schema
    console.log("user", user);

    if (!user) {
      return res.status(401).json({
        msg: "No Game Category Found",
      });
    }

    const userCategories = user.quizCategories;
    const formattedCategories = [];

    for (const category of userCategories) {
      formattedCategories.push({
        categoryName: category.categoryName, // Adjust the property name
        isPlayed: category.isPlayed,
        TotalPoints: category.TotalPoints,
      });
    }

    return res.status(200).json(formattedCategories);
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({
      msg: "Internal Server Error",
    });
  }
};

// exports.handleUserCategoryWithQuestion = async (req, res) => {
//   const { userId } = req.params;

//   try {
//     if (!userId) {
//       return res.status(401).json({
//         msg: "User Id Required",
//       });
//     }
//     const user = await Quiz.findById(userId).select("quizCategories").lean();
//     if (!user) {
//       return res.status(401).json({
//         msg: "No Game Category Found",
//       });
//     }

//     const userCategories = user.quizCategories;
//     const formattedCategories = [];
//     for (const category of userCategories) {
//       formattedCategories.push({
//         categoryName: category.categoryName,
//         isPlayed: category.isPlayed,
//         TotalPoints: category.TotalPoints,
//       });
//     }

//     let OnlyActiveCategories = [];
//     try {
//       const response = await axios.get(
//         "https://quizadminbackend-wg1y.onrender.com/onlyactivecategories"
//       );
//       OnlyActiveCategories = response.data;
//     } catch (error) {
//       console.error(error);
//     }

//     const onlyFourActiveQuestions = [];

//     await Promise.all(
//       OnlyActiveCategories.map(async (Category) => {
//         let category = Category.name;
//         console.log({ category });

//         try {
//           const response = await axios.get(
//             `https://quizadminbackend-wg1y.onrender.com/api/questionsfour?category=${category}`
//           );
//           onlyFourActiveQuestions.push(response.data);
//         } catch (error) {
//           console.error(error);
//         }
//       })
//     );

//     let MultipleQuestions = [];
//     try {
//       const response = await axios.get(
//         "https://quizadminbackend-wg1y.onrender.com/api/questions"
//       );
//       MultipleQuestions = response.data;
//     } catch (error) {
//       console.error(error);
//     }

//     return res
//       .status(200)
//       .json({
//         formattedCategories,
//         OnlyActiveCategories,
//         onlyFourActiveQuestions,
//         MultipleQuestions,
//       });
//   } catch (error) {
//     const err = error.message;
//     console.error(error);
//     return res.status(500).json({
//       msg: "Internal Server Error",
//       err,
//     });
//   }
// };

exports.handleUserCategoryWithQuestion = async (req, res) => {
  const { mrId } = req.params;

  try {
    if (!mrId) {
      return res.status(401).json({
        msg: "MR ID Required",
      });
    }

    const mr = await mrModel.findById(mrId).lean();

    if (!mr) {
      return res.status(401).json({
        msg: "No MR Found with this ID",
      });
    }

    const mrID = await mr._id;
    console.log("MR IDs : ", mrID);

    // const doctor = await Quiz.findOne({ mrReference: mrID }).lean().populate('quizCategories');
    // console.log("Doctor under MR :", doctor);

    // if (!doctor) {
    //   return res.status(401).json({
    //     msg: "No Doctor Found for this MR", 
    //   });
    // }

    // const formattedCategories = doctor.quizCategories.map((category) => ({
    //   categoryName: category.categoryName,
    //   isPlayed: category.isPlayed,
    //   TotalPoints: category.TotalPoints,
    // }));

    let OnlyActiveCategories = [];
    try {
      const response = await axios.get(
        "https://quizadminbackend-wg1y.onrender.com/onlyactivecategories"
      );
      OnlyActiveCategories = response.data;
    } catch (error) {
      console.error(error);
    }

    const onlyFourActiveQuestions = await Promise.all(
      OnlyActiveCategories.map(async (Category) => {
        const category = Category.name;
        console.log({ category });

        try {
          const response = await axios.get(
            `https://quizadminbackend-wg1y.onrender.com/api/questionsfour?category=${category}`
          );
          return response.data; // Return the data directly
        } catch (error) {
          console.error(error);
        }
      })
    );

    let MultipleQuestions = [];
    try {
      const response = await axios.get(
        "https://quizadminbackend-wg1y.onrender.com/api/questions"
      );
      MultipleQuestions = response.data;
    } catch (error) {
      console.error(error);
    }

    return res
      .status(200)
      .json({
        // formattedCategories,
        OnlyActiveCategories,
        onlyFourActiveQuestions,
        MultipleQuestions,
      });
  } catch (error) {
    const err = error.message;
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error",
      err,
    });
  }
};

exports.handleDoctorStatus = async (req, res) => {
  try {
    // Get the current date
    const currentDate = new Date();

    // Calculate the start and end dates for the current month
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

    // Find doctors based on the current month
    const currentMonthDoctors = await Quiz.find({
      doc: { $gte: startOfMonth, $lte: endOfMonth },
    }).select("-quizCategories")

    // Find doctors not in the current month
    const otherMonthDoctors = await Quiz.find({
      doc: { $lt: startOfMonth },
    }).select("-quizCategories")

    return res.status(200).json(
      {
        currentMonthDoctors,
        otherMonthDoctors,
      }
    );
  } catch (error) {
    const err = error.message;
    console.error(error);
    return res.status(500).json({
      msg: "Internal Server Error",
      err,
    });
  }
};


exports.handleAddDoctorV2 = async (req, res) => {
  const { doctorName, city, state, mrId, scCode, locality, date, speciality } = req.body;

  let mr = await mrModel.findById({ _id: mrId });
  if (!mr) return res.status(400).json({ msg: "MR Not Found" });
  let doctor = await Quiz.findOne({ scCode });
  if (doctor) return res.status(400).json({ msg: "Same scCode is find in the database" });


  const newDoctor = new Quiz({
    city: city,
    state: state,
    scCode: scCode,
    locality: locality,
    speciality: speciality,
    doctorName: doctorName,
    doc: date ? new Date(date) : Date.now(),
    mrReference: mr._id,
  });

  try {
    const data = await newDoctor.save();
    const Id = data._id;
    return res.status(201).json({
      message: "Doctor data inserted v2",
      Id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }

}

exports.handleDoctorUpdate = async (req, res) => {
  try {
    const { doctorId, DoctorName, City, State, Email, Speciality, Pincode } = req.body;

    //Check doctor id getting or not....
    if (!doctorId) {
      return res.status(404).send({ message: "Doctor ID not found..!!", success: false });
    }

    //Check doctor exist or not...
    const doctorExist = await Quiz.findById(doctorId);
    if (!doctorExist) {
      return res.status(404).send({ message: "Doctor not found..!!", success: false });
    }

    //Format data before update...
    const formatNewValue = {
      doctorName: DoctorName,
      city: City,
      state: State,
      speciality: Speciality,
      email: Email,
      pincode: Pincode,
    }

    //Update doctor details...
    const doctorUpdate = await Quiz.findByIdAndUpdate(doctorId, formatNewValue, { new: true });

    //Send response after update..
    res.status(201).send({ message: "Doctor Details update successfully..", success: true, data: doctorUpdate });

  } catch (err) {
    console.log(err);
    res.status(501).send({ message: "Failed to update doctor details...", success: false });
  }

}