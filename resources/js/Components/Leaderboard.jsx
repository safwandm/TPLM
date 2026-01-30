export default function Leaderboard({ leaderboard, questionIndex }) {
    if (!leaderboard.length) {
        return <p className="text-center text-gray-500">Belum ada skor</p>;
    }

    return (
        <div>
            <h3 className="font-semibold mb-2">Leaderboard</h3>
            <ul className="border rounded p-3 space-y-1">
                {leaderboard.map((l, i) => (
                    <li
                        key={l.id ?? i}
                        className="flex justify-between items-center"
                    >
                        <span>
                            {i + 1}. {l.nama}
                        </span>

                        <span className="flex gap-3 items-center">
                            <span className="font-semibold">
                                {l.total_correctness}/{questionIndex}
                            </span>

                            <span className="font-semibold">
                                {l.total_skor}
                            </span>

                            {typeof l.hp_sisa === "number" && (
                                <span
                                    className={`text-sm font-bold ${
                                        l.hp_sisa > 0
                                            ? "text-red-600"
                                            : "text-gray-400"
                                    }`}
                                >
                                    ❤️ {l.hp_sisa}
                                </span>
                            )}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}