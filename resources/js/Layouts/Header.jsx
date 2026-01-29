import webFetch from "@/lib/webFetch";

export default function Header({ user }) {
    async function handleLogout() {
        try {
            function getCsrfToken() {
                return decodeURIComponent(
                    document.cookie
                        .split("; ")
                        .find(row => row.startsWith("XSRF-TOKEN="))
                        ?.split("=")[1] ?? ""
                );
            }

            await webFetch("/web/logout", {
                headers: {
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                method: "POST",
            });
        } catch (err) {
            console.error("Logout failed", err);
        } finally {
            window.location.href = "/login";
        }
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
