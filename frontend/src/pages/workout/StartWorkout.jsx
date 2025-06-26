import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../AuthProvider";

const API_URL = import.meta.env.VITE_BACKEND_URL;


const StartWorkout = () => {
  const { regimenId, workoutId } = useParams();
  const { uid } = useAuth();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState(null);
  const [regiments, setRegiments] = useState([]);
  const [error, setError] = useState("");
  const [checkedSets, setCheckedSets] = useState({});
  const [timers, setTimers] = useState({});
  const [selectedTimer, setSelectedTimer] = useState(null);

  const [logData, setLogData] = useState({
    user_id: uid,
    regiment_id: regimenId ? Number(regimenId) : null,
    actual_workout: [],
  });


  // Timer state
  const [timer, setTimer] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isRunning: false,
    intervalId: null
  });

  useEffect(() => {
    if (!uid) return;

    const fetchData = async () => {
      try {
        const [workoutRes, regimentsRes] = await Promise.all([
          axios.get(`${API_URL}/workouts/${workoutId}`),
          axios.get(`${API_URL}/workouts/regiments`)
        ]);

        const workoutData = workoutRes.data.item;
        setWorkout(workoutData);
        setRegiments(regimentsRes.data.items || []);

        if (workoutData.status !== "in_progress") {
          await axios.put(`${API_URL}/workouts/${workoutId}`, {
            current_user_id: uid,
            status: "in_progress",
          });
        }

        // Initialize state for sets and timers
        const initChecked = {};
        const initTimers = {};
        const initActualWorkout = [];

        workoutData.structure.forEach((exercise, eIdx) => {
          initChecked[eIdx] = {};
          initTimers[eIdx] = {};

          const actualExercise = {
            exercise_id: exercise.exercise_id,
            sets: {}
          };

          Object.entries(exercise.sets).forEach(([setKey, setVal]) => {
            initChecked[eIdx][setKey] = false;

            const timeInSeconds = setVal.time_unit?.toLowerCase().includes("min")
              ? (setVal.time || 0) * 60
              : setVal.time || 0;

            initTimers[eIdx][setKey] = {
              timeLeft: timeInSeconds,
              isRunning: false,
              hasFinished: false,
              intervalId: null,
            };

            const actualSet = {};
            if (setVal.reps !== undefined) actualSet.reps = setVal.reps;
            if (setVal.weight !== undefined) actualSet.weight = setVal.weight;
            if (setVal.time !== undefined) actualSet.time = setVal.time;
            if (setVal.laps !== undefined) actualSet.laps = setVal.laps;

            actualExercise.sets[setKey] = actualSet;
          });

          initActualWorkout.push(actualExercise);
        });

        setCheckedSets(initChecked);
        setTimers(initTimers);
        setLogData(prev => ({
          ...prev,
          actual_workout: initActualWorkout
        }));

      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load workout data.");
      }
    };

    fetchData();
  }, [workoutId, uid]);

  const startTimer = () => {
    if (timer.isRunning) return;

    const intervalId = setInterval(() => {
      setTimer(prev => {
        let { hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          clearInterval(intervalId);

          if (selectedTimer) {
            const { eIdx, setNumber } = selectedTimer;
            setCheckedSets(prevChecked => ({
              ...prevChecked,
              [eIdx]: {
                ...prevChecked[eIdx],
                [setNumber]: true,
              },
            }));

            setLogData(prev => {
              const updated = [...prev.actual_workout];
              const exercise = workout.structure[eIdx];
              const setTime = exercise.sets[setNumber].time;
              updated[eIdx].sets[setNumber].time = setTime;
              return { ...prev, actual_workout: updated };
            });
          }

          return { ...prev, isRunning: false };
        }

        return { hours, minutes, seconds, isRunning: true, intervalId };
      });
    }, 1000);

    setTimer(prev => ({ ...prev, isRunning: true, intervalId }));
  };

  const stopTimer = () => {
    if (!timer.isRunning) return;
    clearInterval(timer.intervalId);
    setTimer(prev => ({ ...prev, isRunning: false, intervalId: null }));
  };

  const resetTimer = (timeInSeconds) => {
    if (timer.intervalId) clearInterval(timer.intervalId);

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;

    setTimer({
      hours: 0,
      minutes,
      seconds,
      isRunning: false,
      intervalId: null
    });
  };

  const handleSetCheck = (eIdx, setNumber) => {
    setCheckedSets(prev => ({
      ...prev,
      [eIdx]: {
        ...prev[eIdx],
        [setNumber]: true,
      },
    }));
  };

  const handleSelectTimer = (eIdx, setNumber) => {
    const exercise = workout.structure[eIdx];
    const set = exercise.sets[setNumber];

    if (set.time) {
      const timeInSeconds = set.time_unit?.toLowerCase().includes("min")
        ? set.time * 60
        : set.time;

      resetTimer(timeInSeconds);
      setSelectedTimer({ eIdx, setNumber });
    }
  };

  const allExercisesComplete = () => {
    return workout?.structure.every((exercise, eIdx) =>
      Object.keys(exercise.sets).every(
        (setKey) => checkedSets?.[eIdx]?.[setKey]
      )
    );
  };

  const handleLogFieldChange = (field, value) => {
    setLogData(prev => ({
      ...prev,
      [field]: field === 'regiment_id' ? (value === "" ? null : Number(value)) : value
    }));
  };

  const handleActualSetChange = (exerciseIdx, setKey, field, value) => {
    const updated = [...logData.actual_workout];
    updated[exerciseIdx].sets[setKey][field] = value;
    setLogData(prev => ({ ...prev, actual_workout: updated }));
  };
  const handleFinish = async () => {
    if (!uid) {
      alert("User not authenticated. Please log in.");
      return;
    }

    if (!allExercisesComplete()) {
      alert("Please complete all exercises before finishing the workout.");
      return;
    }

    try {
      await axios.put(`${API_URL}/workouts/${workoutId}`, {
        current_user_id: uid,
        status: "completed",
      });

      const actualWorkoutWithUnits = workout.structure.map((exercise, eIdx) => {
        const exerciseLog = {
          exercise_id: exercise.exercise_id,
          sets: {}
        };

        Object.entries(exercise.sets).forEach(([setKey, setVal]) => {
          const actualSet = logData.actual_workout[eIdx]?.sets[setKey] || {};
          const plannedSet = exercise.sets[setKey];

          exerciseLog.sets[setKey] = {
            reps: actualSet.reps ?? plannedSet.reps,
            weight: actualSet.weight ?? plannedSet.weight,
            time: actualSet.time ?? plannedSet.time,
            laps: actualSet.laps ?? plannedSet.laps,
            weight_unit: plannedSet.weight_unit || "kg",
            time_unit: plannedSet.time_unit || "seconds"
          };

          Object.keys(exerciseLog.sets[setKey]).forEach(key => {
            if (exerciseLog.sets[setKey][key] === undefined) {
              delete exerciseLog.sets[setKey][key];
            }
          });
        });

        return exerciseLog;
      });

      const payload = {
        user_id: Number(uid),
        regiment_id: logData.regiment_id ? Number(logData.regiment_id) : null,
        regiment_day_index: 1, // hardcoded default (or you can remove if backend handles it)
        log_date: new Date().toISOString().split('T')[0],  // auto-generate current date
        planned_workout_id: Number(workoutId),  // from useParams directly
        actual_workout: actualWorkoutWithUnits
      };


      await axios.post(`${API_URL}/workouts/logs`, payload);
      alert("Workout completed and logged successfully!");
      navigate("/Workout_Management");
    } catch (err) {
      console.error("Error finishing workout:", err);
      let errorMessage = err.response?.data?.error?.message || err.message;
      if (err.response?.status === 404) {
        errorMessage = "The planned workout could not be found.";
      } else if (err.message.includes("foreign key constraint")) {
        errorMessage = "Invalid workout reference. The planned workout no longer exists.";
      }
      alert(`Error completing workout: ${errorMessage}`);
    }
  };


  if (error) return <p className="text-red-600 p-4">{error}</p>;
  if (!workout) return <p className="p-4">Loading workout...</p>;

  const TimerComponent = () => (
    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 w-11/12 max-w-sm bg-white p-4 rounded shadow-lg border">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Timer</h3>
        <button
          onClick={() => {
            stopTimer();
            setSelectedTimer(null);
          }}
          className="text-red-500 text-xl font-bold"
        >
          ❌
        </button>
      </div>
      <div className="flex justify-between mb-4">
        <div className="bg-gray-100 text-center p-3 rounded-md w-1/3">
          <p className="text-xl font-bold">
            {String(timer.hours).padStart(2, '0')}
          </p>
          <p className="text-xs text-gray-500">Hours</p>
        </div>
        <div className="bg-gray-100 text-center p-3 rounded-md w-1/3 mx-1">
          <p className="text-xl font-bold">
            {String(timer.minutes).padStart(2, '0')}
          </p>
          <p className="text-xs text-gray-500">Minutes</p>
        </div>
        <div className="bg-gray-100 text-center p-3 rounded-md w-1/3">
          <p className="text-xl font-bold">
            {String(timer.seconds).padStart(2, '0')}
          </p>
          <p className="text-xs text-gray-500">Seconds</p>
        </div>
      </div>
      <div className="flex gap-4">
        <button
          onClick={startTimer}
          disabled={timer.isRunning}
          className={`w-full py-2 rounded-full ${timer.isRunning
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gray-200 text-black hover:bg-gray-300'
            }`}
        >
          Start
        </button>
        <button
          onClick={stopTimer}
          disabled={!timer.isRunning}
          className={`w-full py-2 rounded-full ${!timer.isRunning
            ? 'bg-blue-300 text-white cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          Stop
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 mt-6 bg-white min-h-screen font-sans">
      <div className="flex justify-between mb-6">
        <button
          onClick={handleFinish}
          disabled={!allExercisesComplete()}
          className={`px-6 py-2 rounded-full shadow ${allExercisesComplete()
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
        >
          Finish & Log Workout
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
        <h3 className="text-lg font-semibold mb-4 text-[#4B9CD3]">Workout Log Details</h3>

      </div>

      {workout.structure.map((exercise, eIdx) => (
        <div key={eIdx} className="mb-6 bg-white rounded-lg shadow p-4 border">
          <h2 className="text-lg font-semibold mb-4 text-[#4B9CD3]">
            {exercise.exercise_details?.name || `Exercise ${exercise.exercise_id}`}
          </h2>

          {Object.entries(exercise.sets).map(([setNumber, set]) => {
            const isTime = !!set.time;
            const isChecked = checkedSets?.[eIdx]?.[setNumber];
            const actualSet = logData.actual_workout[eIdx]?.sets[setNumber] || {};
            const weightUnit = set.weight_unit || "kg";
            const timeUnit = set.time_unit || "seconds";

            return (
              <div key={setNumber} className="border rounded-lg p-3 mb-3 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-[#4B9CD3]">Set {setNumber}</p>
                    <p className="text-sm text-gray-600">
                      Planned: {isTime ? `${set.time} ${timeUnit}` : `${set.reps} Reps`}
                      {set.weight ? ` / ${set.weight} ${weightUnit}` : ""}
                      {set.laps ? ` / ${set.laps} Laps` : ""}
                    </p>
                  </div>

                  <div className="flex gap-2 items-center">
                    {isTime && (
                      <button
                        onClick={() => handleSelectTimer(eIdx, setNumber)}
                        className="bg-[#4B9CD3] text-white px-2 py-1 rounded hover:bg-blue-500"
                      >
                        Timer
                      </button>
                    )}
                    <button
                      onClick={() => handleSetCheck(eIdx, setNumber)}
                      className={`px-3 py-1 rounded-full text-sm ${isChecked
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-black hover:bg-gray-300"
                        }`}
                    >
                      Done
                    </button>
                  </div>
                </div>

                <div className="border-t pt-2 mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Actual Performance:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {"reps" in actualSet && (
                      <div>
                        <label className="block text-xs text-gray-500">Reps</label>
                        <input
                          type="number"
                          value={actualSet.reps}
                          onChange={(e) => handleActualSetChange(eIdx, setNumber, "reps", e.target.value)}
                          className="border p-1 rounded w-full"
                          min="0"
                        />
                      </div>
                    )}
                    {"weight" in actualSet && (
                      <div>
                        <label className="block text-xs text-gray-500">Weight ({weightUnit})</label>
                        <input
                          type="number"
                          value={actualSet.weight}
                          onChange={(e) => handleActualSetChange(eIdx, setNumber, "weight", e.target.value)}
                          className="border p-1 rounded w-full"
                          min="0"
                          step="0.1"
                        />
                      </div>
                    )}
                    {"time" in actualSet && (
                      <div>
                        <label className="block text-xs text-gray-500">Time ({timeUnit})</label>
                        <input
                          type="number"
                          value={actualSet.time}
                          onChange={(e) => handleActualSetChange(eIdx, setNumber, "time", e.target.value)}
                          className="border p-1 rounded w-full"
                          min="0"
                        />
                      </div>
                    )}
                    {"laps" in actualSet && (
                      <div>
                        <label className="block text-xs text-gray-500">Laps</label>
                        <input
                          type="number"
                          value={actualSet.laps}
                          onChange={(e) => handleActualSetChange(eIdx, setNumber, "laps", e.target.value)}
                          className="border p-1 rounded w-full"
                          min="0"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {selectedTimer && <TimerComponent />}
    </div>
  );
};

export default StartWorkout;