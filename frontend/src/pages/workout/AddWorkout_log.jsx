import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../AuthProvider";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const RecordWorkoutForm = () => {
  const [formData, setFormData] = useState({
    user_id: null,
    regiment_id: "",
    regiment_day_index: "",
    log_date: "",
    workout_id: "",
    actual_workout: [],
    score: "",
  });

  const [regiments, setRegiments] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const { uid } = useAuth();


  useEffect(() => {
    if (uid) {
      setFormData((prev) => ({ ...prev, user_id: uid }));
    }
  }, [uid]);

  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regimentRes, exerciseRes, workoutRes] = await Promise.all([
          axios.get(`${API_URL}/workouts/regiments`),
          axios.get(`${API_URL}/workouts/exercises`),
          axios.get(`${API_URL}/workouts`),
        ]);
        setRegiments(regimentRes.data.items || []);
        setExercises(exerciseRes.data.items || []);
        setWorkouts(workoutRes.data.items || []);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      if (!formData.workout_id) return;
      try {
        const res = await axios.get(`${API_URL}/workouts/${formData.workout_id}`);
        const structure = res.data?.item?.structure;

        if (!structure) return;

        const mapped = structure.map((ex) => {
          const units = ex.exercise_details?.units || [];
          const setsObj = {};

          Object.entries(ex.sets).forEach(([setIndex, set]) => {
            const newSet = {};
            if (units.includes("reps")) newSet.reps = set.reps || "";
            if (units.includes("weight")) newSet.weight = set.weight || "";
            if (units.includes("time")) newSet.time = set.time || "";

            setsObj[`set${setIndex}`] = newSet;
          });

          return {
            exercise_id: ex.exercise_id,
            weight_unit: ex.weight_unit || "kg",
            time_unit: ex.time_unit || "seconds",
            sets: setsObj,
          };
        });

        setFormData((prev) => ({
          ...prev,
          actual_workout: mapped,
        }));
      } catch (err) {
        console.error("Workout fetch error:", err);
      }
    };

    fetchWorkoutDetails();
  }, [formData.workout_id]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSetChange = (exerciseIdx, setKey, field, value) => {
    const updated = [...formData.actual_workout];
    updated[exerciseIdx].sets[setKey][field] = value;
    setFormData((prev) => ({ ...prev, actual_workout: updated }));
  };

  const cleanFormData = () => ({
    ...formData,
    regiment_id: Number(formData.regiment_id) || null,
    workout_id: Number(formData.workout_id) || null,
    regiment_day_index: Number(formData.regiment_day_index) || 0,
    score: Number(formData.score) || 0,
    log_date: formData.log_date || null,
    actual_workout: formData.actual_workout.map((ex) => ({
      exercise_id: Number(ex.exercise_id),
      weight_unit: ex.weight_unit,
      time_unit: ex.time_unit,
      sets: Object.fromEntries(
        Object.entries(ex.sets).map(([key, set]) => {
          const cleanedSet = {};
          if ("reps" in set) cleanedSet.reps = Number(set.reps) || 0;
          if ("weight" in set) cleanedSet.weight = Number(set.weight) || 0;
          if ("time" in set) cleanedSet.time = Number(set.time) || 0;
          if ("laps" in set) cleanedSet.laps = Number(set.laps) || 0;

          return [key, cleanedSet];
        })
      ),
    })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = cleanFormData();
      await axios.post(`${API_URL}/workouts/logs`, payload);
      alert("Workout log recorded successfully!");
    } catch (err) {
      console.error("Log submission failed:", err);
      alert("Failed to record workout log.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 bg-white rounded shadow space-y-4">
      <h2 className="text-xl font-bold mb-2">Record Workout Log</h2>

      <select
        value={formData.regiment_id}
        onChange={(e) => handleChange("regiment_id", e.target.value)}
        className="border p-2 rounded w-full"
        required
      >
        <option value="">Select Regiment</option>
        {regiments.map((reg) => (
          <option key={reg.regiment_id} value={reg.regiment_id}>
            {reg.name || `Regiment ${reg.regiment_id}`}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={formData.log_date}
        onChange={(e) => handleChange("log_date", e.target.value)}
        className="border p-2 rounded w-full"
        required
      />

      <select
        value={formData.workout_id}
        onChange={(e) => handleChange("workout_id", e.target.value)}
        className="border p-2 rounded w-full"
        required
      >
        <option value="">Select Workout</option>
        {workouts.map((w) => (
          <option key={w.workout_id} value={w.workout_id}>
            {w.name || `Workout ${w.workout_id}`}
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Day Index"
        value={formData.regiment_day_index}
        onChange={(e) => handleChange("regiment_day_index", e.target.value)}
        className="border p-2 rounded w-full"
      />

      <input
        type="number"
        placeholder="Score"
        value={formData.score}
        onChange={(e) => handleChange("score", e.target.value)}
        className="border p-2 rounded w-full"
      />

      <div className="space-y-4">
        {formData.actual_workout.map((exercise, i) => (
          <div key={`exercise-${i}`} className="border rounded p-3">
            <h4 className="font-semibold mb-2">
              {exercises.find((ex) => ex.exercise_id === Number(exercise.exercise_id))?.name ||
                `Exercise ID: ${exercise.exercise_id}`}
            </h4>

            {Object.entries(exercise.sets).map(([setKey, set]) => (
              <div key={setKey} className="grid grid-cols-4 gap-2 mb-2">

                {"reps" in set && (
                  <input
                    type="number"
                    placeholder="Reps"
                    value={set.reps}
                    onChange={(e) => handleSetChange(i, setKey, "reps", e.target.value)}
                    className="border p-1 rounded"
                  />
                )}
                {"weight" in set && (
                  <>
                    <input
                      type="number"
                      placeholder="Weight"
                      value={set.weight}
                      onChange={(e) => handleSetChange(i, setKey, "weight", e.target.value)}
                      className="border p-1 rounded"
                    />
                    <input
                      type="text"
                      value={exercise.weight_unit}
                      onChange={(e) => {
                        const updated = [...formData.actual_workout];
                        updated[i].weight_unit = e.target.value;
                        setFormData((prev) => ({ ...prev, actual_workout: updated }));
                      }}
                      className="border p-1 rounded"
                    />
                  </>
                )}
                {"time" in set && (
                  <>
                    <input
                      type="number"
                      placeholder="Time"
                      value={set.time}
                      onChange={(e) => handleSetChange(i, setKey, "time", e.target.value)}
                      className="border p-1 rounded"
                    />
                    <input
                      type="text"
                      value={exercise.time_unit}
                      onChange={(e) => {
                        const updated = [...formData.actual_workout];
                        updated[i].time_unit = e.target.value;
                        setFormData((prev) => ({ ...prev, actual_workout: updated }));
                      }}
                      className="border p-1 rounded"
                    />
                  </>
                )}
                {"laps" in set && (
                  <input
                    type="number"
                    placeholder="Laps"
                    value={set.laps}
                    onChange={(e) => handleSetChange(i, setKey, "laps", e.target.value)}
                    className="border p-1 rounded"
                  />
                )}

              </div>
            ))}
          </div>
        ))}
      </div>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded w-full">
        Submit Workout Log
      </button>
    </form>
  );
};

export default RecordWorkoutForm;
