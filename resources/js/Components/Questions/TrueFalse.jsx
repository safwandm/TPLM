export default function TrueFalse({
    selectedAnswer,
    setSelectedAnswer,
    status,
    correctAnswer,
}) {
    const isResult = status === "result";

    console.log("[TrueFalse] render", {
        status,
        selectedAnswer,
        correctAnswer,
        isResult
    });

    function getButtonStyle(v) {
        // ===== RESULT PHASE =====
        if (isResult) {
            if (correctAnswer === v && selectedAnswer === v)
                return "bg-green-600 text-white border-green-900 scale-110 shadow-xl ring-4 ring-yellow-300";

            if (correctAnswer === v)
                return "bg-green-600 text-white border-green-900 scale-110 shadow-xl";

            if (selectedAnswer === v)
                return "bg-red-500 text-white border-red-800 ring-4 ring-yellow-300";

            return "bg-gray-200 border-gray-300 opacity-50";
        }

        // ===== ANSWERING PHASE =====
        if (selectedAnswer === v) {
            return "bg-blue-700 text-white border-blue-900 scale-105";
        }

        return "bg-gray-300 border-gray-400";
    }

    return (
        <>
            <div className="flex gap-4">
                {[true, false].map(v => (
                    <button
                        key={String(v)}
                        disabled={status !== "idle"}
                        onClick={() => setSelectedAnswer(selectedAnswer === v ? null : v)}
                        className={`px-10 py-6 rounded-xl text-xl transition border-2 ${getButtonStyle(v)}`}
                    >
                        {v ? "Benar" : "Salah"}
                    </button>
                ))}
            </div>

        </>
    );
}