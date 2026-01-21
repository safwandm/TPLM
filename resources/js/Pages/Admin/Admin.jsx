import ProtectedLayout from '@/Layouts/ProtectedLayout';

export default function Admin() {
    return (
        <ProtectedLayout allowedRoles={["admin"]}>
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Welcome to Admin
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Dashboard coming soon...
                    </p>
                </div>
            </div>
        </ProtectedLayout>
    );
}