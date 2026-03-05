import Header from "@/Layouts/Header";

export default function AppLayout({ children }) {
    const user = JSON.parse(localStorage.getItem("auth_user"));

    return (
        <div className="min-h-screen flex flex-col">
            <Header user={user} />
            <main className="flex-1 p-8 pt-24 overflow-y-auto">{children}</main>
        </div>
    );
}
