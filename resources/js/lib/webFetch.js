export async function webFetch(url, options = {}) {
    const defaultOptions = {
        credentials: "include",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    };

    // Merge options safely
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {}),
        },
    };

    const res = await fetch(url, finalOptions);

    // Handle auth expiry
    if (res.status === 401 || res.status === 419) {
        window.location.href = "/login";
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
    }

    return res;
}
