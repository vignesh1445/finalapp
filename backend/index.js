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

// ==================== SCHEMAS ====================

const studentSchema = new mongoose.Schema({
  rollNo: String,
  name: String,
});

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  date: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["P", "A"],
    required: true,
  },
});

const submissionSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true,
  },
  submitted: {
    type: Boolean,
    default: false,
  },
});

// ==================== MODELS ====================

const Student = mongoose.model(
  "Student",
  studentSchema
);

const Attendance = mongoose.model(
  "Attendance",
  attendanceSchema
);

const Submission = mongoose.model(
  "Submission",
  submissionSchema
);

// ==================== ROUTES ====================

app.get("/", (req, res) => {
  res.send("Server has started successfully");
});

// Get all students
app.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Add student
app.post("/students", async (req, res) => {
  try {
    const newStudent = await Student.create({
      rollNo: req.body.rollNo,
      name: req.body.name,
    });

    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Save attendance
app.post("/attendance", async (req, res) => {
  try {
    const { studentId, date, status } =
      req.body;

    const attendance =
      await Attendance.findOneAndUpdate(
        { studentId, date },
        {
          studentId,
          date,
          status,
        },
        {
          new: true,
          upsert: true,
        }
      );

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Get all attendance
app.get("/attendance", async (req, res) => {
  try {
    const attendance =
      await Attendance.find().populate(
        "studentId"
      );

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Get today's attendance
app.get(
  "/attendance/today",
  async (req, res) => {
    try {
      const today = new Date()
        .toISOString()
        .split("T")[0];

      const attendance =
        await Attendance.find({
          date: today,
        }).populate("studentId");

      res.status(200).json(attendance);
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// Submit attendance (LOCK)
app.post(
  "/attendance/submit",
  async (req, res) => {
    try {
      const today = new Date()
        .toISOString()
        .split("T")[0];

      const submission =
        await Submission.findOneAndUpdate(
          { date: today },
          { submitted: true },
          {
            new: true,
            upsert: true,
          }
        );

      res.status(200).json(submission);
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// Check attendance status
app.get(
  "/attendance/status",
  async (req, res) => {
    try {
      const today = new Date()
        .toISOString()
        .split("T")[0];

      const submission =
        await Submission.findOne({
          date: today,
        });

      res.status(200).json({
        submitted:
          submission?.submitted || false,
      });
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// Reset attendance + unlock
app.delete(
  "/attendance/today",
  async (req, res) => {
    try {
      const today = new Date()
        .toISOString()
        .split("T")[0];

      const result =
        await Attendance.deleteMany({
          date: today,
        });

      await Submission.findOneAndDelete({
        date: today,
      });

      res.status(200).json({
        message:
          "Today's attendance reset successfully.",
        deletedCount:
          result.deletedCount,
      });
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ==================== SERVER ====================

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Server is running on PORT ${PORT}`
  );
});