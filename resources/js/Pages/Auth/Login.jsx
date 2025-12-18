import { useState } from "react";
import { API } from "@/lib/api";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch(API.auth.login, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw data;
            }

            localStorage.setItem("auth_token", data.token);
            localStorage.setItem("auth_user", JSON.stringify(data.user));

            if (data.roles.includes("admin")) {
                window.location.href = "/admin";
                return;
            }

            if (data.roles.includes("teacher")) {
                window.location.href = "/dashboard";
                return;
            }

            window.location.href = "/";


        } catch (err) {
            if (err?.errors?.email) {
                setError(err.errors.email[0]);
            } else if (err?.message) {
                setError(err.message);
            } else {
                setError("Login gagal");
            }
        } finally {
            setLoading(false);
        }
    }

    const canLogin = email.length > 0 && password.length > 0;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-700">
            <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg">

                <div className="flex flex-col items-center mb-6">
                    <img src="/logo.png" alt="Logo" className="w-24 h-24 mb-3" />
                    <h1 className="text-xl font-semibold text-gray-800">
                        Platform Kuis
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Login ke akun Anda
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-600 p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-gray-700">Email</label>
                        <input
                            type="email"
                            placeholder="Masukan email Anda"
                            className="w-full mt-1 p-2 border rounded"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-gray-700">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Masukan password Anda"
                                className="w-full mt-1 p-2 pr-10 border rounded"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-3 text-gray-500"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!canLogin || loading}
                        className={`w-full py-2 text-white rounded ${canLogin && !loading
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-400"
                            }`}
                    >
                        {loading ? "Loading..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}
