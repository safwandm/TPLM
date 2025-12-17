import AppLayout from "@/Layouts/AppLayout";
import React, { useState, useEffect } from "react";
import { API } from "@/lib/api";


export default function ProtectedLayout({ children, allowedRoles = [] }) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function verify() {
            const token = localStorage.getItem("auth_token");

            if (!token) {
                window.location.href = "/login";
                return;
            }

            try {
                const res = await fetch(API.auth.currentUser, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });

                if (!res.ok) throw new Error("Unauthorized");

                const data = await res.json();

                if (
                    allowedRoles.length > 0 &&
                    !data.roles.some(role => allowedRoles.includes(role))
                ) {
                    alert("Tidak memiliki akses");
                    window.location.href = "/login";
                    return;
                }

                setLoading(false);
            } catch {
                localStorage.clear();
                window.location.href = "/login";
            }
        }

        verify();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Checking authentication...</div>;
    }

    return <AppLayout>{children}</AppLayout>;
}
