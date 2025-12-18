const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API = {
    base: API_BASE_URL,

    /* =====================
       AUTH
    ===================== */
    auth: {
        login: `${API_BASE_URL}/login`,
        logout: `${API_BASE_URL}/logout`,
        currentUser: `${API_BASE_URL}/current-user`,
    },

    /* =====================
       TEACHER / QUIZ
    ===================== */
    teacher: {
        createQuizFull: `${API_BASE_URL}/teacher/kuis/full`,
        deleteQuiz: (quizId) => `${API_BASE_URL}/teacher/kuis/${quizId}`,
        allQuiz: `${API_BASE_URL}/teacher/kuis`,
        quiz: (quizId) => `${API_BASE_URL}/teacher/kuis/${quizId}`,

        /* QUESTIONS */
        createQuestion: `${API_BASE_URL}/teacher/pertanyaan`,
        question: (id) => `${API_BASE_URL}/teacher/pertanyaan/${id}`,
    },

    /* =====================
       SESSION (SESI KUIS)
    ===================== */
    session: {
        create: `${API_BASE_URL}/sesi`,
        detail: (id) => `${API_BASE_URL}/sesi/${id}`,
        start: (id) => `${API_BASE_URL}/sesi/${id}/start`,
        joinByCode: (code) => `${API_BASE_URL}/join/${code}`,
        submitAnswer: (sesiId, pertanyaanId) =>
            `${API_BASE_URL}/sesi/${sesiId}/pertanyaan/${pertanyaanId}/jawab`,
    },
};
