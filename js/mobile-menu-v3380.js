"use strict";

(function () {
    const VERSION = "3.46.0";
    const MOBILE_QUERY = "(max-width: 820px)";
    const DRAWER_ID = "mc-mobile-menu-panel";
    const BACKDROP_ID = "mc-mobile-menu-backdrop";
    const VIEW_MAIN = "main";
    const VIEW_CATEGORIES = "categories";
    const VIEW_SEASON = "season";

    let initialized = false;
    let panel = null;
    let backdrop = null;
    let activeView = VIEW_MAIN;
    let categoriesCache = null;

    function isMobile() {
        return window.matchMedia(MOBILE_QUERY).matches;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function categoryName(category) {
        return typeof category === "string"
            ? String(category).trim()
            : String(category?.nombre || category?.name || "").trim();
    }

    function categoryUrl(category) {
        const name = categoryName(category);
        return !name || name === "Todos"
            ? "catalogo.html"
            : `catalogo.html?categoria=${encodeURIComponent(name)}`;
    }

    function categoryIcon(category, fallback = "fa-solid fa-tag") {
        const icon = typeof category === "object" ? category?.icono : "";
        return icon || fallback;
    }

    function categoryCount(category) {
        try {
            const name = categoryName(category);
            const count = window.Products?.categoryCount?.(name);
            return Number.isFinite(count) ? count : null;
        } catch {
            return null;
        }
    }

    function countLabel(category) {
        const count = categoryCount(category);
        if (count === null) return "Ver productos";
        return `${count} producto${count === 1 ? "" : "s"}`;
    }

    function fallbackCategories() {
        const list = window.CONFIG?.CATEGORIES || ["Todos", "Librería", "Vasos", "Poleras", "Temporada"];
        return list
            .filter(Boolean)
            .map((nombre) => ({ nombre, mostrarMenu: true, activa: true }));
    }

    async function loadCategories() {
        if (categoriesCache) return categoriesCache;
        try {
            if (window.Categories?.loadCategories) {
                await window.Categories.loadCategories();
            }
            const source = window.Categories?.getMenuCategories?.() || fallbackCategories();
            categoriesCache = source.filter((category) => categoryName(category) && categoryName(category) !== "Todos");
        } catch (error) {
            console.warn("No fue posible preparar el menú móvil:", error);
            categoriesCache = fallbackCategories().filter((category) => categoryName(category) !== "Todos");
        }
        return categoriesCache;
    }

    function seasonCategories() {
        const source = window.CONFIG?.SEASON_CATEGORIES || [];
        return source.filter(Boolean).map((nombre) => ({ nombre, icono: "fa-solid fa-calendar-day" }));
    }

    function hasSubcategories(category) {
        const name = categoryName(category);
        if (name === "Temporada") return true;
        const children = category?.subcategorias || category?.subcategoriasActivas || category?.children || category?.hijos;
        return Array.isArray(children) && children.length > 0;
    }

    function subcategoriesFor(category) {
        const name = categoryName(category);
        if (name === "Temporada") return seasonCategories();
        const children = category?.subcategorias || category?.subcategoriasActivas || category?.children || category?.hijos || [];
        return children.map((child) => typeof child === "string" ? { nombre: child } : child).filter((child) => categoryName(child));
    }

    function rowHtml({ href = "#", label, helper = "", icon = "fa-solid fa-circle", arrow = false, action = "", target = "" }) {
        const tag = href && !action ? "a" : "button";
        const attrs = tag === "a"
            ? `href="${escapeHtml(href)}"`
            : `type="button" data-mobile-menu-action="${escapeHtml(action)}"${target ? ` data-mobile-menu-target="${escapeHtml(target)}"` : ""}`;
        return `
            <li>
                <${tag} class="mc-mobile-menu-row" ${attrs}>
                    <span class="mc-mobile-menu-row-icon" aria-hidden="true"><i class="${escapeHtml(icon)}"></i></span>
                    <span class="mc-mobile-menu-row-content">
                        <strong>${escapeHtml(label)}</strong>
                        ${helper ? `<small>${escapeHtml(helper)}</small>` : ""}
                    </span>
                    <i class="fa-solid ${arrow ? "fa-chevron-right" : "fa-arrow-right"} mc-mobile-menu-row-arrow" aria-hidden="true"></i>
                </${tag}>
            </li>`;
    }

    function renderMainView() {
        return `
            <section class="mc-mobile-menu-view is-active" data-mobile-menu-view="${VIEW_MAIN}" aria-label="Menú principal">
                <div class="mc-mobile-menu-hero">
                    <span class="mc-mobile-menu-hero-icon" aria-hidden="true"><i class="fa-solid fa-store"></i></span>
                    <span>
                        <strong>Mommy Crafts</strong>
                        <small>Productos personalizados, librería y regalos especiales.</small>
                    </span>
                </div>

                <p class="mc-mobile-menu-section-title">Navegación</p>
                <ul class="mc-mobile-menu-list">
                    ${rowHtml({ href: "index.html", label: "Inicio", helper: "Volver a la portada", icon: "fa-solid fa-house" })}
                    ${rowHtml({ href: "catalogo.html", label: "Todos los productos", helper: "Explora el catálogo completo", icon: "fa-solid fa-border-all" })}
                    ${rowHtml({ label: "Categorías", helper: "Ver secciones y subcategorías", icon: "fa-solid fa-layer-group", arrow: true, action: "view", target: VIEW_CATEGORIES })}
                    ${rowHtml({ label: "Personaliza tu producto", helper: "Cuéntanos tu idea y adjunta referencias", icon: "fa-solid fa-pen-ruler", action: "customize" })}
                </ul>
            </section>`;
    }

    function renderCategoriesView(categories) {
        const rows = categories.map((category) => {
            const name = categoryName(category);
            if (hasSubcategories(category)) {
                return rowHtml({
                    label: name,
                    helper: "Ver subcategorías",
                    icon: categoryIcon(category, "fa-solid fa-calendar-days"),
                    arrow: true,
                    action: "category-view",
                    target: name
                });
            }
            return rowHtml({
                href: categoryUrl(category),
                label: name,
                helper: countLabel(category),
                icon: categoryIcon(category)
            });
        }).join("");

        return `
            <section class="mc-mobile-menu-view" data-mobile-menu-view="${VIEW_CATEGORIES}" aria-label="Categorías">
                <div class="mc-mobile-menu-view-header">
                    <button class="mc-mobile-menu-back" type="button" data-mobile-menu-action="view" data-mobile-menu-target="${VIEW_MAIN}" aria-label="Volver al menú principal">
                        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
                    </button>
                    <span>
                        <strong>Categorías</strong>
                        <small>Elige una sección para seguir navegando.</small>
                    </span>
                </div>
                <ul class="mc-mobile-menu-list">
                    ${rowHtml({ href: "catalogo.html", label: "Ver todo", helper: "Todos los productos disponibles", icon: "fa-solid fa-border-all" })}
                    ${rows || rowHtml({ href: "catalogo.html", label: "Catálogo", helper: "Ver productos", icon: "fa-solid fa-store" })}
                </ul>
            </section>`;
    }

    function renderSubcategoryView(category) {
        const name = categoryName(category);
        const children = subcategoriesFor(category);
        const rows = children.map((child) => rowHtml({
            href: categoryUrl(child),
            label: categoryName(child),
            helper: countLabel(child),
            icon: categoryIcon(child, "fa-solid fa-tag")
        })).join("");

        return `
            <section class="mc-mobile-menu-view" data-mobile-menu-view="category-${escapeHtml(name)}" data-mobile-menu-category="${escapeHtml(name)}" aria-label="Subcategorías de ${escapeHtml(name)}">
                <div class="mc-mobile-menu-view-header">
                    <button class="mc-mobile-menu-back" type="button" data-mobile-menu-action="view" data-mobile-menu-target="${VIEW_CATEGORIES}" aria-label="Volver a categorías">
                        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
                    </button>
                    <span>
                        <strong>${escapeHtml(name)}</strong>
                        <small>Selecciona una subcategoría.</small>
                    </span>
                </div>
                <ul class="mc-mobile-menu-list">
                    ${rowHtml({ href: categoryUrl(category), label: `Ver todo ${name}`, helper: "Todos los productos de esta categoría", icon: categoryIcon(category, "fa-solid fa-layer-group") })}
                    ${rows}
                </ul>
            </section>`;
    }

    async function renderPanel() {
        const categories = await loadCategories();
        const subcategoryViews = categories
            .filter(hasSubcategories)
            .map(renderSubcategoryView)
            .join("");

        panel.innerHTML = `
            <header class="mc-mobile-menu-topbar">
                <span class="mc-mobile-menu-title">
                    <small>Menú</small>
                    <strong>Mommy Crafts</strong>
                </span>
                <button class="mc-mobile-menu-close" type="button" data-mobile-menu-action="close" aria-label="Cerrar menú">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            </header>
            <div class="mc-mobile-menu-content">
                ${renderMainView()}
                ${renderCategoriesView(categories)}
                ${subcategoryViews}
            </div>`;
    }

    function getButton() {
        return document.getElementById("mobile-menu-button");
    }

    function ensureShell() {
        backdrop = document.getElementById(BACKDROP_ID);
        panel = document.getElementById(DRAWER_ID);

        if (!backdrop) {
            backdrop = document.createElement("div");
            backdrop.id = BACKDROP_ID;
            backdrop.className = "mc-mobile-menu-backdrop";
            backdrop.setAttribute("data-mobile-menu-action", "close");
            document.body.appendChild(backdrop);
        }

        if (!panel) {
            panel = document.createElement("aside");
            panel.id = DRAWER_ID;
            panel.className = "mc-mobile-menu-panel";
            panel.setAttribute("aria-label", "Menú móvil");
            panel.setAttribute("aria-modal", "true");
            panel.setAttribute("role", "dialog");
            document.body.appendChild(panel);
        }
    }

    function setView(viewName) {
        activeView = viewName || VIEW_MAIN;
        panel.querySelectorAll(".mc-mobile-menu-view").forEach((view) => {
            const isActive = view.dataset.mobileMenuView === activeView || view.dataset.mobileMenuCategory === activeView;
            const isMain = view.dataset.mobileMenuView === VIEW_MAIN;
            view.classList.toggle("is-active", isActive);
            view.classList.toggle("is-parent", !isActive && !isMain);
        });
    }

    async function openMenu() {
        if (!isMobile()) return;
        ensureShell();
        await renderPanel();
        setView(VIEW_MAIN);
        document.documentElement.classList.add("mc-mobile-menu-active");
        document.body.classList.add("mc-mobile-menu-active");
        document.body.classList.remove("mobile-menu-open");
        document.getElementById("main-menu")?.classList.remove("is-open");
        const button = getButton();
        button?.setAttribute("aria-expanded", "true");
        button?.setAttribute("aria-label", "Cerrar menú");
        requestAnimationFrame(() => {
            backdrop.classList.add("is-open");
            panel.classList.add("is-open");
        });
        panel.querySelector(".mc-mobile-menu-close")?.focus({ preventScroll: true });
    }

    function closeMenu() {
        if (!panel || !backdrop) return;
        panel.classList.remove("is-open");
        backdrop.classList.remove("is-open");
        document.documentElement.classList.remove("mc-mobile-menu-active");
        document.body.classList.remove("mc-mobile-menu-active", "mobile-menu-open");
        document.getElementById("main-menu")?.classList.remove("is-open");
        const button = getButton();
        button?.setAttribute("aria-expanded", "false");
        button?.setAttribute("aria-label", "Abrir menú");
    }

    function bindDrawerEvents() {
        document.addEventListener("click", (event) => {
            const action = event.target.closest("[data-mobile-menu-action]");
            if (!action) return;

            const actionName = action.dataset.mobileMenuAction;
            if (actionName === "close") {
                event.preventDefault();
                closeMenu();
                return;
            }
            if (actionName === "view") {
                event.preventDefault();
                setView(action.dataset.mobileMenuTarget || VIEW_MAIN);
                return;
            }
            if (actionName === "category-view") {
                event.preventDefault();
                setView(action.dataset.mobileMenuTarget || VIEW_CATEGORIES);
                return;
            }
            if (actionName === "customize") {
                event.preventDefault();
                closeMenu();
                window.Customization?.open?.();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && document.body.classList.contains("mc-mobile-menu-active")) {
                closeMenu();
                getButton()?.focus();
            }
        });

        document.addEventListener("click", (event) => {
            if (!panel || !panel.contains(event.target)) return;
            const link = event.target.closest("a[href]");
            if (link && !link.target) closeMenu();
        });
    }

    function bindMenuButton() {
        const button = getButton();
        if (!button || button.dataset.mcProfessionalMenuBound === "true") return;
        button.dataset.mcProfessionalMenuBound = "true";

        button.addEventListener("click", (event) => {
            if (!isMobile()) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (document.body.classList.contains("mc-mobile-menu-active")) {
                closeMenu();
            } else {
                openMenu();
            }
        }, true);
    }

    async function init() {
        if (initialized) return;
        initialized = true;
        ensureShell();
        bindDrawerEvents();
        bindMenuButton();
        window.addEventListener("resize", () => {
            if (!isMobile()) closeMenu();
        });
        window.addEventListener("categories:updated", () => {
            categoriesCache = null;
        });
    }

    document.addEventListener("DOMContentLoaded", init);
})();
