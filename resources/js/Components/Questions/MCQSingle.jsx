export default function MCQSingle({
    currentQuestion,
    selectedAnswer,
    setSelectedAnswer,
    status,
    correctAnswer,
}) {
    return (
        <>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {currentQuestion.opsi.map((opt, i) => (
                    <button
                        key={i}
                        disabled={status !== "idle"}
                        onClick={() => setSelectedAnswer(selectedAnswer === i ? null : i)}
                        className={`h-28 rounded-xl font-bold transition border-4
${status === "result" && correctAnswer !== null
    ? correctAnswer === i
        ? "bg-green-600 text-white border-green-900"
        : selectedAnswer === i
            ? "bg-red-500 text-white border-red-900 ring-4 ring-yellow-300"
            : "bg-gray-300 border-gray-400"
    : selectedAnswer === i
        ? "bg-blue-700 text-white border-blue-900"
        : "bg-gray-300 border-gray-400"}`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </>
    );
}