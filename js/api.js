"use strict";

(function () {
    class ApiError extends Error {
        constructor(message, status = 0, details = null) {
            super(message);
            this.name = "ApiError";
            this.status = status;
            this.details = details;
        }
    }

    function buildUrl(endpoint) {
        const base = String(CONFIG.API_BASE_URL || "").replace(/\/+$/, "");
        const path = String(endpoint || "").replace(/^\/+/, "");

        if (!base) {
            throw new ApiError("La dirección del servidor no está configurada.");
        }

        if (
            location.protocol === "https:" &&
            /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(base)
        ) {
            throw new ApiError(
                "La tienda publicada todavía apunta al servidor local. " +
                "Actualiza API_BASE_URL en js/config.js con la URL HTTPS de Render."
            );
        }

        return `${base}/${path}`;
    }

    function isRenderApi() {
        return /\.onrender\.com(?:\/|$)/i.test(
            String(CONFIG.API_BASE_URL || "")
        );
    }

    function wait(ms) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, ms);
        });
    }

    function notify(type, detail = {}) {
        window.dispatchEvent(
            new CustomEvent(`api:${type}`, {
                detail
            })
        );
    }

    function normalizeError(error) {
        if (error instanceof ApiError) {
            return error;
        }

        if (error?.name === "AbortError") {
            return new ApiError(
                isRenderApi()
                    ? "El servidor está tardando en activarse. Intenta nuevamente en unos segundos."
                    : "El servidor tardó demasiado en responder."
            );
        }

        return new ApiError(
            "No fue posible conectar con el servidor de Mommy Crafts. " +
            "Comprueba la conexión e intenta nuevamente.",
            0,
            error
        );
    }

    function isRetryable(error) {
        return (
            error?.status === 0 ||
            [502, 503, 504].includes(Number(error?.status))
        );
    }

    async function request(endpoint, options = {}) {
        const {
            timeoutMs,
            retries,
            headers: optionHeaders,
            ...fetchOptions
        } = options;

        const method = String(fetchOptions.method || "GET").toUpperCase();
        const renderApi = isRenderApi();
        const configuredTimeout =
            Number(timeoutMs) ||
            Number(CONFIG.requestTimeoutMs) ||
            12000;

        const baseTimeout =
            renderApi
                ? Math.max(configuredTimeout, 70000)
                : configuredTimeout;

        const retryCount =
            Number.isInteger(retries)
                ? Math.max(0, retries)
                : method === "GET" && renderApi
                    ? 1
                    : 0;

        let lastError = null;

        for (let attempt = 0; attempt <= retryCount; attempt += 1) {
            const controller = new AbortController();
            const attemptTimeout =
                attempt === 0
                    ? baseTimeout
                    : Math.min(baseTimeout, 30000);

            const timeoutId = window.setTimeout(
                () => controller.abort(),
                attemptTimeout
            );

            const slowId = window.setTimeout(
                () => {
                    notify("slow", {
                        endpoint,
                        attempt: attempt + 1,
                        renderApi
                    });
                },
                3500
            );

            try {
                const headers = {
                    Accept: "application/json",
                    ...(optionHeaders || {})
                };

                const customerToken =
                    window.CustomerAuth?.getToken?.() || "";

                if (
                    customerToken &&
                    !headers.Authorization
                ) {
                    headers.Authorization =
                        `Bearer ${customerToken}`;
                }

                const response = await fetch(buildUrl(endpoint), {
                    method: "GET",
                    ...fetchOptions,
                    headers,
                    signal: controller.signal
                });

                const contentType =
                    response.headers.get("content-type") || "";

                const isJson =
                    contentType.includes("application/json");

                const body = isJson
                    ? await response.json()
                    : await response.text();

                if (!response.ok) {
                    throw new ApiError(
                        body?.message ||
                        body?.error ||
                        `El servidor respondió con el estado ${response.status}.`,
                        response.status,
                        body
                    );
                }

                if (
                    headers.Accept?.includes("application/json") &&
                    !isJson
                ) {
                    throw new ApiError(
                        renderApi
                            ? "El servidor todavía se está activando."
                            : "El servidor entregó una respuesta inesperada.",
                        503,
                        {
                            contentType,
                            preview: String(body).slice(0, 160)
                        }
                    );
                }

                notify("ready", {
                    endpoint,
                    attempt: attempt + 1
                });

                return body;
            } catch (error) {
                const normalized = normalizeError(error);
                lastError = normalized;

                const shouldRetry =
                    method === "GET" &&
                    attempt < retryCount &&
                    isRetryable(normalized);

                if (!shouldRetry) {
                    notify("error", {
                        endpoint,
                        error: normalized
                    });
                    throw normalized;
                }

                notify("retry", {
                    endpoint,
                    attempt: attempt + 1,
                    error: normalized
                });

                await wait(3500);
            } finally {
                window.clearTimeout(timeoutId);
                window.clearTimeout(slowId);
            }
        }

        throw lastError || new ApiError(
            "No fue posible completar la solicitud."
        );
    }

    async function obtenerProductos() {
        const data = await request(CONFIG.ENDPOINTS.productos);

        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.productos)) return data.productos;

        throw new ApiError(
            "La respuesta de productos no contiene un listado válido."
        );
    }

    async function obtenerProductoPorId(id) {
        if (!id) {
            throw new ApiError("No se recibió el ID del producto.");
        }

        const productos = await obtenerProductos();
        return productos.find(
            (producto) => String(producto._id || producto.id) === String(id)
        ) || null;
    }

    window.API = Object.freeze({
        ApiError,
        request,
        obtenerProductos,
        obtenerProductoPorId
    });
})();
