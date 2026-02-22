import { useState, useEffect, useRef } from "react";

export default function MatchingQuestion({
    currentQuestion,
    selectedAnswer,
    setSelectedAnswer,
    submitAnswer,
    status,
    correctAnswer,
}) {
    const kiri = currentQuestion.opsi.kiri;
    const kanan = currentQuestion.opsi.kanan;

    // Build correct pairs map when result phase arrives
    const correctPairs = Array.isArray(correctAnswer)
        ? Object.fromEntries(correctAnswer.map((rightIdx, leftIdx) => [leftIdx, rightIdx]))
        : null;

    const [pairs, setPairs] = useState({});
    const [activeQ, setActiveQ] = useState(null);
    const [activeA, setActiveA] = useState(null);

    // refs for drawing lines
    const leftRefs = useRef([]);
    const rightRefs = useRef([]);
    const containerRef = useRef(null);

    // sync from parent when entering result phase
    useEffect(() => {
        console.log("[Matching] result sync", { status, selectedAnswer });
        if (status === "result" && Array.isArray(selectedAnswer)) {
            const rebuilt = {};
            selectedAnswer.forEach((rightIndex, leftIndex) => {
                if (rightIndex !== null && rightIndex !== undefined) {
                    rebuilt[leftIndex] = rightIndex;
                }
            });
            setPairs(rebuilt);
        }
    }, [status, selectedAnswer]);

    // Reset local state when question changes
    useEffect(() => {
        console.log("[Matching] question changed", { id: currentQuestion?.pertanyaan_id, prevSelected: selectedAnswer });
        setPairs({});
        setActiveQ(null);
        setActiveA(null);
        setSelectedAnswer(null);
    }, [currentQuestion?.pertanyaan_id]);

    const pair = (q, a) => {
        console.log("[Matching] pair() called", { q, a, beforePairs: pairs });
        const updated = { ...pairs };
        Object.keys(updated).forEach(key => {
            if (updated[key] === a) delete updated[key];
        });
        updated[q] = a;
        setPairs(updated);
        const normalized = [];
        for (let i = 0; i < kiri.length; i++) {
            normalized[i] = updated[i] ?? null;
        }
        console.log("[Matching] setSelectedAnswer(normalized)", normalized);
        setSelectedAnswer(normalized);
    };

    const selectQuestion = (i) => {
        console.log("[Matching] selectQuestion", { i, status, activeQ, activeA, pairs });
        if (status !== "idle") return;

        // if clicking matched question with no active selection → UNPAIR
        if (activeA === null && activeQ === null && pairs[i] !== undefined) {
            const updated = { ...pairs };
            delete updated[i];
            setPairs(updated);

            const normalized = [];
            for (let idx = 0; idx < kiri.length; idx++) {
                normalized[idx] = updated[idx] ?? null;
            }
            setSelectedAnswer(normalized);
            return;
        }

        if (activeA !== null) {
            pair(i, activeA);
            setActiveA(null);
            setActiveQ(null);
            return;
        }

        setActiveQ(i);
    };

    const selectAnswer = (i) => {
        console.log("[Matching] selectAnswer", { i, status, activeQ, activeA, pairs });
        if (status !== "idle") return;

        // if clicking matched answer with no active selection → UNPAIR
        if (activeA === null && activeQ === null) {
            const leftKey = Object.keys(pairs).find(k => pairs[k] === i);
            if (leftKey !== undefined) {
                const updated = { ...pairs };
                delete updated[leftKey];
                setPairs(updated);

                const normalized = [];
                for (let idx = 0; idx < kiri.length; idx++) {
                    normalized[idx] = updated[idx] ?? null;
                }
                setSelectedAnswer(normalized);
                return;
            }
        }

        if (activeQ !== null) {
            pair(activeQ, i);
            setActiveQ(null);
            setActiveA(null);
            return;
        }

        setActiveA(i);
    };

    return (
        <>
            <div ref={containerRef} className="relative grid grid-cols-2 gap-20 max-w-5xl">
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {Object.entries(pairs).map(([leftIndex, rightIndex], idx) => {
                        const leftEl = leftRefs.current[leftIndex];
                        const rightEl = rightRefs.current[rightIndex];
                        if (!leftEl || !rightEl || !containerRef.current) return null;

                        const containerRect = containerRef.current.getBoundingClientRect();
                        const leftRect = leftEl.getBoundingClientRect();
                        const rightRect = rightEl.getBoundingClientRect();

                        const x1 = rightRect.right - containerRect.left + 8;
                        const y1 = rightRect.top + rightRect.height / 2 - containerRect.top;
                        const x2 = leftRect.left - containerRect.left - 8;
                        const y2 = leftRect.top + leftRect.height / 2 - containerRect.top;

                        let color;
                        if (status === "result" && correctPairs) {
                            // Only color based on student's actual pair
                            color = correctPairs[leftIndex] === rightIndex ? "#22c55e" : "#ef4444";
                        } else {
                            color = "#94a3b8"; // neutral gray while answering
                        }

                        return (
                            <line
                                key={idx}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={color}
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                        );
                    })}
                </svg>
                <div className="space-y-4">
                    {kanan.map((a, i) => (
                        <div
                            ref={el => rightRefs.current[i] = el}
                            key={i}
                            onClick={() => selectAnswer(i)}
                            className={`p-4 rounded-xl border-2 transition select-none
${status === "idle" ? "cursor-pointer bg-blue-100 hover:bg-blue-200" : "bg-blue-50"}
${activeA === i ? "ring-4 ring-blue-500 scale-105" : ""}
${status === "result"
    ? (() => {
            const leftKey = Object.keys(pairs).find(k => pairs[k] === i);
            if (leftKey === undefined) return "border-gray-300 bg-gray-100";
            return correctPairs && correctPairs[leftKey] === i
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50";
        })()
    : ""}
`}
                        >
                            {a}
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    {kiri.map((q, i) => (
                        <div
                            ref={el => leftRefs.current[i] = el}
                            key={i}
                            onClick={() => selectQuestion(i)}
                            className={`p-4 rounded-xl border-2 transition select-none
${status === "idle" ? "cursor-pointer bg-green-100 hover:bg-green-200" : "bg-green-50"}
${activeQ === i ? "ring-4 ring-green-500 scale-105" : ""}
${status === "result"
    ? pairs[i] !== undefined
        ? (correctPairs && pairs[i] === correctPairs[i]
            ? "border-green-500 bg-green-50"
            : "border-red-500 bg-red-50")
        : "border-gray-300 bg-gray-100"
    : ""}
`}
                        >
                            {q}
                        </div>
                    ))}
                </div>
            </div>

        </>
    );
}