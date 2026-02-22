export default function MCQMulti({
    currentQuestion,
    selectedAnswer,
    setSelectedAnswer,
    submitAnswer,
    status,
    correctAnswer,
}) {
    const toggle = (i) => {
        setSelectedAnswer(prev => {
            const arr = Array.isArray(prev) ? prev : [];
            return arr.includes(i)
                ? arr.filter(x => x !== i)
                : [...arr, i];
        });
    };

    const allSelected =
        Array.isArray(selectedAnswer) &&
        selectedAnswer.length === currentQuestion.opsi.length;

    const hasWrongOption =
        Array.isArray(correctAnswer) &&
        correctAnswer.length !== currentQuestion.opsi.length;

    const showInvalidAllSelected =
        status !== "idle" &&
        allSelected &&
        hasWrongOption;

    return (
        <>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {currentQuestion.opsi.map((opt, i) => (
                    <button
                        key={i}
                        disabled={status !== "idle"}
                        onClick={() => toggle(i)}
                        className={`h-28 rounded-xl font-bold transition border-4
${status === "result" && correctAnswer !== null
                                ? correctAnswer?.includes(i)
                                    ? selectedAnswer?.includes(i)
                                        ? "bg-green-600 text-white border-green-900 ring-4 ring-yellow-300"
                                        : "bg-green-600 text-white border-green-900"
                                    : selectedAnswer?.includes(i)
                                        ? "bg-red-500 text-white border-red-900 ring-4 ring-yellow-300"
                                        : "bg-gray-300 border-gray-400"
                                : selectedAnswer?.includes(i)
                                    ? "bg-blue-700 text-white border-blue-900"
                                    : "bg-gray-300 border-gray-400"}`}
                    >
                        {opt}
                    </button>
                ))}
            </div>

            {showInvalidAllSelected && (
                <div className="mt-4 text-red-300 font-bold text-center">
                    ⚠️ Jawaban tidak valid: semua opsi dipilih saat terdapat opsi salah.
                </div>
            )}

        </>
    );
}