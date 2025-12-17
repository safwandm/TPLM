// // ================================
// // REVISED: TeacherQuiz.jsx
// // ================================
// import { useEffect, useState } from "react";
// import ProtectedLayout from "@/Layouts/ProtectedLayout";
// import { FaPlay } from "react-icons/fa";
// import { API } from "@/lib/api";

// export default function TeacherQuiz() {
//     const id = Number(window.location.pathname.split("/")[2]);

//     const [sesi, setSesi] = useState(null);
//     const [status, setStatus] = useState("waiting");
//     const [participants, setParticipants] = useState([]);
//     const [currentQuestion, setCurrentQuestion] = useState(null);
//     const [leaderboard, setLeaderboard] = useState([]);
//     const [starting, setStarting] = useState(false);

//     /* ================= FETCH INITIAL ================= */
//     useEffect(() => {
//         const token = localStorage.getItem("auth_token");
//         fetch(API.session.detail(id), {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//                 Accept: "application/json",
//             },
//         }).then(async res => {
//             const data = await res.json();
//             setSesi(data);
//             setStatus(data.status);
//             setParticipants(data.pesertas.map(p => p.nama));
//             setLeaderboard(data.pesertas);
//         });
//     }, [id]);

//     /* ================= WEBSOCKET ================= */
//     useEffect(() => {
//         const channel = window.Echo.channel(`sesi.${id}`)
//             .listen(".ParticipantsUpdated", e => {
//                 setParticipants(e.peserta);
//             })
//             .listen(".QuizStarting", () => {
//                 setStatus("running");
//                 setCurrentQuestion(null);
//             })
//             .listen(".QuestionStarted", e => {
//                 setStatus("running");
//                 setCurrentQuestion(e);
//             })
//             .listen(".QuestionEnded", () => {
//                 setCurrentQuestion(null);
//             })
//             .listen(".LeaderboardUpdated", e => {
//                 setLeaderboard(e.leaderboard);
//             })
//             .listen(".SessionFinished", () => {
//                 setStatus("finished");
//                 setCurrentQuestion(null);
//             });

//         return () => window.Echo.leave(`sesi.${id}`);
//     }, [id]);

//     async function handleStartQuiz() {
//         const token = localStorage.getItem("auth_token");
//         setStarting(true);
//         try {
//             const res = await fetch(API.session.start(id), {
//                 method: "POST",
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                     Accept: "application/json",
//                 },
//             });
//             if (!res.ok) throw new Error("Gagal memulai kuis");
//         } catch (e) {
//             alert(e.message);
//         } finally {
//             setStarting(false);
//         }
//     }

//     if (!sesi) return <div>Loading...</div>;

//     return (
//         <ProtectedLayout allowedRoles={["teacher"]}>
//             <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//                 <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">

//                     <h1 className="text-2xl font-bold mb-4">Kontrol Kuis</h1>

//                     <div className="bg-blue-50 border rounded p-4 mb-4">
//                         <p>Kode: <b>{sesi.kode}</b></p>
//                         <p>Status: <b>{status}</b></p>
//                         <p>Peserta: <b>{participants.length}</b></p>
//                     </div>

//                     {status === "waiting" && (
//                         <>
//                             <ul className="border rounded p-3 max-h-40 overflow-y-auto">
//                                 {participants.map((p, i) => (
//                                     <li key={i}>• {p}</li>
//                                 ))}
//                             </ul>

//                             <div className="text-center mt-6">
//                                 <button
//                                     onClick={handleStartQuiz}
//                                     disabled={starting}
//                                     className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
//                                 >
//                                     <FaPlay /> {starting ? "Memulai..." : "Mulai Kuis"}
//                                 </button>
//                             </div>
//                         </>
//                     )}

//                     {status === "running" && (
//                         <div className="p-4 border rounded bg-gray-50 text-center">
//                             {currentQuestion ? (
//                                 <>
//                                     <p className="font-semibold">Soal Aktif</p>
//                                     <p>{currentQuestion.pertanyaan}</p>
//                                 </>
//                             ) : (
//                                 <p>⏳ Menunggu soal...</p>
//                             )}
//                         </div>
//                     )}

//                     {status === "finished" && (
//                         <div className="text-center font-semibold">✅ Kuis Selesai</div>
//                     )}
//                 </div>
//             </div>
//         </ProtectedLayout>
//     );
// }