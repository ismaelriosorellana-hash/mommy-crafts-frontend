"use strict";

(function () {
    const PAGE_BY_PATH = {
        "index.html": "home",
        "": "home",
        "catalogo.html": "catalog",
        "producto.html": "product",
        "carrito.html": "cart",
        "finalizar-compra.html": "checkout",
        "acceso.html": "access",
        "cuenta.html": "account",
        "pedido.html": "order",
        "pago.html": "payment-result",
        "quienes-somos.html": "about",
        "contacto.html": "contact",
        "despachos-retiros.html": "shipping",
        "preguntas-frecuentes.html": "faq",
        "cambios-pedidos.html": "changes",
        "privacidad.html": "privacy",
        "terminos.html": "terms",
        "seguridad.html": "security-page"
    };

    const CORE = {
        home: {
            root: "#main-content",
            defaultParent: "#main-content",
            sections: {
                hero: { selector: ".banner", title: "#hero-title", eyebrow: "#hero-eyebrow", button: "#hero-cta" },
                categories: { selector: "#categorias", title: "#categories-title", eyebrow: ".section-kicker" },
                trending: { selector: "#productos-destacados", title: "#trending-title", eyebrow: ".section-kicker", button: ".section-link" },
                "best-sellers": { selector: "#lo-mas-vendido", title: "#best-sellers-title", eyebrow: ".section-kicker", button: ".section-link" },
                new: { selector: ".new-section", title: "#new-title", eyebrow: ".section-kicker", button: ".section-link" },
                benefits: { selector: "#main-content > .main-content", title: "#benefits-title" }
            }
        },
        catalog: {
            root: "#main-content",
            defaultParent: "#main-content > .container",
            sections: {
                heading: { selector: ".catalog-heading", title: "#catalog-title", eyebrow: ".section-kicker", body: ".catalog-description" },
                toolbar: { selector: ".catalog-toolbar" },
                products: { selector: "section[aria-labelledby='catalog-grid-title']", title: "#catalog-grid-title" }
            }
        },
        product: {
            root: "#main-content",
            defaultParent: "#main-content > .container",
            sections: {
                detail: { selector: "#product-detail" },
                related: { selector: ".related-products", title: "#related-title" }
            }
        },
        cart: {
            root: "#main-content",
            defaultParent: "#main-content > .container",
            sections: {
                heading: { selector: ".cart-page-header", title: ".section-title", eyebrow: ".section-kicker", button: ".section-link" },
                "shipping-progress": { selector: ".free-shipping-progress" },
                products: { selector: ".cart-products", parent: ".cart-layout", title: "#cart-products-title" },
                summary: { selector: ".cart-summary-panel", parent: ".cart-layout", title: "#cart-summary-title", button: "#btn-open-checkout" },
                suggestions: { selector: "#cart-suggestions-section", title: "#cart-suggestions-title", eyebrow: ".section-kicker", button: ".section-link" }
            }
        },
        checkout: {
            root: "#main-content",
            defaultParent: "#checkout-content",
            zoneParents: { left: "#form-pedido", right: ".checkout-layout", main: "#checkout-content" },
            sections: {
                heading: { selector: ".checkout-heading", title: "h1", eyebrow: ".section-kicker", body: "p:last-child" },
                customer: { selector: "#form-pedido > .checkout-form-section:nth-of-type(1)", parent: "#form-pedido", title: ".checkout-section-title h2", body: ".checkout-section-title p" },
                delivery: { selector: "#form-pedido > .checkout-form-section:nth-of-type(2)", parent: "#form-pedido", title: ".checkout-section-title h2", body: ".checkout-section-title p" },
                payment: { selector: "#form-pedido > .checkout-form-section:nth-of-type(3)", parent: "#form-pedido", title: ".checkout-section-title h2", body: ".checkout-section-title p" },
                notes: { selector: "#form-pedido > .checkout-form-section:nth-of-type(4)", parent: "#form-pedido", title: ".checkout-section-title h2", body: ".checkout-section-title p" },
                summary: { selector: ".checkout-summary-panel", parent: ".checkout-layout", title: "#checkout-summary-title" }
            }
        },
        access: {
            root: "#main-content",
            defaultParent: "#main-content",
            sections: {
                auth: { selector: ".account-auth-card", title: "#login-panel h1, #login-panel h2", eyebrow: "#login-panel .section-kicker" },
                security: { selector: ".account-security-note" }
            }
        },
        account: {
            root: "#main-content",
            defaultParent: ".account-shell, #main-content",
            sections: {
                hero: { selector: ".account-hero", title: "#account-welcome", eyebrow: ".section-kicker" },
                profile: { selector: "#perfil", title: "h2" },
                security: { selector: "#seguridad-cuenta", title: "h2", eyebrow: ".section-kicker" },
                orders: { selector: "#pedidos", title: "h2", eyebrow: ".section-kicker" }
            }
        },
        order: {
            root: "#main-content",
            defaultParent: ".account-shell, #main-content",
            sections: {
                hero: { selector: ".account-hero", title: "#customer-order-title", eyebrow: ".section-kicker" },
                detail: { selector: "#customer-order-detail, .account-detail-card" }
            }
        },
        "payment-result": {
            root: "#main-content",
            defaultParent: "#main-content",
            sections: { result: { selector: "#payment-result, .payment-result" } }
        }
    };

    const CONTENT_IDS = new Set(["about", "contact", "shipping", "faq", "changes", "privacy", "terms", "security-page"]);
    const SHADOWS = {
        none: "none",
        soft: "0 14px 34px rgba(55, 42, 50, 0.10)",
        medium: "0 18px 42px rgba(55, 42, 50, 0.16)",
        strong: "0 24px 58px rgba(55, 42, 50, 0.24)"
    };

    function escapeText(value) {
        return String(value ?? "");
    }

    function currentPageId() {
        const file = location.pathname.split("/").pop() || "index.html";
        if (file === "pagina.html") {
            const slug = new URLSearchParams(location.search).get("slug") || "";
            return slug ? `custom-${slug.toLowerCase().replace(/[^a-z0-9-]/g, "")}` : "";
        }
        return document.body.dataset.page || PAGE_BY_PATH[file] || "";
    }

    function safeUrl(value) {
        const url = String(value || "").trim();
        if (/^(https:\/\/|mailto:|tel:|#[a-z0-9_-]*|\/[a-z0-9_./?&=#%-]*|(?:\.\.?\/)*[a-z0-9_/-]+\.html(?:[?#].*)?|pagina\.html\?slug=[a-z0-9-]+)$/i.test(url)) return url;
        return "";
    }

    function setMeta(page) {
        if (page.seoTitle) document.title = page.seoTitle;
        if (page.seoDescription) {
            let meta = document.querySelector('meta[name="description"]');
            if (!meta) {
                meta = document.createElement("meta");
                meta.name = "description";
                document.head.appendChild(meta);
            }
            meta.content = page.seoDescription;
        }
    }

    function applyComponents(components = {}) {
        const root = document.documentElement;
        root.style.setProperty("--studio-content-max-width", `${Number(components.contentMaxWidth) || 1320}px`);
        root.style.setProperty("--studio-button-radius", `${Number(components.buttonRadius) || 14}px`);
        root.style.setProperty("--studio-button-height", `${Number(components.buttonHeight) || 48}px`);
        root.style.setProperty("--studio-button-font-size", `${Number(components.buttonFontSize) || 15}px`);
        root.style.setProperty("--studio-card-radius", `${Number(components.cardRadius) || 20}px`);
        root.style.setProperty("--studio-card-shadow", SHADOWS[components.cardShadow] || SHADOWS.soft);
        root.style.setProperty("--studio-modal-max-width", `${Number(components.modalMaxWidth) || 1120}px`);
        root.style.setProperty("--studio-modal-radius", `${Number(components.modalRadius) || 24}px`);
        root.style.setProperty("--studio-modal-overlay", `rgba(20, 15, 18, ${Number(components.modalOverlayOpacity) || 0.62})`);
        root.style.setProperty("--studio-heading-scale", Number(components.headingScale) || 1);
        root.style.setProperty("--studio-body-scale", Number(components.bodyScale) || 1);
        document.querySelector(".site-header")?.classList.toggle("studio-header-sticky", Boolean(components.headerSticky));
    }



    function normalizeNavigationItems(items = []) {
        const normalized = Array.isArray(items)
            ? items.filter((item) => item && item.enabled !== false).map((item, index) => ({ ...item, order: Number(item.order ?? ((index + 1) * 10)) }))
            : [];

        const hasKind = (kind) => normalized.some((item) => item.kind === kind);
        const hasUrl = (url) => normalized.some((item) => String(item.url || "").includes(url));

        if (!normalized.length || !hasUrl("index.html")) {
            normalized.unshift({ kind: "link", label: "Inicio", url: "index.html", order: 10, enabled: true });
        }

        if (!hasUrl("catalogo.html")) {
            normalized.splice(Math.min(1, normalized.length), 0, { kind: "link", label: "Todos", url: "catalogo.html", order: 20, enabled: true });
        }

        if (!hasKind("categories")) {
            normalized.splice(Math.min(2, normalized.length), 0, { kind: "categories", label: "Categorías", url: "catalogo.html", order: 30, enabled: true });
        }

        const hasHowToBuy = normalized.some((item) => {
            const url = String(item.url || "").toLowerCase();
            const label = String(item.label || "").toLowerCase();
            return url.includes("como-comprar.html") || label.includes("cómo comprar") || label.includes("como comprar");
        });

        if (!hasHowToBuy) {
            const insertIndex = Math.min(3, normalized.length);
            normalized.splice(insertIndex, 0, { kind: "link", label: "Cómo comprar", url: "como-comprar.html", order: 35, enabled: true });
        }

        if (!hasKind("customization")) {
            normalized.push({ kind: "customization", label: "Personaliza tu producto", url: "#", order: 90, enabled: true });
        }

        return normalized
            .filter((item, index, list) => {
                if (item.kind === "categories") return list.findIndex((other) => other.kind === "categories") === index;
                if (item.kind === "customization") return list.findIndex((other) => other.kind === "customization") === index;
                return true;
            })
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    }

    function applyNavigation(navigation = {}) {
        const menu = document.getElementById("main-menu");
        if (!Array.isArray(navigation.items)) return;
        const items = normalizeNavigationItems(navigation.items);
        document.querySelectorAll(".content-site-nav").forEach((nav) => {
            nav.replaceChildren();
            items.filter((item) => item.kind === "link").slice(0, 6).forEach((item) => {
                const link = document.createElement("a");
                link.href = safeUrl(item.url) || "index.html";
                link.textContent = item.label;
                nav.appendChild(link);
            });
        });
        if (!menu) return;
        menu.replaceChildren();

        for (const item of items) {
            const li = document.createElement("li");
            if (item.kind === "categories") {
                li.className = "has-dropdown";
                const link = document.createElement("a");
                link.href = safeUrl(item.url) || "catalogo.html";
                link.setAttribute("aria-haspopup", "true");
                link.append(document.createTextNode(`${item.label} `));
                const icon = document.createElement("i");
                icon.className = "fa-solid fa-chevron-down";
                icon.setAttribute("aria-hidden", "true");
                link.appendChild(icon);
                const dropdown = document.createElement("ul");
                dropdown.className = "dropdown categories-dropdown";
                dropdown.id = "categories-dropdown";
                const loading = document.createElement("li");
                loading.className = "dropdown-loading";
                loading.textContent = "Cargando categorías...";
                dropdown.appendChild(loading);
                li.append(link, dropdown);
            } else {
                const link = document.createElement("a");
                link.href = safeUrl(item.url) || "#";
                link.textContent = item.label;
                if (item.kind === "customization") link.dataset.openCustomization = "";
                if (item.openNewTab && /^https:\/\//i.test(link.href)) {
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                }
                li.appendChild(link);
            }
            menu.appendChild(li);
        }
        document.dispatchEvent(new CustomEvent("studio:navigation-applied"));
    }

    function applyFooter(footer = {}) {
        const elements = [...document.querySelectorAll(".footer, .content-footer, .legal-footer, .account-footer")];
        if (!elements.length) return;
        for (const element of elements) {
            element.hidden = footer.enabled === false;
            if (element.hidden) continue;

            const links = Array.isArray(footer.links)
                ? footer.links.filter((item) => item.enabled !== false).sort((a, b) => Number(a.order) - Number(b.order))
                : [];
            const info = element.querySelector(".information ul");
            if (info) {
                info.replaceChildren();
                links.forEach((item) => {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.href = safeUrl(item.url) || "#";
                    a.textContent = item.label;
                    li.appendChild(a);
                    info.appendChild(li);
                });
            } else {
                const nav = element.querySelector("nav");
                if (nav && links.length) {
                    nav.replaceChildren();
                    links.forEach((item) => {
                        const a = document.createElement("a");
                        a.href = safeUrl(item.url) || "#";
                        a.textContent = item.label;
                        nav.appendChild(a);
                    });
                }
            }
            const newsletter = element.querySelector(".newsletter");
            if (newsletter) newsletter.hidden = footer.showNewsletter === false;
            const copyright = element.querySelector(".copyright p");
            if (copyright && footer.copyright) copyright.textContent = `${footer.copyright} ${new Date().getFullYear()}`;
        }
    }

    function styleSection(element, section) {
        if (!element) return;
        element.hidden = section.enabled === false;
        element.dataset.studioSection = section.id;
        element.dataset.studioAlign = section.alignment || "left";
        element.style.textAlign = section.alignment || "left";
        element.style.setProperty("--studio-block-align", section.alignment || "left");
        if (section.backgroundColor) element.style.backgroundColor = section.backgroundColor;
        if (section.textColor) element.style.color = section.textColor;
        if (Number(section.paddingY) > 0) {
            element.style.paddingTop = `${section.paddingY}px`;
            element.style.paddingBottom = `${section.paddingY}px`;
        }
        if (Number(section.borderRadius) > 0) element.style.borderRadius = `${section.borderRadius}px`;
        if (section.anchor) element.id = section.anchor;
    }

    function updateCoreFields(element, definition, section) {
        const setText = (selector, value) => {
            if (!selector || value === undefined || value === null || value === "") return;
            const target = element.matches(selector) ? element : element.querySelector(selector);
            if (target) target.textContent = value;
        };
        setText(definition.title, section.title);
        setText(definition.eyebrow, section.eyebrow);
        setText(definition.body, section.body);
        if (definition.button) {
            const button = element.matches(definition.button) ? element : element.querySelector(definition.button);
            if (button) {
                if (section.buttonLabel) button.textContent = section.buttonLabel;
                const url = safeUrl(section.buttonUrl);
                if (url) button.setAttribute("href", url);
                button.hidden = !section.buttonLabel && section.type === "core" ? button.hidden : false;
            }
        }
        styleSection(element, section);
    }

    function resolveParent(map, definition, section) {
        const selector = definition?.parent || map?.zoneParents?.[section.zone] || map?.defaultParent || map?.root;
        return selector ? document.querySelector(selector) : null;
    }

    function reorderCoreSections(page, map) {
        const byParent = new Map();
        for (const section of page.sections.filter((item) => item.type === "core")) {
            const definition = map.sections?.[section.id];
            if (!definition) continue;
            const element = document.querySelector(definition.selector);
            if (!element) continue;
            updateCoreFields(element, definition, section);
            const parent = resolveParent(map, definition, section);
            if (!parent || element.parentElement !== parent) continue;
            if (!byParent.has(parent)) byParent.set(parent, []);
            byParent.get(parent).push({ element, order: Number(section.order) || 0 });
        }
        for (const [parent, entries] of byParent) {
            const desired = entries.sort((a, b) => a.order - b.order).map((entry) => entry.element);
            const desiredSet = new Set(desired);
            const current = [...parent.children].filter((element) => desiredSet.has(element));
            const unchanged = current.length === desired.length && current.every((element, index) => element === desired[index]);
            if (unchanged) continue;
            const first = [...parent.children].find((element) => desiredSet.has(element));
            const marker = document.createComment("studio-section-order");
            if (first) parent.insertBefore(marker, first);
            else parent.appendChild(marker);
            desired.forEach((element) => parent.insertBefore(element, marker));
            marker.remove();
        }
    }

    function makeButton(data) {
        const url = safeUrl(data.url || data.buttonUrl);
        const label = data.label || data.buttonLabel;
        if (!url || !label) return null;
        const a = document.createElement("a");
        a.href = url;
        a.className = data.style === "secondary" ? "btn-secondary" : data.style === "link" ? "section-link" : "btn-primary";
        a.textContent = label;
        if (data.openNewTab && /^https:\/\//i.test(url)) {
            a.target = "_blank";
            a.rel = "noopener noreferrer";
        }
        return a;
    }

    function baseBlock(section) {
        const block = document.createElement("section");
        block.className = `studio-block studio-${section.type}`;
        block.dataset.align = section.alignment || "left";
        block.style.setProperty("--studio-block-align", section.alignment || "left");
        block.style.setProperty("--studio-block-padding-y", `${Number(section.paddingY) || 36}px`);
        if (section.backgroundColor) block.style.setProperty("--studio-block-background", section.backgroundColor);
        if (section.textColor) block.style.setProperty("--studio-block-text", section.textColor);
        if (Number(section.borderRadius) >= 0) block.style.borderRadius = `${Number(section.borderRadius) || 0}px`;
        if (section.anchor) block.id = section.anchor;
        if (!section.backgroundColor && ["richText", "spacer", "divider"].includes(section.type)) block.classList.add("is-plain");
        return block;
    }

    function addCopy(container, section) {
        if (section.eyebrow) {
            const p = document.createElement("p");
            p.className = "studio-block-kicker";
            p.textContent = section.eyebrow;
            container.appendChild(p);
        }
        if (section.title) {
            const h2 = document.createElement("h2");
            h2.textContent = section.title;
            container.appendChild(h2);
        }
        if (section.body) {
            const p = document.createElement("p");
            p.className = "studio-block-body";
            p.textContent = section.body;
            container.appendChild(p);
        }
        const buttons = Array.isArray(section.buttons) && section.buttons.length
            ? section.buttons
            : section.buttonLabel ? [{ label: section.buttonLabel, url: section.buttonUrl, style: "primary" }] : [];
        if (buttons.length) {
            const actions = document.createElement("div");
            actions.className = "studio-block-actions";
            buttons.forEach((item) => {
                const button = makeButton(item);
                if (button) actions.appendChild(button);
            });
            if (actions.children.length) container.appendChild(actions);
        }
    }

    function productImage(product) {
        const first = Array.isArray(product.imagenes) ? product.imagenes[0] : product.imagen;
        return typeof first === "string" ? first : first?.url || window.CONFIG?.placeholderImage || "";
    }

    function money(value) {
        return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(value) || 0);
    }

    async function populateProductGrid(container, section) {
        try {
            let products = await window.API.obtenerProductos({
                limite: 100
            });
            if (section.productMode === "featured") products = products.filter((product) => product.destacado);
            if (section.productMode === "new") products = products.filter((product) => String(product.insignia || "").toLowerCase().includes("nuevo"));
            if (section.productMode === "category" && section.productCategory) products = products.filter((product) => String(product.categoria || product.categorias || "").includes(section.productCategory));
            if (section.productMode === "manual" && section.productIds?.length) {
                const ids = new Set(section.productIds.map(String));
                products = products.filter((product) => ids.has(String(product._id || product.id)));
            }
            if (section.productMode === "best-sellers") products = [...products].sort((a, b) => Number(b.ventas || 0) - Number(a.ventas || 0));
            products.slice(0, Number(section.itemLimit) || 4).forEach((product) => {
                const a = document.createElement("a");
                a.className = "studio-product-card";
                a.href = window.ProductLinks.detail(product);
                const img = document.createElement("img");
                img.src = productImage(product);
                img.alt = product.nombre || "Producto";
                img.loading = "lazy";
                const strong = document.createElement("strong");
                strong.textContent = product.nombre || "Producto";
                const price = document.createElement("span");
                price.textContent = money(product.precio);
                a.append(img, strong, price);
                container.appendChild(a);
            });
        } catch (error) {
            const p = document.createElement("p");
            p.textContent = "No fue posible cargar los productos de esta sección.";
            container.appendChild(p);
        }
    }

    function renderCustomSection(section) {
        const block = baseBlock(section);
        if (section.type === "spacer") {
            block.style.setProperty("--studio-spacer-height", `${Math.max(10, Number(section.paddingY) || 40)}px`);
            return block;
        }
        if (section.type === "divider") return block;

        if (section.type === "imageText") {
            const grid = document.createElement("div");
            grid.className = `studio-image-text image-${section.imagePosition || "right"}`;
            const copy = document.createElement("div");
            addCopy(copy, section);
            const media = document.createElement("div");
            media.className = "studio-block-media";
            if (section.imageUrl) {
                const img = document.createElement("img");
                img.src = section.imageUrl;
                img.alt = section.imageAlt || section.title || "";
                img.loading = "lazy";
                media.appendChild(img);
            }
            grid.append(copy, media);
            block.appendChild(grid);
            return block;
        }

        if (section.type === "hero" && section.imageUrl && section.imagePosition === "background") {
            block.classList.add("has-background-image");
            block.style.backgroundImage = `url("${section.imageUrl.replaceAll('"', "%22")}")`;
        }

        addCopy(block, section);

        if (section.type === "categoryLinks") {
            const grid = document.createElement("div");
            grid.className = "studio-category-links";
            (section.categoryItems || []).forEach((item) => {
                const a = document.createElement("a");
                a.className = "studio-category-card";
                a.href = safeUrl(item.url) || "catalogo.html";
                if (item.imageUrl) {
                    const img = document.createElement("img");
                    img.src = item.imageUrl;
                    img.alt = item.label;
                    img.loading = "lazy";
                    a.appendChild(img);
                }
                const strong = document.createElement("strong");
                strong.textContent = item.label;
                a.appendChild(strong);
                grid.appendChild(a);
            });
            block.appendChild(grid);
        }

        if (section.type === "productGrid") {
            const grid = document.createElement("div");
            grid.className = "studio-product-grid";
            block.appendChild(grid);
            populateProductGrid(grid, section);
        }
        return block;
    }

    function customContainer(root, placement, page) {
        let container = root.querySelector(`:scope > .studio-custom-sections.${placement}`);
        if (!container) {
            container = document.createElement("div");
            container.className = `studio-custom-sections ${placement}`;
            container.style.setProperty("--studio-page-max-width", `${Number(page.layout?.maxWidth) || 1320}px`);
            container.style.setProperty("--studio-page-padding", `${Number(page.layout?.contentPadding) || 20}px`);
            container.style.setProperty("--studio-page-section-gap", `${Number(page.layout?.sectionGap) || 40}px`);
            if (placement === "before") root.prepend(container);
            else root.appendChild(container);
        }
        return container;
    }

    function renderCustomSections(page, map) {
        const root = document.querySelector(map?.root || "#main-content") || document.querySelector("main");
        if (!root) return;
        const custom = page.sections.filter((section) => section.type !== "core" && section.enabled !== false).sort((a, b) => Number(a.order) - Number(b.order));
        if (!custom.length) return;
        const before = customContainer(root, "before", page);
        const after = customContainer(root, "after", page);
        for (const section of custom) {
            const block = renderCustomSection(section);
            if (section.zone === "before") before.appendChild(block);
            else if (section.zone === "left" && map?.zoneParents?.left) document.querySelector(map.zoneParents.left)?.appendChild(block);
            else if (section.zone === "right" && map?.zoneParents?.right) document.querySelector(map.zoneParents.right)?.appendChild(block);
            else after.appendChild(block);
        }
        if (!before.children.length) before.remove();
        if (!after.children.length) after.remove();
    }

    function applyPageLayout(page, map) {
        const root = document.querySelector(map?.root || "#main-content") || document.querySelector("main");
        if (!root) return;
        root.dataset.studioPageRoot = page.id;
        root.style.setProperty("--studio-page-background", page.layout?.backgroundColor || "transparent");
        root.style.setProperty("--studio-page-max-width", `${Number(page.layout?.maxWidth) || 1320}px`);
        root.style.setProperty("--studio-page-padding", `${Number(page.layout?.contentPadding) || 20}px`);
        root.style.setProperty("--studio-page-section-gap", `${Number(page.layout?.sectionGap) || 40}px`);
        root.style.backgroundColor = page.layout?.backgroundColor || "";
        root.querySelectorAll(":scope > .container, :scope > .checkout-shell").forEach((container) => {
            container.style.maxWidth = `${Number(page.layout?.maxWidth) || 1320}px`;
            container.style.paddingLeft = `${Number(page.layout?.contentPadding) || 20}px`;
            container.style.paddingRight = `${Number(page.layout?.contentPadding) || 20}px`;
        });
    }

    function disabledPage(page) {
        const main = document.querySelector("main");
        if (!main) return;
        main.replaceChildren();
        const section = document.createElement("section");
        section.className = "studio-page-disabled";
        const h1 = document.createElement("h1");
        h1.textContent = "Página temporalmente no disponible";
        const p = document.createElement("p");
        p.textContent = `${page.label || "Esta página"} está oculta desde el panel de administración.`;
        const a = document.createElement("a");
        a.href = "index.html";
        a.className = "btn-primary";
        a.textContent = "Volver al inicio";
        section.append(h1, p, a);
        main.appendChild(section);
    }

    function contentPageMap() {
        return {
            root: "#main-content",
            defaultParent: ".content-shell, .legal-shell, #main-content",
            sections: { content: { selector: "#main-content > section, #main-content .content-hero, #main-content .legal-hero, #main-content > .content-shell, #main-content > .legal-shell" } }
        };
    }

    async function load() {
        try {
            const studio = await window.API.request("/estudio-sitio", { timeoutMs: 30000 });
            window.SiteStudioConfig = studio;
            applyComponents(studio.components || {});
            applyNavigation(studio.navigation || {});
            applyFooter(studio.footer || {});

            const pageId = currentPageId();
            const page = (studio.pages || []).find((item) => item.id === pageId);
            if (!page) return;
            setMeta(page);
            if (page.enabled === false) {
                disabledPage(page);
                return;
            }
            const map = CORE[pageId] || (CONTENT_IDS.has(pageId) ? contentPageMap() : { root: "#main-content", defaultParent: "#main-content", sections: {} });
            applyPageLayout(page, map);
            reorderCoreSections(page, map);
            renderCustomSections(page, map);
            document.dispatchEvent(new CustomEvent("site:studio-applied", { detail: { studio, page } }));
        } catch (error) {
            console.warn("No fue posible cargar el editor del sitio:", error);
        }
    }

    window.SiteStudio = Object.freeze({ load });
    document.addEventListener("DOMContentLoaded", load, { once: true });
})();
