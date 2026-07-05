"use strict";

(function () {
    const searchState = {
        matches: [],
        activeIndex: -1
    };

    function categoryName(category) {
        return typeof category === "string"
            ? category
            : String(category?.nombre || "").trim();
    }

    function categoryUrl(category) {
        const name = categoryName(category);
        return name === "Todos" || !name
            ? "catalogo.html"
            : `catalogo.html?categoria=${encodeURIComponent(name)}`;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function createCountBadge(category) {
        const count =
            document.createElement("span");

        count.className =
            "category-count";

        count.textContent =
            String(
                window.Products
                    .categoryCount(categoryName(category))
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

        const icon =
            document.createElement("i");

        const name = categoryName(category);

        link.className =
            "category-dropdown-link";

        link.href =
            categoryUrl(category);

        if (category?.icono) {
            icon.className = category.icono;
            icon.setAttribute("aria-hidden", "true");
            link.appendChild(icon);
        }

        label.textContent = name;

        link.append(
            label,
            createCountBadge(name)
        );

        item.appendChild(link);

        return item;
    }

function createSeasonSubmenuList() {
    const list = document.createElement("ul");
    list.className = "season-mobile-submenu";
    list.hidden = true;

    const allItem = document.createElement("li");
    const allLink = document.createElement("a");
    allLink.href = categoryUrl("Temporada");
    allLink.className = "season-mobile-submenu-link season-mobile-submenu-all";
    allLink.innerHTML = `
        <span><i class="fa-solid fa-layer-group" aria-hidden="true"></i> Ver todo Temporada</span>
        <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
    `;
    allItem.appendChild(allLink);
    list.appendChild(allItem);

    CONFIG.SEASON_CATEGORIES.forEach((category) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = categoryUrl(category);
        link.className = "season-mobile-submenu-link";
        link.innerHTML = `
            <span>${escapeHtml(category)}</span>
            <small>${window.Products.categoryCount(category)} producto${window.Products.categoryCount(category) === 1 ? "" : "s"}</small>
        `;
        item.appendChild(link);
        list.appendChild(item);
    });

    return list;
}

function createSeasonItem() {
    const item = document.createElement("li");
    const link = document.createElement("a");
    const label = document.createElement("span");
    const right = document.createElement("span");
    const submenu = createSeasonSubmenuList();
    const submenuId = "season-mobile-submenu";

    item.className = "season-menu-item";

    link.className = "category-dropdown-link season-menu-trigger";
    link.href = categoryUrl("Temporada");
    link.setAttribute("aria-haspopup", "true");
    link.setAttribute("aria-expanded", "false");
    link.setAttribute("aria-controls", submenuId);

    label.textContent = "Temporada";

    right.className = "submenu-indicator";
    right.innerHTML = `
        ${window.Products.categoryCount("Temporada")}
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
    `;

    submenu.id = submenuId;

    link.append(label, right);
    item.append(link, submenu);

    return item;
}

    function renderCategoryDropdown() {
        const dropdown =
            document.getElementById(
                "categories-dropdown"
            );

        if (!dropdown) return;

        dropdown.innerHTML = "";

        const categories = window.Categories?.getMenuCategories?.() ||
            CONFIG.CATEGORIES.map((nombre) => ({ nombre }));

        categories
            .filter((category) => categoryName(category) !== "Todos")
            .forEach((category) => {
                if (categoryName(category) === "Temporada") {
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
    const mobileSubmenu = item?.querySelector(".season-mobile-submenu");

    if (!item || !trigger) return;

    createSeasonFlyout();

    const isMobile = () => window.matchMedia("(max-width: 820px)").matches;

    const setMobileOpen = (open) => {
        item.classList.toggle("is-mobile-open", open);
        trigger.setAttribute("aria-expanded", String(open));
        if (mobileSubmenu) mobileSubmenu.hidden = !open;
        if (open) closeSeasonFlyout();
    };

    item.addEventListener("pointerenter", () => {
        if (!isMobile()) openSeasonFlyout();
    });

    item.addEventListener("pointerleave", () => {
        if (!isMobile()) scheduleSeasonFlyoutClose();
    });

    item.addEventListener("focusin", () => {
        if (!isMobile()) openSeasonFlyout();
    });

    item.addEventListener("focusout", (event) => {
        if (isMobile()) return;
        const flyout = document.getElementById("season-flyout");

        if (
            !item.contains(event.relatedTarget) &&
            !flyout?.contains(event.relatedTarget)
        ) {
            scheduleSeasonFlyoutClose();
        }
    });

    trigger.addEventListener("click", (event) => {
        if (isMobile()) {
            event.preventDefault();
            setMobileOpen(!item.classList.contains("is-mobile-open"));
            return;
        }

        const flyout = document.getElementById("season-flyout");
        const currentlyOpen = Boolean(flyout?.classList.contains("is-open"));
        if (!currentlyOpen) {
            event.preventDefault();
            openSeasonFlyout();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        setMobileOpen(false);
        closeSeasonFlyout();
        trigger.focus();
    });

    document.addEventListener("pointerdown", (event) => {
        const flyout = document.getElementById("season-flyout");

        if (
            !item.contains(event.target) &&
            !flyout?.contains(event.target)
        ) {
            setMobileOpen(false);
            closeSeasonFlyout();
        }
    });

    const reposition = () => {
        if (isMobile()) {
            closeSeasonFlyout();
            return;
        }

        const flyout = document.getElementById("season-flyout");

        if (flyout?.classList.contains("is-open")) {
            positionSeasonFlyout(trigger, flyout);
        }
    };

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, { passive: true });
}


    function initMobileCategoryDropdowns(menu) {
        if (!menu) return;

        const isMobile = () => window.matchMedia("(max-width: 820px)").matches;

        menu.addEventListener("click", (event) => {
            const trigger = event.target.closest(".has-dropdown > a[aria-haspopup]");
            if (!trigger || !menu.contains(trigger) || !isMobile()) return;

            event.preventDefault();
            const item = trigger.closest(".has-dropdown");
            const open = !item.classList.contains("is-mobile-open");

            menu.querySelectorAll(".has-dropdown.is-mobile-open").forEach((current) => {
                if (current !== item) {
                    current.classList.remove("is-mobile-open");
                    current.querySelector(":scope > a[aria-haspopup]")?.setAttribute("aria-expanded", "false");
                }
            });

            item.classList.toggle("is-mobile-open", open);
            trigger.setAttribute("aria-expanded", String(open));
        });
    }

    function enableSmoothDragScroll(scrollArea) {
        if (!scrollArea || scrollArea.dataset.mcSmoothDragBound === "true") return;
        scrollArea.dataset.mcSmoothDragBound = "true";
        scrollArea.classList.add("drag-scroll-ready");

        let pointerDown = false;
        let pointerId = null;
        let startX = 0;
        let startLeft = 0;
        let dragged = false;
        let lastX = 0;
        let lastTime = 0;
        let velocity = 0;
        let raf = 0;

        const stopMomentum = () => {
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
        };

        const momentum = () => {
            if (Math.abs(velocity) < .08) {
                raf = 0;
                return;
            }
            scrollArea.scrollLeft -= velocity;
            velocity *= .92;
            raf = requestAnimationFrame(momentum);
        };

        scrollArea.addEventListener("pointerdown", (event) => {
            if (event.pointerType === "touch" || event.button !== 0) return;
            if (scrollArea.scrollWidth <= scrollArea.clientWidth + 2) return;
            pointerDown = true;
            pointerId = event.pointerId;
            startX = event.clientX;
            lastX = event.clientX;
            lastTime = performance.now();
            startLeft = scrollArea.scrollLeft;
            dragged = false;
            velocity = 0;
            stopMomentum();
        });

        scrollArea.addEventListener("pointermove", (event) => {
            if (!pointerDown || event.pointerId !== pointerId) return;
            const dx = event.clientX - startX;
            if (!dragged && Math.abs(dx) > 5) {
                dragged = true;
                scrollArea.classList.add("is-dragging-scroll");
                scrollArea.setPointerCapture?.(pointerId);
            }
            if (!dragged) return;
            event.preventDefault();
            scrollArea.scrollLeft = startLeft - dx;
            const now = performance.now();
            const elapsed = Math.max(16, now - lastTime);
            velocity = ((event.clientX - lastX) / elapsed) * 16;
            lastX = event.clientX;
            lastTime = now;
        });

        const finish = (event) => {
            if (!pointerDown || (event?.pointerId !== undefined && event.pointerId !== pointerId)) return;
            pointerDown = false;
            scrollArea.classList.remove("is-dragging-scroll");
            if (dragged) {
                scrollArea.dataset.suppressClick = "true";
                window.setTimeout(() => delete scrollArea.dataset.suppressClick, 100);
                stopMomentum();
                raf = requestAnimationFrame(momentum);
            }
            try { if (pointerId !== null) scrollArea.releasePointerCapture?.(pointerId); } catch {}
            pointerId = null;
        };

        scrollArea.addEventListener("pointerup", finish);
        scrollArea.addEventListener("pointercancel", finish);
        scrollArea.addEventListener("lostpointercapture", finish);
        scrollArea.addEventListener("click", (event) => {
            if (scrollArea.dataset.suppressClick === "true") {
                event.preventDefault();
                event.stopPropagation();
            }
        }, true);
    }

    function initGlobalSmoothCarousels() {
        document
            .querySelectorAll(".carousel-container, .categories-grid, .related-products .container-products")
            .forEach(enableSmoothDragScroll);
    }



    function ensureMobileMenuStructure(menu) {
        if (!menu) return;

        const dropdown = menu.querySelector("#categories-dropdown");
        if (dropdown && !dropdown.querySelector("a")) {
            dropdown.innerHTML = "";
            const categories = (window.Categories?.getMenuCategories?.() || [])
                .filter((category) => categoryName(category) !== "Todos");
            const fallback = categories.length
                ? categories
                : (window.CONFIG?.CATEGORIES || ["Librería", "Vasos", "Poleras", "Temporada"])
                    .filter((name) => name && name !== "Todos")
                    .map((nombre) => ({ nombre }));

            fallback.forEach((category) => {
                if (categoryName(category) === "Temporada") {
                    dropdown.appendChild(createSeasonItem());
                    return;
                }
                dropdown.appendChild(createNormalCategoryItem(category));
            });
        }

        menu.querySelectorAll(".has-dropdown > a[aria-haspopup]").forEach((trigger) => {
            trigger.setAttribute("role", "button");
            trigger.setAttribute("aria-expanded", String(trigger.closest(".has-dropdown")?.classList.contains("is-mobile-open")));
        });
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

        ensureMobileMenuStructure(menu);
        initMobileCategoryDropdowns(menu);

        if (button.dataset.mobileMenuBound !== "true") {
            button.dataset.mobileMenuBound = "true";
            button.addEventListener("click", () => {
                const open = menu.classList.toggle("is-open");
                document.body.classList.toggle("mobile-menu-open", open);
                button.setAttribute("aria-expanded", String(open));
                button.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
            });
        }

        if (menu.dataset.mobileMenuCloseBound !== "true") {
            menu.dataset.mobileMenuCloseBound = "true";
            menu.addEventListener("click", (event) => {
                const link = event.target.closest("a");
                if (!link || !menu.contains(link)) return;
                if (window.matchMedia("(max-width: 820px)").matches && (link.matches(".has-dropdown > a[aria-haspopup], .season-menu-trigger") || link.closest(".dropdown")?.querySelector(".season-mobile-submenu"))) return;
                menu.classList.remove("is-open");
                document.body.classList.remove("mobile-menu-open");
                button.setAttribute("aria-expanded", "false");
                button.setAttribute("aria-label", "Abrir menú");
            });
        }

        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape" || !menu.classList.contains("is-open")) return;
            menu.classList.remove("is-open");
            document.body.classList.remove("mobile-menu-open");
            button.setAttribute("aria-expanded", "false");
            button.setAttribute("aria-label", "Abrir menú");
            button.focus();
        });
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
            window.ProductLinks.detail(product);
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
            await Promise.all([
                window.Products.loadProducts(),
                window.Categories?.loadCategories?.()
            ]);

            renderCategoryDropdown();
            ensureMobileMenuStructure(document.getElementById("main-menu"));
            initSeasonFlyout();
            initGlobalSmoothCarousels();
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
            initMobileMenu();
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
            initGlobalSmoothCarousels();
            loadGlobalData();
        }
    );
})();
