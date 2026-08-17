import React, { useState, useEffect } from "react";
import { apiRequest } from "../../api";
import { fmt12, currentDayName } from "../../utils/helpers";
import NotifBanner from "../reminders/NotifBanner";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function WeeklyTasksTab({ currentUser }) {
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [taskDay, setTaskDay] = useState("Monday");
  const [taskTime, setTaskTime] = useState("09:00");

  const todayDay = currentDayName();

  useEffect(() => {
    if (!currentUser) return;

    const fetchTasks = async () => {
      const data = await apiRequest("/weekly");
      setWeeklyTasks(data || []);
    };

    fetchTasks();
  }, [currentUser]);

  const refresh = async () => {
    const data = await apiRequest("/weekly");
    setWeeklyTasks(data || []);
  };

  const addTask = async () => {
    if (!taskName.trim()) return;

    await apiRequest("/weekly", "POST", {
      name: taskName.trim(),
      day: taskDay,
      reminder_time: taskTime,
    });

    setTaskName("");
    setTaskDay("Monday");
    setTaskTime("09:00");

    refresh();
  };

  const toggleDone = async (id) => {
    await apiRequest(`/weekly/${id}`, "PUT");
    refresh();
  };

  const delTask = async (id) => {
    await apiRequest(`/weekly/${id}`, "DELETE");
    refresh();
  };

  const grouped = DAYS.reduce((acc, d) => {
    acc[d] = weeklyTasks.filter((t) => t.day === d);
    return acc;
  }, {});

  return (
    <>
      <NotifBanner />

      <div className="section-title">Add Weekly Task</div>

      <div className="add-weekly-form">
        <input
          className="inp"
          placeholder="Task name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
        />

        <input
          className="inp"
          type="time"
          value={taskTime}
          onChange={(e) => setTaskTime(e.target.value)}
        />

        <div className="day-selector">
          {DAYS.map((d) => (
            <div
              key={d}
              className={`day-chip${taskDay === d ? " sel" : ""}`}
              onClick={() => setTaskDay(d)}
            >
              {d.slice(0, 3)}
            </div>
          ))}
        </div>

        <button className="add-btn" onClick={addTask}>
          + Add Task
        </button>
      </div>

      {DAYS.map((day) => {
        const tasks = grouped[day];
        if (!tasks.length) return null;

        const isToday = day === todayDay;

        return (
          <div key={day}>
            <div className="today-section-label">
              {day} {isToday && " (Today)"}
            </div>

            {tasks.map((task) => (
              <div key={task.id} className="weekly-task">
                <div
                  className={`task-check${task.done_this_week ? " done" : ""}`}
                  onClick={() => toggleDone(task.id)}
                >
                  {task.done_this_week ? "✓" : ""}
                </div>

                <div>
                  <div>{task.name}</div>
                  <div>reminder {fmt12(task.reminder_time)}</div>
                </div>

                <button onClick={() => delTask(task.id)}>×</button>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
