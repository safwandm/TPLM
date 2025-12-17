import React from "react";
import { API } from "@/lib/api";

export default function Header({ user }) {
    async function handleLogout() {

        const token = localStorage.getItem("auth_token");
        await fetch(API.auth.logout, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");

        window.location.href = "/login";
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
