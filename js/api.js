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
            throw new ApiError("CONFIG.API_BASE_URL no está configurado.");
        }

        return `${base}/${path}`;
    }

    async function request(endpoint, options = {}) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(
            () => controller.abort(),
            CONFIG.requestTimeoutMs || 12000
        );

        try {
            const response = await fetch(buildUrl(endpoint), {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    ...(options.headers || {})
                },
                signal: controller.signal,
                ...options
            });

            const contentType = response.headers.get("content-type") || "";
            const body = contentType.includes("application/json")
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                throw new ApiError(
                    body?.message ||
                    body?.error ||
                    `La API respondió con el estado ${response.status}.`,
                    response.status,
                    body
                );
            }

            return body;
        } catch (error) {
            if (error.name === "AbortError") {
                throw new ApiError(
                    "La API tardó demasiado en responder. Comprueba que el backend esté encendido."
                );
            }

            if (error instanceof ApiError) {
                throw error;
            }

            throw new ApiError(
                "No fue posible conectar con el backend. Revisa la URL de la API y la configuración CORS.",
                0,
                error
            );
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    async function obtenerProductos() {
        const data = await request(CONFIG.ENDPOINTS.productos);

        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.productos)) return data.productos;

        throw new ApiError(
            "La respuesta de /productos no contiene un arreglo de productos."
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
