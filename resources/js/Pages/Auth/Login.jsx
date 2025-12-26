import { useState } from "react";
import { API } from "@/lib/api";
import logo from "@/assets/logo.png";
import { router, usePage } from "@inertiajs/react";

export default function Login() {
    /* ================================
       STATE
    ================================= */
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    // const [error, setError] = useState("");

    const canLogin = email.length > 0 && password.length > 0;

    /* ================================
       HANDLERS
    ================================= */
    function handleLogin(e) {
        e.preventDefault();
        setLoading(true);

        router.post(
            "/login",
            { email, password },
            {
                onFinish: () => setLoading(false),
            }
        );
    }

    /* ================================
       UI
    ================================= */
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-700">
            <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg">
                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-24 h-24 mb-3"
                    />
                    <h1 className="text-xl font-semibold text-gray-800">
                        Platform Kuis
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Login ke akun Anda
                    </p>
                </div>

                {/* Error */}
                {/* {error && (
                    <div className="bg-red-100 border border-red-400 text-red-600 p-3 rounded mb-4">
                        {error}
                    </div>
                )} */}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-gray-700">Email</label>
                        <input
                            type="email"
                            placeholder="Masukkan email Anda"
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
                                placeholder="Masukkan password Anda"
                                className="w-full mt-1 p-2 pr-10 border rounded"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-3 text-gray-500"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
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
