const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


export const WebAPI = {
    base: API_BASE_URL,

    /* =====================
       AUTH
    ===================== */
    auth: {
        login: `${API_BASE_URL}/web/login`,
        logout: `${API_BASE_URL}/web/logout`,
        currentUser: `${API_BASE_URL}/web/current-user`,
    },

    /* =====================
       TEACHER / QUIZ
    ===================== */
    teacher: {
        createQuizFull: `${API_BASE_URL}/web/teacher/kuis/full`,
        deleteQuiz: (quizId) => `${API_BASE_URL}/web/teacher/kuis/${quizId}`,
        allQuiz: `${API_BASE_URL}/web/teacher/kuis`,
        quiz: (quizId) => `${API_BASE_URL}/web/teacher/kuis/${quizId}`,

        /* QUESTIONS */
        createQuestion: `${API_BASE_URL}/web/teacher/pertanyaan`,
        question: (id) => `${API_BASE_URL}/web/teacher/pertanyaan/${id}`,
    },

    /* =====================
    SESSION (SESI KUIS)
    ===================== */

    session: {
        create: `${API_BASE_URL}/web/sesi`,
        detail: (id) => `${API_BASE_URL}/web/sesi/${id}`,
        start: (id) => `${API_BASE_URL}/web/sesi/${id}/start`,
        joinByCode: (code) => `${API_BASE_URL}/join/${code}`,
        getConfig: (id) => `/sesi/${id}/config`,
        restore: (sesiId, pesertaId) => `/sesi/${sesiId}/restore/${pesertaId}`,
        submitAnswer: (sesiId, pertanyaanId) =>
            `${API_BASE_URL}/web/sesi/${sesiId}/pertanyaan/${pertanyaanId}/jawab`,
    },
};
