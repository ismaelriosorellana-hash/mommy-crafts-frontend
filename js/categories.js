"use strict";

(function () {
    let cachedCategories = null;
    let loadingPromise = null;

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function normalizeCategory(category, index = 0) {
        const name = String(category?.nombre || category?.name || category || "")
            .trim();

        if (!name) return null;

        const slug = String(category?.slug || name)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        return {
            id: String(category?.id || category?._id || slug),
            nombre: name,
            slug,
            descripcion: String(category?.descripcion || "").trim(),
            icono: String(category?.icono || "fa-solid fa-tag").trim(),
            imagen: String(category?.imagen || "").trim(),
            color: String(category?.color || "#8E456A").trim(),
            activa: category?.activa !== false,
            mostrarMenu: category?.mostrarMenu !== false,
            mostrarInicio: category?.mostrarInicio !== false,
            destacada: Boolean(category?.destacada),
            orden: Number(category?.orden || (index + 1) * 10),
            totalProductos: Number(category?.totalProductos || 0)
        };
    }

    function fallbackCategories() {
        return (window.CONFIG?.CATEGORIES || [])
            .filter((name) => !["Todos"].includes(name))
            .map((name, index) => normalizeCategory({
                nombre: name,
                mostrarMenu: true,
                mostrarInicio: name !== "Temporada",
                orden: (index + 1) * 10
            }, index))
            .filter(Boolean);
    }

    function sortCategories(categories) {
        return [...categories].sort((a, b) =>
            Number(a.orden || 0) - Number(b.orden || 0) ||
            a.nombre.localeCompare(b.nombre, "es")
        );
    }

    async function loadCategories(force = false) {
        if (cachedCategories && !force) {
            return cachedCategories;
        }

        if (loadingPromise && !force) {
            return loadingPromise;
        }

        loadingPromise = (async () => {
            try {
                const endpoint = window.CONFIG?.ENDPOINTS?.categorias || "/categorias";
                const response = window.API?.request
                    ? await window.API.request(endpoint, { timeoutMs: 30000 })
                    : null;

                const source = Array.isArray(response?.categorias)
                    ? response.categorias
                    : Array.isArray(response)
                        ? response
                        : [];

                const normalized = source
                    .map(normalizeCategory)
                    .filter(Boolean)
                    .filter((category) => category.activa);

                cachedCategories = sortCategories(
                    normalized.length ? normalized : fallbackCategories()
                );
            } catch (error) {
                console.warn("No fue posible cargar categorías administrables:", error);
                cachedCategories = sortCategories(fallbackCategories());
            } finally {
                loadingPromise = null;
            }

            return cachedCategories;
        })();

        return loadingPromise;
    }

    function getCategories() {
        return cachedCategories || sortCategories(fallbackCategories());
    }

    function getMenuCategories() {
        return getCategories().filter((category) => category.mostrarMenu);
    }

    function getHomeCategories() {
        return getCategories().filter((category) => category.mostrarInicio);
    }

    function categoryUrl(category) {
        const name = typeof category === "string"
            ? category
            : category?.nombre;

        return `catalogo.html?categoria=${encodeURIComponent(name || "")}`;
    }

    window.Categories = Object.freeze({
        escapeHtml,
        normalizeCategory,
        loadCategories,
        getCategories,
        getMenuCategories,
        getHomeCategories,
        categoryUrl
    });
})();
