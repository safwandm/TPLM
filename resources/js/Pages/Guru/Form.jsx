import { useEffect, useState } from "react";
// import { usePage, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

import QuizSettingsCard from "@/Components/QuizSettingsCard";
import QuestionForm from "@/Components/QuestionForm";
import QuestionCard from "@/Components/QuestionCard";

export default function Form() {
    /* =========================================
       MODE DETECTION
    ========================================= */
    const { id } = usePage().props ?? {};
    const quizId = id ? Number(id) : null;
    const isEdit = Boolean(quizId);

    /* =========================================
       STATE
    ========================================= */
    const [loaded, setLoaded] = useState(!isEdit);
    const [questions, setQuestions] = useState([]);

    const [title, setTitle] = useState("");
    const [duration, setDuration] = useState("");
    const [showAnswers, setShowAnswers] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const [editingQuestion, setEditingQuestion] = useState(null);

    /* =========================================
       LOAD QUIZ (EDIT MODE ONLY)
    ========================================= */
    useEffect(() => {
        if (!isEdit) return;

        const saved = JSON.parse(localStorage.getItem("savedQuizzes")) ?? [];
        const found = saved.find(q => q.id === quizId);

        if (!found) {
            alert("Quiz tidak ditemukan");
            // router.visit("/dashboard");
            window.location.href = "/dashboard";
            return;
        }

        setTitle(found.title);
        setDuration(found.duration ?? "");
        setShowAnswers(found.settings?.showAnswers ?? false);
        setShowLeaderboard(found.settings?.showLeaderboard ?? false);
        setQuestions(found.questions ?? []);

        setLoaded(true);
    }, [quizId]);

    /* =========================================
       QUESTION CRUD
    ========================================= */
    function upsertQuestion(question) {
        setQuestions(prev =>
            prev.some(q => q.id === question.id)
                ? prev.map(q => (q.id === question.id ? question : q))
                : [...prev, question]
        );
    }

    function deleteQuestion(id) {
        if (!confirm("Hapus pertanyaan?")) return;
        setQuestions(prev => prev.filter(q => q.id !== id));
    }

    /* =========================================
       SAVE
    ========================================= */
    function saveQuiz() {
        if (!title.trim()) return alert("Judul wajib diisi");
        if (questions.length === 0) return alert("Minimal 1 pertanyaan");

        const saved = JSON.parse(localStorage.getItem("savedQuizzes")) ?? [];

        const payload = {
            id: quizId ?? Date.now(),
            title,
            duration: duration ? Number(duration) : null,
            settings: { showAnswers, showLeaderboard },
            questions,
            questions_count: questions.length,
        };

        const newList = isEdit
            ? saved.map(q => (q.id === quizId ? payload : q))
            : [...saved, payload];

        localStorage.setItem("savedQuizzes", JSON.stringify(newList));
        // router.visit("/dashboard");
        window.location.href = "/dashboard";
    }

    /* =========================================
       GUARD
    ========================================= */
    if (!loaded) {
        return (
            <AppLayout>
                <div className="p-6">Loading...</div>
            </AppLayout>
        );
    }


    /* =========================================
       HELPERS
    ========================================= */

    function startEdit(question) {
        setEditingQuestion(question);
    }


    /* =========================================
       UI
    ========================================= */
    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-8">

                <QuizSettingsCard
                    title={title}
                    setTitle={setTitle}
                    duration={duration}
                    setDuration={setDuration}
                    showAnswers={showAnswers}
                    setShowAnswers={setShowAnswers}
                    showLeaderboard={showLeaderboard}
                    setShowLeaderboard={setShowLeaderboard}
                    onSave={saveQuiz}
                    saveLabel={isEdit ? "Simpan Kuis" : "Buat Kuis"}
                />

                <QuestionForm
                    onSubmit={upsertQuestion}
                    editingQuestion={editingQuestion}
                    cancelEdit={() => setEditingQuestion(null)}
                />

                <div className="space-y-4">
                    {questions.map((q, index) => (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            index={index}
                            onDelete={deleteQuestion}
                            onEdit={startEdit}  
                        />
                    ))}
                </div>

            </div>
        </AppLayout>
    );
}