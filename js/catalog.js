"use strict";

(function () {
    const state = {
        category: "Todos",
        query: "",
        sort: "mas-vendidos",
        inStock: true
    };

    function readUrlState() {
        const params =
            new URLSearchParams(
                window.location.search
            );

        state.category =
            params.get("categoria") ||
            "Todos";

        state.query =
            params.get("q") || "";

        state.sort =
            params.get("orden") ||
            "mas-vendidos";

        state.inStock =
            params.get("stock") !==
            "todos";
    }

    function updateUrl() {
        const url =
            new URL(
                window.location.href
            );

        if (
            state.category &&
            state.category !== "Todos"
        ) {
            url.searchParams.set(
                "categoria",
                state.category
            );
        } else {
            url.searchParams.delete(
                "categoria"
            );
        }

        if (state.query) {
            url.searchParams.set(
                "q",
                state.query
            );
        } else {
            url.searchParams.delete("q");
        }

        if (
            state.sort !==
            "mas-vendidos"
        ) {
            url.searchParams.set(
                "orden",
                state.sort
            );
        } else {
            url.searchParams.delete(
                "orden"
            );
        }

        if (!state.inStock) {
            url.searchParams.set(
                "stock",
                "todos"
            );
        } else {
            url.searchParams.delete(
                "stock"
            );
        }

        window.history.replaceState(
            {},
            "",
            url
        );
    }

    function createChip(category, season = false) {
        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            `catalog-category-chip${season ? " season-chip" : ""}`;

        button.textContent = category;

        if (
            category ===
            state.category
        ) {
            button.classList.add(
                "active"
            );
        }

        button.addEventListener(
            "click",
            () => {
                state.category =
                    category;

                render();
                updateUrl();
            }
        );

        return button;
    }

    function renderCategoryChips() {
        const container =
            document.getElementById(
                "catalog-category-chips"
            );

        if (!container) return;

        container.innerHTML = "";

        const mainGroup =
            document.createElement("div");

        mainGroup.className =
            "catalog-chip-group";

        CONFIG.CATEGORIES
            .forEach((category) => {
                mainGroup.appendChild(
                    createChip(category)
                );
            });

        const seasonGroup =
            document.createElement("div");

        seasonGroup.className =
            "catalog-chip-group season-filter-group";

        const label =
            document.createElement("span");

        label.className =
            "catalog-chip-label";

        label.textContent =
            "Temporada:";

        seasonGroup.appendChild(label);

        CONFIG.SEASON_CATEGORIES
            .forEach((category) => {
                seasonGroup.appendChild(
                    createChip(
                        category,
                        true
                    )
                );
            });

        container.append(
            mainGroup,
            seasonGroup
        );
    }

    function updateHeading(products) {
        const title =
            document.getElementById(
                "catalog-title"
            );

        const breadcrumb =
            document.getElementById(
                "catalog-breadcrumb-label"
            );

        const count =
            document.getElementById(
                "catalog-result-count"
            );

        const active =
            document.getElementById(
                "catalog-active-filter"
            );

        const label =
            state.category === "Todos"
                ? "Todos los productos"
                : state.category;

        title.textContent = label;
        breadcrumb.textContent = label;

        count.textContent =
            `${products.length} producto${products.length === 1 ? "" : "s"}`;

        const parts = [label];

        if (state.query) {
            parts.push(
                `Búsqueda: “${state.query}”`
            );
        }

        if (state.inStock) {
            parts.push("En stock");
        }

        active.textContent =
            parts.join(" · ");
    }

    function render() {
        const products =
            window.Products
                .getCatalogProducts({
                    category:
                        state.category,
                    query:
                        state.query,
                    inStock:
                        state.inStock,
                    sort:
                        state.sort
                });

        window.Products
            .renderProducts(
                document.getElementById(
                    "catalog-products"
                ),
                products,
                "No encontramos productos con estos filtros."
            );

        renderCategoryChips();
        updateHeading(products);

        document.getElementById(
            "catalog-sort"
        ).value = state.sort;

        document.getElementById(
            "catalog-in-stock"
        ).checked = state.inStock;
    }

    async function init() {
        readUrlState();

        try {
            await window.Products
                .loadProducts();

            document
                .getElementById(
                    "catalog-sort"
                )
                ?.addEventListener(
                    "change",
                    (event) => {
                        state.sort =
                            event.target.value;

                        render();
                        updateUrl();
                    }
                );

            document
                .getElementById(
                    "catalog-in-stock"
                )
                ?.addEventListener(
                    "change",
                    (event) => {
                        state.inStock =
                            event.target.checked;

                        render();
                        updateUrl();
                    }
                );

            render();
        } catch (error) {
            console.error(
                "No se pudo cargar el catálogo:",
                error
            );

            document.getElementById(
                "catalog-products"
            ).innerHTML = `
                <div class="catalog-empty">
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    document.addEventListener(
        "DOMContentLoaded",
        init
    );
})();
