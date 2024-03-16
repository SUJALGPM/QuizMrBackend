const mongoose = require("mongoose");

const quizCategorySchema = new mongoose.Schema({
  categoryName: String,
  isPlayed: Boolean,
  TotalPoints: Number,
  doc: Date
});

const doctorSchema = mongoose.Schema({
  doctorName: String,
  scCode: {
    type: String,
    unique: true
  },
  city: String,
  state: String,
  locality: String,
  speciality: String,

  email: {
    type: String,
    unique: true
  },
  pincode: String,

  doc: Date,
  mrReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mr",
  },
  quizCategories: [quizCategorySchema],
});

const Quiz = mongoose.model("Quiz", doctorSchema);

module.exports = Quiz


