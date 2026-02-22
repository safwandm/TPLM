import { useState } from "react";

export default function OrderingQuestion({
    currentQuestion,
    selectedAnswer,
    setSelectedAnswer,
    submitAnswer,
    status,
    correctAnswer,
}) {
    const [dragIndex, setDragIndex] = useState(null);

    const defaultOrder = currentQuestion.opsi.map((_, i) => i);
    const studentOrder = selectedAnswer ?? defaultOrder;

    /* =====================================================
       🔁 BUILD INDEX MAPS
       shuffledIndex -> originalIndex  (from MuridQuiz)
       originalIndex -> shuffledIndex  (we create here)
    ===================================================== */
    const shuffledToOriginal = currentQuestion._optionIndexMap || {};
    const originalToShuffled = Object.fromEntries(
        Object.entries(shuffledToOriginal).map(([shuffled, original]) => [
            original,
            Number(shuffled),
        ])
    );

    /* =====================================================
       🧠 BUILD CORRECT ORDER (IN SHUFFLED SPACE)
       Backend gives ORIGINAL indices → convert to SHUFFLED
    ===================================================== */
    const correctShuffledOrder =
        Array.isArray(correctAnswer)
            ? correctAnswer.map((origIndex) => originalToShuffled[origIndex])
            : null;

    /* =====================================================
       🎯 WHICH ORDER SHOULD BE DISPLAYED?
       During result → show correct order layout
       Otherwise → show student's drag order
    ===================================================== */
    const order =
        status === "result" && correctShuffledOrder
            ? correctShuffledOrder
            : studentOrder;

    /* =====================================================
       🎯 CONVERT STUDENT ANSWER → ORIGINAL SPACE
       Needed for green/red comparison
    ===================================================== */
    const neverAnswered = selectedAnswer === null;

    const studentOriginalOrder =
        !neverAnswered && Array.isArray(selectedAnswer)
            ? selectedAnswer.map((shuffledIdx) => shuffledToOriginal[shuffledIdx])
            : null;

    /* =====================================================
       🖱️ DRAG LOGIC (unchanged)
    ===================================================== */
    const handleDragStart = (i) => setDragIndex(i);

    const handleDragOver = (e, hoverIndex) => {
        e.preventDefault();
        if (dragIndex === hoverIndex) return;

        const newOrder = [...studentOrder];
        const dragged = newOrder[dragIndex];
        newOrder.splice(dragIndex, 1);
        newOrder.splice(hoverIndex, 0, dragged);

        setDragIndex(hoverIndex);
        setSelectedAnswer(newOrder);
    };

    /* =====================================================
       🎨 RESULT COLOR LOGIC (THE IMPORTANT PART)
    ===================================================== */
    const getResultStyle = (positionIndex) => {
        if (status !== "result" || !correctAnswer) return "";

        // student never answered → everything is wrong
        if (neverAnswered) return "border-red-500 bg-red-50";

        if (!studentOriginalOrder) return "";

        // We are rendering CORRECT ORDER positions now
        // correctAnswer[positionIndex] is ORIGINAL index that belongs here
        const correctOriginalIndex = correctAnswer[positionIndex];

        // find where student placed that ORIGINAL item
        const studentPosition = studentOriginalOrder.indexOf(correctOriginalIndex);

        return studentPosition === positionIndex
            ? "border-green-500 bg-green-50"
            : "border-red-500 bg-red-50";
    };

    /* ===================================================== */

    return (
        <div>
            <div className="space-y-4 w-full max-w-2xl">
                {order.map((shuffledIndex, position) => (
                    <div
                        key={shuffledIndex}
                        draggable={status === "idle"}
                        onDragStart={() => handleDragStart(position)}
                        onDragOver={(e) => handleDragOver(e, position)}
                        className={`flex items-center border-2 rounded-xl p-4 bg-white
${selectedAnswer !== null ? "ring-2 ring-yellow-300" : ""}
${getResultStyle(position)}`}
                    >
                        <div className="w-12 text-center font-bold">
                            {position + 1}
                        </div>
                        {currentQuestion.opsi[shuffledIndex]}
                    </div>
                ))}
            </div>
            {selectedAnswer !== null && (
                <button
                    onClick={() => setSelectedAnswer(null)}
                    className="mt-6 bg-gray-500 text-white px-6 py-2 rounded"
                >
                    Reset Urutan
                </button>
            )}
        </div>
    );
}