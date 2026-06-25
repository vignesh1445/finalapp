import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    getStudents();
  }, []);

  const getStudents = async () => {
    try {
      setLoading(true);

      const studentsRes = await fetch(`${API_URL}/students`);
      const attendanceRes = await fetch(
        `${API_URL}/attendance/today`
      );

      if (!studentsRes.ok || !attendanceRes.ok) {
        throw new Error("API request failed");
      }

      const studentsData = await studentsRes.json();
      const attendanceData = await attendanceRes.json();

      const attendanceMap = {};

      attendanceData.forEach((record) => {
        const studentId =
          record.studentId?._id || record.studentId;

        attendanceMap[studentId] = record.status;
      });

      const updatedStudents = studentsData.map((student) => ({
        ...student,
        attendance: attendanceMap[student._id] || "",
      }));

      setStudents(updatedStudents);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveAttendance = async (
    studentId,
    status
  ) => {
    try {
      await fetch(`${API_URL}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          studentId,
          status,
          date: new Date()
            .toISOString()
            .split("T")[0],
        }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const markAttendance = (id, status) => {
    if (submitted) return;

    setStudents((prev) =>
      prev.map((student) =>
        student._id === id
          ? {
              ...student,
              attendance: status,
            }
          : student
      )
    );

    saveAttendance(id, status);
  };

  const submitAttendance = () => {
    setSubmitted(true);
    alert("Attendance Submitted Successfully!");
  };

  const resetAttendance = async () => {
    try {
      await fetch(
        `${API_URL}/attendance/today`,
        {
          method: "DELETE",
        }
      );

      setStudents((prev) =>
        prev.map((student) => ({
          ...student,
          attendance: "",
        }))
      );

      setSubmitted(false);
    } catch (error) {
      console.error(error);
    }
  };

  const presentCount = students.filter(
    (s) => s.attendance === "P"
  ).length;

  const absentCount = students.filter(
    (s) => s.attendance === "A"
  ).length;

  const totalMarked =
    presentCount + absentCount;

  const filteredStudents = students.filter(
    (student) =>
      student.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(student.rollNo).includes(search)
  );

  return (
    <div className="container">
      <h1>🎓 Attendance Management System</h1>

      <input
        type="text"
        placeholder="Search by name or roll no..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

      <div className="summary">
        <h3>🟢 Present : {presentCount}</h3>
        <h3>🔴 Absent : {absentCount}</h3>
        <h3>
          👨‍🎓 Total Students :
          {students.length}
        </h3>
        <h3>📊 Marked : {totalMarked}</h3>
      </div>

      <div className="reset-section">
        <button onClick={resetAttendance}>
          🔄 Reset All
        </button>

        <button
          onClick={submitAttendance}
          style={{ marginLeft: "10px" }}
        >
          ✅ Submit Attendance
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Name</th>
              <th>Attendance</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map(
              (student) => (
                <tr key={student._id}>
                  <td>{student.rollNo}</td>

                  <td>{student.name}</td>

                  <td>
                    <button
                      className="present-btn"
                      disabled={submitted}
                      onClick={() =>
                        markAttendance(
                          student._id,
                          "P"
                        )
                      }
                    >
                      Present
                    </button>

                    <button
                      className="absent-btn"
                      disabled={submitted}
                      onClick={() =>
                        markAttendance(
                          student._id,
                          "A"
                        )
                      }
                    >
                      Absent
                    </button>
                  </td>

                  <td>
                    {student.attendance === "P"
                      ? "🟢 Present"
                      : student.attendance === "A"
                      ? "🔴 Absent"
                      : "-"}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;