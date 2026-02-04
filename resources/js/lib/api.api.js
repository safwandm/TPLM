const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ApiAPI = {
    base: API_BASE_URL,

    /* =====================
       AUTH
    ===================== */
    auth: {
        login: `${API_BASE_URL}/api/login`,
        logout: `${API_BASE_URL}/api/logout`,
        currentUser: `${API_BASE_URL}/api/current-user`,
    },

    /* =====================
       TEACHER / QUIZ
    ===================== */
    teacher: {
        createQuizFull: `${API_BASE_URL}/api/teacher/kuis/full`,
        deleteQuiz: (quizId) => `${API_BASE_URL}/api/teacher/kuis/${quizId}`,
        allQuiz: `${API_BASE_URL}/api/teacher/kuis`,
        quiz: (quizId) => `${API_BASE_URL}/teacher/kuis/${quizId}`,

        /* QUESTIONS */
        createQuestion: `${API_BASE_URL}/api/teacher/pertanyaan`,
        question: (id) => `${API_BASE_URL}/api/teacher/pertanyaan/${id}`,
    },

        /* =====================
        SESSION (SESI KUIS)
    ===================== */
    session: {
        create: `${API_BASE_URL}/api/sesi`,
        detail: (id) => `${API_BASE_URL}/api/sesi/${id}`,
        start: (id) => `${API_BASE_URL}/api/sesi/${id}/start`,
        joinByCode: (code) => `${API_BASE_URL}/join/${code}`,
        getConfig: (id) => `/sesi/${id}/config`,
        restore: (sesiId, pesertaId) => `/sesi/${sesiId}/restore/${pesertaId}`,
        submitAnswer: (sesiId, pertanyaanId) =>
            `${API_BASE_URL}/api/sesi/${sesiId}/pertanyaan/${pertanyaanId}/jawab`,
    },
};