import { API } from "@/lib/api";
import { router } from "@inertiajs/react";

export default function Header({ user }) {
    async function handleLogout() {

        router.post("/logout");

    }

    return (
        <header className="bg-blue-800 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="text-2xl">📋</div>
                <h1 className="text-lg font-semibold">Platform Kuis</h1>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm">
                    Selamat datang,{" "}
                    <strong>{user?.name ?? user?.email ?? "User"}</strong>
                </span>

                <button
                    onClick={handleLogout}
                    className="ml-4 px-3 py-1 border rounded bg-white text-blue-800"
                >
                    Keluar
                </button>
            </div>
        </header>
    );
}
