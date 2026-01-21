import AppLayout from "@/Layouts/AppLayout";
import { useEffect, useState } from "react";
import { WebAPI } from "@/lib/api.web";

export default function ProtectedLayout({ children, allowedRoles = [] }) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function verify() {
            try {
                const res = await fetch(WebAPI.auth.currentUser, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                });

                if (res.status === 401) {
                    window.location.href = "/login";
                    return;
                }

                const data = await res.json();

                if (
                    allowedRoles.length > 0 &&
                    !data.roles.some(role => allowedRoles.includes(role))
                ) {
                    alert("Tidak memiliki akses");
                    window.location.href = "/";
                    return;
                }

                setLoading(false);
            } catch (err) {
                console.error("Auth check failed", err);
                window.location.href = "/login";
            }
        }

        verify();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Checking authentication...
            </div>
        );
    }

    return <AppLayout>{children}</AppLayout>;
}
