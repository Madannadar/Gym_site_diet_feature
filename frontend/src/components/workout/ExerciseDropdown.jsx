// components/ExerciseDropdown.jsx
import React, { useEffect, useState } from "react";

const ExerciseDropdown = ({ selectedId, onSelect }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await fetch(`${API_URL}/workouts/exercises`);
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        setExercises(data.items);
      } catch (err) {
        console.error("❌ Error fetching exercises:", err);
        setError("Failed to load exercises");
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  if (loading) return <p className="text-gray-600">Loading exercises...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <select
      value={selectedId}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full border border-gray-300 rounded-xl p-2"
    >
      <option value="">Select exercise</option>
      {exercises.map((ex) => (
        <option key={ex.exercise_id} value={ex.exercise_id}>
          {ex.name}
        </option>
      ))}
    </select>
  );
};

export default ExerciseDropdown;
