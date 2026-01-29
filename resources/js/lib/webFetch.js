export default async function webFetch(url, options = {}) {
    function getCsrfToken() {
        return decodeURIComponent(
            document.cookie
                .split("; ")
                .find(row => row.startsWith("XSRF-TOKEN="))
                ?.split("=")[1] ?? ""
        );
    }

    const defaultOptions = {
        credentials: "include",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": getCsrfToken(),
        },
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {}),
        },
    };

    const res = await fetch(url, finalOptions);

    if (res.status === 401 || res.status === 419) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        window.location.href = "/login";
    }

    return res;
}
