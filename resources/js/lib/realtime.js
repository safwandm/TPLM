import Pusher from "pusher-js";

export function subscribeToSession(sessionId, handlers = {}) {
    const pusher = new Pusher("local", {
        wsHost: window.location.hostname,
        wsPort: 8080,
        forceTLS: false,
        enabledTransports: ["ws"],
        disableStats: true,
    });

    const channel = pusher.subscribe(`sesi.${sessionId}`);

    if (handlers.ParticipantsUpdated)
        channel.bind("ParticipantsUpdated", handlers.ParticipantsUpdated);

    if (handlers.QuizStarting)
        channel.bind("QuizStarting", handlers.QuizStarting);

    if (handlers.QuestionStarted)
        channel.bind("QuestionStarted", handlers.QuestionStarted);

    if (handlers.QuestionEnded)
        channel.bind("QuestionEnded", handlers.QuestionEnded);

    if (handlers.LeaderboardUpdated)
        channel.bind("LeaderboardUpdated", handlers.LeaderboardUpdated);

    if (handlers.SessionFinished)
        channel.bind("SessionFinished", handlers.SessionFinished);

    return () => {
        channel.unbind_all();
        pusher.unsubscribe(`sesi.${sessionId}`);
        pusher.disconnect();
    };
}
