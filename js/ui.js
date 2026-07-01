"use strict";

(function () {
    const searchState = {
        matches: [],
        activeIndex: -1
    };

    function categoryUrl(category) {
        return category === "Todos"
            ? "catalogo.html"
            : `catalogo.html?categoria=${encodeURIComponent(category)}`;
    }

    function createCountBadge(category) {
        const count =
            document.createElement("span");

        count.className =
            "category-count";

        count.textContent =
            String(
                window.Products
                    .categoryCount(category)
            );

        return count;
    }

    function createNormalCategoryItem(category) {
        const item =
            document.createElement("li");

        const link =
            document.createElement("a");

        const label =
            document.createElement("span");

        link.className =
            "category-dropdown-link";

        link.href =
            categoryUrl(category);

        label.textContent = category;

        link.append(
            label,
            createCountBadge(category)
        );

        item.appendChild(link);

        return item;
    }

function createSeasonItem() {
    const item = document.createElement("li");
    const link = document.createElement("a");
    const label = document.createElement("span");
    const right = document.createElement("span");

    item.className = "season-menu-item";

    link.className = "category-dropdown-link season-menu-trigger";
    link.href = categoryUrl("Temporada");
    link.setAttribute("aria-haspopup", "true");
    link.setAttribute("aria-expanded", "false");
    link.setAttribute("aria-controls", "season-flyout");

    label.textContent = "Temporada";

    right.className = "submenu-indicator";
    right.innerHTML = `
        ${window.Products.categoryCount("Temporada")}
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
    `;

    link.append(label, right);
    item.appendChild(link);

    return item;
}

    function renderCategoryDropdown() {
        const dropdown =
            document.getElementById(
                "categories-dropdown"
            );

        if (!dropdown) return;

        dropdown.innerHTML = "";

        CONFIG.CATEGORIES
            .forEach((category) => {
                if (category === "Temporada") {
                    dropdown.appendChild(
                        createSeasonItem()
                    );
                    return;
                }

                dropdown.appendChild(
                    createNormalCategoryItem(
                        category
                    )
                );
            });

        initSeasonFlyout();
    }



let seasonFlyoutCloseTimer = 0;

function createSeasonFlyout() {
    document.getElementById("season-flyout")?.remove();

    const flyout = document.createElement("aside");
    const header = document.createElement("div");
    const titleWrap = document.createElement("div");
    const eyebrow = document.createElement("span");
    const title = document.createElement("strong");
    const closeButton = document.createElement("button");
    const list = document.createElement("ul");

    flyout.id = "season-flyout";
    flyout.className = "season-flyout";
    flyout.hidden = true;
    flyout.setAttribute("aria-label", "Subcategorías de Temporada");

    header.className = "season-flyout-header";
    titleWrap.className = "season-flyout-title-wrap";
    eyebrow.className = "season-flyout-eyebrow";
    eyebrow.textContent = "Colecciones especiales";
    title.className = "season-flyout-title";
    title.textContent = "Temporada";

    closeButton.type = "button";
    closeButton.className = "season-flyout-close";
    closeButton.setAttribute("aria-label", "Cerrar subcategorías de Temporada");
    closeButton.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';

    titleWrap.append(eyebrow, title);
    header.append(titleWrap, closeButton);

    list.className = "season-flyout-grid";

    const iconByCategory = {
        "Navidad": "fa-solid fa-gift",
        "Día de la Madre": "fa-solid fa-heart",
        "Día del Padre": "fa-solid fa-user-tie",
        "Día del Niño": "fa-solid fa-child-reaching",
        "Profesores": "fa-solid fa-chalkboard-user",
        "Graduaciones": "fa-solid fa-graduation-cap",
        "Bautizos": "fa-solid fa-droplet",
        "Baby Shower": "fa-solid fa-baby"
    };

    CONFIG.SEASON_CATEGORIES.forEach((category) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        const icon = document.createElement("span");
        const content = document.createElement("span");
        const name = document.createElement("strong");
        const count = document.createElement("span");
        const arrow = document.createElement("i");

        link.className = "season-flyout-link";
        link.href = categoryUrl(category);

        icon.className = "season-flyout-icon";
        icon.innerHTML = `<i class="${iconByCategory[category] || "fa-solid fa-calendar-day"}" aria-hidden="true"></i>`;

        content.className = "season-flyout-link-content";
        name.textContent = category;
        count.textContent = `${window.Products.categoryCount(category)} producto${window.Products.categoryCount(category) === 1 ? "" : "s"}`;
        content.append(name, count);

        arrow.className = "fa-solid fa-arrow-right season-flyout-arrow";
        arrow.setAttribute("aria-hidden", "true");

        link.append(icon, content, arrow);
        item.appendChild(link);
        list.appendChild(item);
    });

    flyout.append(header, list);
    document.body.appendChild(flyout);

    closeButton.addEventListener("click", closeSeasonFlyout);
    flyout.addEventListener("pointerenter", cancelSeasonFlyoutClose);
    flyout.addEventListener("pointerleave", scheduleSeasonFlyoutClose);
    flyout.addEventListener("focusin", cancelSeasonFlyoutClose);
    flyout.addEventListener("focusout", (event) => {
        if (!flyout.contains(event.relatedTarget)) {
            scheduleSeasonFlyoutClose();
        }
    });

    return flyout;
}

function cancelSeasonFlyoutClose() {
    window.clearTimeout(seasonFlyoutCloseTimer);
}

function positionSeasonFlyout(trigger, flyout) {
    if (!trigger || !flyout || flyout.hidden) return;

    const categoriesDropdown = trigger.closest(".categories-dropdown");
    const anchorRect = (categoriesDropdown || trigger).getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const gap = 12;
    const edge = 12;
    const mobile = window.matchMedia("(max-width: 820px)").matches;

    if (mobile) {
        const width = Math.max(280, viewportWidth - edge * 2);
        flyout.style.width = `${width}px`;
        flyout.style.left = `${edge}px`;
        flyout.style.right = "auto";
        flyout.style.maxHeight = `${Math.max(260, viewportHeight - triggerRect.bottom - 24)}px`;
        flyout.style.top = `${Math.min(triggerRect.bottom + 8, viewportHeight - 280)}px`;
        flyout.classList.remove("opens-left");
        return;
    }

    flyout.style.width = "min(44rem, calc(100vw - 2.4rem))";
    flyout.style.maxHeight = `calc(100vh - ${edge * 2}px)`;

    const flyoutRect = flyout.getBoundingClientRect();
    const width = flyoutRect.width;
    const height = Math.min(flyout.scrollHeight, viewportHeight - edge * 2);
    const roomRight = viewportWidth - anchorRect.right;
    const openLeft = roomRight < width + gap;

    let left = openLeft
        ? anchorRect.left - width - gap
        : anchorRect.right + gap;

    left = Math.max(edge, Math.min(left, viewportWidth - width - edge));

    let top = anchorRect.top;
    top = Math.max(edge, Math.min(top, viewportHeight - height - edge));

    flyout.style.left = `${Math.round(left)}px`;
    flyout.style.right = "auto";
    flyout.style.top = `${Math.round(top)}px`;
    flyout.classList.toggle("opens-left", openLeft);
}

function openSeasonFlyout() {
    const trigger = document.querySelector(".season-menu-trigger");
    const flyout = document.getElementById("season-flyout") || createSeasonFlyout();
    const categoriesMenu = trigger?.closest(".has-dropdown");

    if (!trigger || !flyout) return;

    cancelSeasonFlyoutClose();
    flyout.hidden = false;
    categoriesMenu?.classList.add("season-flyout-open");
    trigger.setAttribute("aria-expanded", "true");

    positionSeasonFlyout(trigger, flyout);

    window.requestAnimationFrame(() => {
        flyout.classList.add("is-open");
    });
}

function closeSeasonFlyout() {
    const trigger = document.querySelector(".season-menu-trigger");
    const flyout = document.getElementById("season-flyout");
    const categoriesMenu = trigger?.closest(".has-dropdown");

    window.clearTimeout(seasonFlyoutCloseTimer);
    categoriesMenu?.classList.remove("season-flyout-open");
    trigger?.setAttribute("aria-expanded", "false");

    if (!flyout) return;

    flyout.classList.remove("is-open");

    window.setTimeout(() => {
        if (!flyout.classList.contains("is-open")) {
            flyout.hidden = true;
        }
    }, 170);
}

function scheduleSeasonFlyoutClose() {
    window.clearTimeout(seasonFlyoutCloseTimer);
    seasonFlyoutCloseTimer = window.setTimeout(closeSeasonFlyout, 220);
}

function initSeasonFlyout() {
    const item = document.querySelector(".season-menu-item");
    const trigger = item?.querySelector(".season-menu-trigger");

    if (!item || !trigger) return;

    createSeasonFlyout();

    item.addEventListener("pointerenter", openSeasonFlyout);
    item.addEventListener("pointerleave", scheduleSeasonFlyoutClose);
    item.addEventListener("focusin", openSeasonFlyout);
    item.addEventListener("focusout", (event) => {
        const flyout = document.getElementById("season-flyout");

        if (
            !item.contains(event.relatedTarget) &&
            !flyout?.contains(event.relatedTarget)
        ) {
            scheduleSeasonFlyoutClose();
        }
    });

    trigger.addEventListener("click", (event) => {
        if (window.matchMedia("(max-width: 820px)").matches) {
            const flyout = document.getElementById("season-flyout");
            const currentlyOpen = Boolean(flyout?.classList.contains("is-open"));

            if (!currentlyOpen) {
                event.preventDefault();
                openSeasonFlyout();
            }
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSeasonFlyout();
            trigger.focus();
        }
    });

    document.addEventListener("pointerdown", (event) => {
        const flyout = document.getElementById("season-flyout");

        if (
            !item.contains(event.target) &&
            !flyout?.contains(event.target)
        ) {
            closeSeasonFlyout();
        }
    });

    const reposition = () => {
        const flyout = document.getElementById("season-flyout");

        if (flyout?.classList.contains("is-open")) {
            positionSeasonFlyout(trigger, flyout);
        }
    };

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, { passive: true });
}

    function initMobileMenu() {
        const button =
            document.getElementById(
                "mobile-menu-button"
            );

        const menu =
            document.getElementById(
                "main-menu"
            );

        if (!button || !menu) return;

        button.addEventListener(
            "click",
            () => {
                const open =
                    menu.classList.toggle(
                        "is-open"
                    );

                button.setAttribute(
                    "aria-expanded",
                    String(open)
                );

                button.setAttribute(
                    "aria-label",
                    open
                        ? "Cerrar menú"
                        : "Abrir menú"
                );
            }
        );
    }

    function initSupportLinks() {
        const supportUrl =
            `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.soporteMensaje)}`;

        const support =
            document.getElementById(
                "support-whatsapp"
            );

        const footerSupport =
            document.getElementById(
                "footer-support-whatsapp"
            );

        const phone =
            document.getElementById(
                "telefono-soporte"
            );

        if (support) {
            support.href = supportUrl;
        }

        if (footerSupport) {
            footerSupport.href =
                supportUrl;
        }

        if (phone) {
            phone.textContent =
                CONFIG.soporteTelefono;
        }

        document
            .querySelectorAll(
                "[data-social]"
            )
            .forEach((link) => {
                const network =
                    link.dataset.social;

                const url =
                    CONFIG.social?.[network];

                if (url) {
                    link.href = url;
                }
            });
    }

    function closeSuggestions() {
        const input =
            document.getElementById(
                "search-input"
            );

        const suggestions =
            document.getElementById(
                "search-suggestions"
            );

        if (!input || !suggestions) {
            return;
        }

        suggestions.hidden = true;
        suggestions.innerHTML = "";

        searchState.matches = [];
        searchState.activeIndex = -1;

        input.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    function openProduct(product) {
        window.location.href =
            `producto.html?id=${encodeURIComponent(product.id)}`;
    }

    function activateSuggestion(index) {
        const suggestions =
            document.getElementById(
                "search-suggestions"
            );

        const items =
            suggestions
                ?.querySelectorAll(
                    ".search-suggestion"
                );

        if (!items?.length) return;

        searchState.activeIndex =
            (index + items.length) %
            items.length;

        items.forEach(
            (item, itemIndex) => {
                item.classList.toggle(
                    "is-active",
                    itemIndex ===
                    searchState.activeIndex
                );
            }
        );

        items[
            searchState.activeIndex
        ]?.scrollIntoView({
            block: "nearest"
        });
    }

    function renderSuggestions(products) {
        const input =
            document.getElementById(
                "search-input"
            );

        const suggestions =
            document.getElementById(
                "search-suggestions"
            );

        if (!input || !suggestions) {
            return;
        }

        suggestions.innerHTML = "";
        searchState.matches = products;
        searchState.activeIndex = -1;

        if (products.length === 0) {
            suggestions.innerHTML = `
                <p class="search-suggestion-empty">
                    No encontramos coincidencias.
                </p>
            `;

            suggestions.hidden = false;

            input.setAttribute(
                "aria-expanded",
                "true"
            );

            return;
        }

        const fragment =
            document.createDocumentFragment();

        products.slice(0, 6)
            .forEach((product) => {
                const button =
                    document.createElement("button");

                const image =
                    document.createElement("img");

                const info =
                    document.createElement("span");

                const name =
                    document.createElement("span");

                const category =
                    document.createElement("span");

                const price =
                    document.createElement("span");

                button.type = "button";

                button.className =
                    "search-suggestion";

                button.setAttribute(
                    "role",
                    "option"
                );

                image.src =
                    product.imagenPrincipal ||
                    CONFIG.placeholderImage;

                image.alt = "";

                info.className =
                    "search-suggestion-info";

                name.className =
                    "search-suggestion-name";

                name.textContent =
                    product.nombre;

                category.className =
                    "search-suggestion-category";

                category.textContent =
                    product.categoria;

                price.className =
                    "search-suggestion-price";

                price.textContent =
                    window.Products
                        .formatPrice(
                            product.precio
                        );

                info.append(
                    name,
                    category
                );

                button.append(
                    image,
                    info,
                    price
                );

                button.addEventListener(
                    "click",
                    () => openProduct(product)
                );

                fragment.appendChild(
                    button
                );
            });

        suggestions.appendChild(
            fragment
        );

        suggestions.hidden = false;

        input.setAttribute(
            "aria-expanded",
            "true"
        );
    }

    function initSmartSearch() {
        const form =
            document.getElementById(
                "search-form"
            );

        const input =
            document.getElementById(
                "search-input"
            );

        if (!form || !input) return;

        const currentQuery =
            new URLSearchParams(
                window.location.search
            ).get("q");

        if (currentQuery) {
            input.value = currentQuery;
        }

        let debounceId = 0;

        input.addEventListener(
            "input",
            () => {
                window.clearTimeout(
                    debounceId
                );

                debounceId =
                    window.setTimeout(
                        () => {
                            const query =
                                input.value.trim();

                            if (
                                query.length < 2
                            ) {
                                closeSuggestions();
                                return;
                            }

                            renderSuggestions(
                                window.Products
                                    .searchProducts(
                                        query
                                    )
                                    .slice(0, 6)
                            );
                        },
                        120
                    );
            }
        );

        input.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key ===
                    "ArrowDown"
                ) {
                    event.preventDefault();

                    activateSuggestion(
                        searchState
                            .activeIndex +
                        1
                    );
                }

                if (
                    event.key ===
                    "ArrowUp"
                ) {
                    event.preventDefault();

                    activateSuggestion(
                        searchState
                            .activeIndex -
                        1
                    );
                }

                if (
                    event.key === "Enter" &&
                    searchState.activeIndex >=
                    0
                ) {
                    event.preventDefault();

                    const product =
                        searchState.matches[
                            searchState
                                .activeIndex
                        ];

                    if (product) {
                        openProduct(product);
                    }
                }

                if (
                    event.key ===
                    "Escape"
                ) {
                    closeSuggestions();
                }
            }
        );

        form.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();

                const query =
                    input.value.trim();

                const url =
                    new URL(
                        "catalogo.html",
                        window.location.href
                    );

                if (query) {
                    url.searchParams.set(
                        "q",
                        query
                    );
                }

                window.location.href =
                    url.href;
            }
        );

        document.addEventListener(
            "click",
            (event) => {
                if (
                    !event.target.closest(
                        ".search-shell"
                    )
                ) {
                    closeSuggestions();
                }
            }
        );
    }

    function initFooter() {
        const year =
            document.getElementById(
                "current-year"
            );

        if (year) {
            year.textContent =
                String(
                    new Date().getFullYear()
                );
        }

        document
            .getElementById(
                "newsletter-form"
            )
            ?.addEventListener(
                "submit",
                (event) => {
                    event.preventDefault();

                    alert(
                        "La suscripción se conectará en una etapa posterior."
                    );
                }
            );
    }

    async function loadGlobalData() {
        try {
            await window.Products
                .loadProducts();

            renderCategoryDropdown();
        } catch (error) {
            console.error(
                "No fue posible cargar las categorías:",
                error
            );

            const dropdown =
                document.getElementById(
                    "categories-dropdown"
                );

            if (dropdown) {
                dropdown.innerHTML = `
                    <li class="dropdown-empty">
                        No se pudieron cargar las categorías.
                    </li>
                `;
            }
        }
    }

    document.addEventListener(
        "studio:navigation-applied",
        () => {
            loadGlobalData();
        }
    );

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            initMobileMenu();
            initSupportLinks();
            initSmartSearch();
            initFooter();
            loadGlobalData();
        }
    );
})();
