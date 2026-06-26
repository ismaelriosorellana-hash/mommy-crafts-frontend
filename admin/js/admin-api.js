"use strict";

(function () {
    const TOKEN_KEY = "mommycrafts_admin_token";
    const USER_KEY = "mommycrafts_admin_user";

    class AdminApiError extends Error {
        constructor(message, status = 0, details = null) {
            super(message);
            this.name = "AdminApiError";
            this.status = status;
            this.details = details;
        }
    }

    function getBaseUrl() {
        const configured =
            window.CONFIG?.API_BASE_URL ||
            "http://localhost:3000/api";

        return String(configured)
            .replace(/\/+$/, "");
    }

    function getToken() {
        return (
            sessionStorage.getItem(TOKEN_KEY) ||
            localStorage.getItem(TOKEN_KEY) ||
            ""
        );
    }

    function getUser() {
        const raw =
            sessionStorage.getItem(USER_KEY) ||
            localStorage.getItem(USER_KEY);

        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    function saveSession(
        token,
        user,
        remember = false
    ) {
        clearSession();

        const storage =
            remember
                ? localStorage
                : sessionStorage;

        storage.setItem(
            TOKEN_KEY,
            token
        );

        storage.setItem(
            USER_KEY,
            JSON.stringify(user)
        );
    }

    function clearSession() {
        for (const storage of [
            localStorage,
            sessionStorage
        ]) {
            storage.removeItem(TOKEN_KEY);
            storage.removeItem(USER_KEY);
        }
    }

    async function request(
        endpoint,
        options = {}
    ) {
        const url =
            `${getBaseUrl()}/${String(endpoint).replace(/^\/+/, "")}`;

        const headers = {
            Accept: "application/json",
            ...(options.body
                ? {
                    "Content-Type":
                        "application/json"
                }
                : {}),
            ...(options.headers || {})
        };

        const token = getToken();

        if (
            token &&
            options.auth !== false
        ) {
            headers.Authorization =
                `Bearer ${token}`;
        }

        const controller =
            new AbortController();

        const isRenderApi =
            /\.onrender\.com(?:\/|$)/i.test(
                getBaseUrl()
            );

        const timeoutId =
            window.setTimeout(
                () => controller.abort(),
                isRenderApi ? 70000 : 15000
            );

        try {
            const response = await fetch(
                url,
                {
                    method:
                        options.method ||
                        "GET",
                    headers,
                    body:
                        options.body === undefined
                            ? undefined
                            : JSON.stringify(
                                options.body
                            ),
                    signal:
                        controller.signal
                }
            );

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            const data =
                contentType.includes(
                    "application/json"
                )
                    ? await response.json()
                    : await response.text();

            if (!response.ok) {
                if (
                    response.status === 401 &&
                    options.auth !== false
                ) {
                    clearSession();

                    if (
                        !location.pathname.endsWith(
                            "/login.html"
                        )
                    ) {
                        location.href =
                            "login.html?sesion=expirada";
                    }
                }

                throw new AdminApiError(
                    data?.error ||
                    data?.message ||
                    `Error ${response.status}`,
                    response.status,
                    data
                );
            }

            return data;
        } catch (error) {
            if (
                error.name ===
                "AbortError"
            ) {
                throw new AdminApiError(
                    isRenderApi
                        ? "El servidor se está activando. Espera unos segundos e intenta nuevamente."
                        : "El servidor tardó demasiado en responder."
                );
            }

            if (
                error instanceof
                AdminApiError
            ) {
                throw error;
            }

            throw new AdminApiError(
                "No fue posible conectar con el servidor de Mommy Crafts. Intenta nuevamente en un momento.",
                0,
                error
            );
        } finally {
            window.clearTimeout(
                timeoutId
            );
        }
    }

    window.AdminAPI =
        Object.freeze({
            AdminApiError,
            request,
            getToken,
            getUser,
            saveSession,
            clearSession,

            login(email, password) {
                return request(
                    "/auth/login",
                    {
                        method: "POST",
                        auth: false,
                        body: {
                            email,
                            password,
                            area: "admin"
                        }
                    }
                );
            },

            me() {
                return request(
                    "/auth/me"
                );
            }
        });
})();
