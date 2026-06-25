import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    getStudents();
  }, []);

  const getStudents = async () => {
    try {
      setLoading(true);

      const studentsRes = await fetch(`${API_URL}/students`);
      const attendanceRes = await fetch(`${API_URL}/attendance/today`);

      const studentsData = await studentsRes.json();
      const attendanceData = await attendanceRes.json();

      const attendanceMap = {};

      attendanceData.forEach((record) => {
        const studentId = record.studentId?._id || record.studentId;
        attendanceMap[studentId] = record.status;
      });

      const updated = studentsData.map((s) => ({
        ...s,
        attendance: attendanceMap[s._id] || "",
      }));

      setStudents(updated);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveAttendance = async (id, status) => {
    await fetch(`${API_URL}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: id,
        status,
        date: new Date().toISOString().split("T")[0],
      }),
    });
  };

  const mark = (id, status) => {
    if (submitted) return;

    setStudents((prev) =>
      prev.map((s) =>
        s._id === id ? { ...s, attendance: status } : s
      )
    );

    saveAttendance(id, status);
  };

  const submitAll = () => {
    setSubmitted(true);
  };

  const resetAll = async () => {
    await fetch(`${API_URL}/attendance/today`, {
      method: "DELETE",
    });

    setStudents((prev) =>
      prev.map((s) => ({ ...s, attendance: "" }))
    );

    setSubmitted(false);
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      String(s.rollNo).includes(search)
  );

  const present = students.filter((s) => s.attendance === "P").length;
  const absent = students.filter((s) => s.attendance === "A").length;

  return (
    <div className="page">

      {/* HEADER */}
      <div className="header">
        <h1>Smart Attendance Panel</h1>
        <p>Mark, Track & Manage Student Attendance</p>

        {/* 🔥 LIVE PROJECT LINK */}
        <a
          href="https://your-live-project-link.com"
          target="_blank"
          rel="noreferrer"
          className="live-link"
        >
          🔗 View Live Project
        </a>
      </div>

      {/* SEARCH + ACTIONS */}
      <div className="top-bar">
        <input
          placeholder="🔍 Search student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="actions">
          <button className="reset" onClick={resetAll}>
            Reset
          </button>

          <button className="submit" onClick={submitAll}>
            Submit
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="card green">
          Present <span>{present}</span>
        </div>
        <div className="card red">
          Absent <span>{absent}</span>
        </div>
        <div className="card blue">
          Total <span>{students.length}</span>
        </div>
        <div className="card purple">
          Marked <span>{present + absent}</span>
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="loading">Loading students...</div>
      ) : (
        <div className="table-box">
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Actions</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((s) => (
                <tr key={s._id}>
                  <td>{s.rollNo}</td>
                  <td>{s.name}</td>

                  <td>
                    <button
                      disabled={submitted}
                      className="btn present"
                      onClick={() => mark(s._id, "P")}
                    >
                      Present
                    </button>

                    <button
                      disabled={submitted}
                      className="btn absent"
                      onClick={() => mark(s._id, "A")}
                    >
                      Absent
                    </button>
                  </td>

                  <td>
                    {s.attendance === "P"
                      ? "🟢 Present"
                      : s.attendance === "A"
                      ? "🔴 Absent"
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;