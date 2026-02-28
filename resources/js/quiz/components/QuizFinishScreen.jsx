

export default function QuizFinishScreen({
    leaderboard = [],
    peserta,
    finalScore = 0,
    questionIndex = 0,
    quizConfig = {},
}) {
    console.log("[FinishScreen] render", {
        leaderboardLength: leaderboard?.length
    });
    const sorted = [...leaderboard].sort((a, b) => b.total_skor - a.total_skor);

    const meIndex = sorted.findIndex(p => p.nama === peserta?.nama);
    const myRank = meIndex >= 0 ? meIndex + 1 : "-";

    const totalSoal = questionIndex;

    // Derive number of correct answers from score by finding the largest k (<= totalSoal)
    // that evenly divides the score. Assumes equal points per correct answer.
    let correctCount = 0;
    if (totalSoal > 0 && finalScore > 0) {
        for (let k = totalSoal; k >= 1; k--) {
            if (finalScore % k === 0) {
                correctCount = k;
                break;
            }
        }
    }

    // Correct count calculated
    console.log("[FinishScreen] calculated correctCount:", correctCount, "from finalScore:", finalScore, "and totalSoal:", totalSoal);

    const percentage = totalSoal > 0
        ? Math.round((correctCount / totalSoal) * 100)
        : 0;

    // percentage calculated
    console.log("[FinishScreen] calculated percentage:", percentage, "from correctCount:", correctCount, "and totalSoal:", totalSoal);

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-900 p-6">
            <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl p-10">

                {/* HEADER */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🏆</div>
                    <div className="bg-blue-100 border-2 border-blue-200 text-blue-900 rounded-xl py-3 font-semibold">
                        Kuis Selesai! Semoga hasilnya menyenangkan
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10">

                    {/* LEFT PANEL */}
                    <div>
                        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-2xl p-8 mb-6">
                            <div className="text-sm opacity-80">Skor Akhir Kamu</div>
                            <div className="text-6xl font-bold">
                                {finalScore}
                            </div>
                        </div>

                        <div className="bg-gray-100 rounded-2xl p-6 space-y-4">
                            <div className="flex justify-between">
                                <span>🏆 Peringkat</span>
                                <span className="font-bold text-blue-700">#{myRank}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>📝 Total Soal</span>
                                <span className="font-bold">{totalSoal}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>📊 Persentase</span>
                                <span className="font-bold">{percentage}%</span>
                            </div>
                        </div>

                        <button
                            onClick={() => window.location.href = "/"}
                            className="mt-6 w-full bg-blue-800 hover:bg-blue-900 text-white py-3 rounded-xl font-semibold shadow-md"
                        >
                            Keluar
                        </button>
                    </div>

                    {/* RIGHT PANEL */}
                    {quizConfig?.tampilkan_peringkat && (
                        <div>
                            <div className="bg-yellow-500 text-black font-bold px-4 py-3 rounded-t-2xl">
                                🏆 Papan Peringkat Final
                            </div>

                            <div className="bg-gray-100 rounded-b-2xl p-4 space-y-3">
                                {sorted.map((p, index) => {
                                    const isMe = p.nama === peserta?.nama;

                                    return (
                                        <div
                                            key={index}
                                            className={`flex justify-between items-center px-4 py-3 rounded-xl shadow-sm
                                                ${index === 0 ? "bg-blue-600 text-white" : "bg-white"}
                                                ${isMe ? "ring-2 ring-yellow-400" : ""}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold">{index + 1}.</span>

                                                <span className="font-semibold">
                                                    {isMe ? "Kamu" : p.nama}
                                                </span>

                                                {isMe && (
                                                    <span className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded-full">
                                                        YOU
                                                    </span>
                                                )}
                                            </div>

                                            <div className="font-bold">
                                                {p.total_skor}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}