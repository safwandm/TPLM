export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("auth_token");

    const res = await fetch(`http://localhost:8001/api${url}`, {
        ...options,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    // Handle unauthenticated
    if (res.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        window.location.href = "/login";
        throw new Error("Unauthorized");
    }

    return res;
}
