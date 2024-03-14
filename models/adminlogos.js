const mongoose = require("mongoose")


const adminLogo = new mongoose.Schema({
    name: String,
    image: String,
});


module.exports = mongoose.model("adminlogo", adminLogo);