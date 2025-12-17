import React from "react";
import Header from "@/Layouts/Header";

export default function AppLayout({ children }) {
    const user = JSON.parse(localStorage.getItem("auth_user"));

    return (
        <div>
            <Header user={user} />
            <main className="p-8">{children}</main>
        </div>
    );
}
