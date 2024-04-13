const express = require('express');
const app = express();
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const apicache = require("apicache");






// Middleware (INBUILT);
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));
dotenv.config();



// Mongodb Connection
mongoose.set("strictQuery", false);
mongoose.connect(process.env.URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const conn = mongoose.connection;

conn.once('open', () => {
  console.log("Mongoose connection is done");
})


app.get('/', (req, res) => {
  return res.send(" <p>QUIZ's Backend</p>")
})

const QuizRoutes = require("./routes/Quiz");
const MrRotues = require("./routes/Mr");
const AdminRoutes = require("./routes/admin");
const logoRoute = require("./routes/adminlogo");
const tlmroute = require("./routes/Tlm");
const slmroute = require("./routes/Slm");
const flmroute = require("./routes/Flm");
app.use('/api', QuizRoutes);
app.use('/api', MrRotues);
app.use("/api", AdminRoutes);
app.use('/api', logoRoute);
app.use('/api', tlmroute);
app.use('/api', slmroute);
app.use('/api', flmroute);


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server is running At", port);
})
