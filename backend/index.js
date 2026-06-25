import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.log("Database connection error:", err);
  });

// Schema
const studentSchema = new mongoose.Schema({
  rollNo: String,
  name: String,
});
const attendanceSchema =new mongoose.Schema({
  studentId: {
    type:mongoose.Schema.Types.ObjectId,
    ref: "Student"
  },
  date: {
    type: String,
    required:true
  },
  status: {
  type: String, 
  enum: ["P", "A"],
  required: true
}
});
const Attendance = mongoose.model(
  "Attendance",
  attendanceSchema
);
app.post("/attendance", async (req, res) => {
  try {
    const { studentId, date, status } = req.body;

    const attendance = await Attendance.findOneAndUpdate(
      { studentId, date },
      { studentId, date, status },
      { new: true, upsert: true }
    );

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/attendance",async(req,res)=>{
  try{
    const attendance= await Attendance.find().populate("studentId");
    res.status(200).json(attendance);
  }
  catch(err){
    res.status(500).json({error:err.message});
  }
    });


// Model (declare ONLY ONCE)
const Student = mongoose.model("Student", studentSchema);

// Route 1
app.get("/", (req, res) => {
  res.send("Server has started successfully");
});

// // Route 2
// app.get("/vignesh", (req, res) => {
//   res.send("HI");
// });

// Get all students
app.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a student
app.post("/students", async (req, res) => {
  try {
    const newStudent = await Student.create({
      rollNo: req.body.rollNo,
      name: req.body.name,
    });

    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = 3000;

// app.listen(PORT, () => {
//   console.log(`Server is running on PORT ${PORT}`);
// });
app.get("/attendance/today",async(req,res)=>{
  try{
    const today= new Date().toISOString().split("T")[0];
    const attendance = await Attendance.find({date: today})
    .populate("studentId");
    res.status(200).json(attendance)
  }

  catch(err){
    res.status(500).json({error: err.message});
  }

});app.delete("/attendance/today",async(req,res)=>{
  try{
  const today = new Date().toISOString().split("T")[0];
  const result = await Attendance.deleteMany({date: today});
  res.status(200).json({
    message: "Today's attendance has been copletly reset.",
    deletedCount: result.deletedCount
  });
} catch(err){
  res.status(500).json({error: err.message});
}

});
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
}); 