// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useAuth } from "../../AuthProvider";

// const unitOptions = ["reps", "time", "weight", "laps"];

// const ExerciseForm = () => {
//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     muscle_group: "",
//     units: [],
//     created_by: null,
//   });

//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const { uid } = useAuth();

//   useEffect(() => {
//     if (uid) {
//       setFormData((prev) => ({ ...prev, created_by: uid }));
//     }
//   }, [uid]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const toggleUnit = (unit) => {
//     setFormData((prev) => {
//       const isSelected = prev.units.includes(unit);
//       const updatedUnits = isSelected
//         ? prev.units.filter((u) => u !== unit)
//         : [...prev.units, unit];
//       return { ...prev, units: updatedUnits };
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage("");
//     setError("");

//     if (formData.units.length === 0) {
//       setError("Please select at least one unit.");
//       return;
//     }

//     try {
//       const response = await axios.post(
//         `${VITE_BACKEND_URL}/workouts/exercises`,
//         formData
//       );

//       setMessage(response.data.message);
//       setFormData({
//         name: "",
//         description: "",
//         muscle_group: "",
//         units: [],
//         created_by: 1,
//       });
//     } catch (err) {
//       const msg = err?.response?.data?.error?.message || "Something went wrong";
//       setError(msg);
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-xl mt-10 font-sans">
//       <h2 className="text-3xl font-extrabold mb-8 text-[#4B9CD3] text-center">Create New Exercise</h2>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         <div>
//           <label className="block font-semibold mb-2 text-[#4B9CD3]">Exercise Name</label>
//           <input
//             type="text"
//             name="name"
//             placeholder="Push-up"
//             value={formData.name}
//             onChange={handleChange}
//             className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B9CD3]"
//             required
//           />
//         </div>

//         <div>
//           <label className="block font-semibold mb-2 text-[#4B9CD3]">Description</label>
//           <input
//             type="text"
//             name="description"
//             placeholder="Upper body strength"
//             value={formData.description}
//             onChange={handleChange}
//             className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B9CD3]"
//           />
//         </div>

//         <div>
//           <label className="block font-semibold mb-2 text-[#4B9CD3]">Muscle Group</label>
//           <input
//             type="text"
//             name="muscle_group"
//             placeholder="Chest, Triceps"
//             value={formData.muscle_group}
//             onChange={handleChange}
//             className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B9CD3]"
//           />
//         </div>

//         <div>
//           <label className="block font-semibold mb-2 text-[#4B9CD3]">Select Units</label>
//           <div className="flex flex-wrap gap-3">
//             {unitOptions.map((unit) => (
//               <button
//                 key={unit}
//                 type="button"
//                 onClick={() => toggleUnit(unit)}
//                 className={`px-4 py-2 rounded-full border font-semibold transition duration-200 ${
//                   formData.units.includes(unit)
//                     ? "bg-[#4B9CD3] text-white border-[#4B9CD3]"
//                     : "bg-white text-gray-700 border-gray-300"
//                 }`}
//               >
//                 {unit}
//               </button>
//             ))}
//           </div>
//         </div>

//         <button
//           type="submit"
//           className="w-full bg-[#4B9CD3] hover:bg-[#3582b8] text-white font-semibold py-3 rounded-xl text-lg transition duration-200"
//         >
//           ✅ Create Exercise
//         </button>

//         {message && <p className="text-green-600 text-center font-semibold">{message}</p>}
//         {error && <p className="text-red-600 text-center font-semibold">{error}</p>}
//       </form>
//     </div>
//   );
// };

// export default ExerciseForm;
