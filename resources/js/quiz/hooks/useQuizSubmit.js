import webFetch from "@/lib/webFetch";
import { ApiAPI } from "@/lib/api.api";
import { toOriginalAnswer } from "@/quiz/utils/answerMapper";

/**
 * useQuizSubmit
 * -------------------------
 * Extracted submitAnswer() logic from MuridQuiz.
 * Responsible ONLY for sending answers to backend.
 */
export default function useQuizSubmit({
    sessionId,
    peserta,
    isGameMode,
    hp,
    setHp,
    setStatus,
    timeLeft,
    currentQuestion,
    selectedAnswer,
}) {

    async function submitAnswer() {
        if (!currentQuestion) return;
        if (isGameMode && hp <= 0) return;

        // lock UI while waiting QuestionEnded event
        setStatus("answered");

        let answerToSend = selectedAnswer;

        // If ordering question and student never dragged → send current order
        if (
            answerToSend === null &&
            currentQuestion.tipe_pertanyaan === "ordering"
        ) {
            answerToSend = currentQuestion.opsi.map((_, i) => i);
        }

        // Convert SHUFFLED → ORIGINAL before sending to backend
        answerToSend = toOriginalAnswer(answerToSend, currentQuestion);

        try {
            const res = await webFetch(
                ApiAPI.session.submitAnswer(
                    sessionId,
                    currentQuestion.pertanyaan_id
                ),
                {
                    method: "POST",
                    skipAuth: true,
                    body: JSON.stringify({
                        peserta_id: peserta.id,
                        pertanyaan_id: currentQuestion.pertanyaan_id,
                        jawaban: answerToSend ?? null,
                    }),
                }
            );

            const data = await res.json();
            if (!res.ok) throw data;

            // update HP for game mode
            if (isGameMode && typeof data.hp_sisa === "number") {
                setHp(data.hp_sisa);
                localStorage.setItem(
                    "peserta",
                    JSON.stringify({ ...peserta, hp_sisa: data.hp_sisa })
                );
            }
        } catch (err) {
            console.error("Submit answer failed:", err);
        }
    }

    return { submitAnswer };
}