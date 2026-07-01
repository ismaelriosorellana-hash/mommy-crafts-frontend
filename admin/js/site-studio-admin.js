"use strict";

(function () {
    const state = { studio: null, currentPageId: "" };
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    function escapeHtml(value) {
        return window.AdminUI.escapeHtml(value);
    }

    function message(text, type = "success") {
        const element = $("#studio-message");
        element.hidden = false;
        element.className = `admin-message ${type}`;
        element.textContent = text;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function number(value, fallback = 0) {
        const result = Number(value);
        return Number.isFinite(result) ? result : fallback;
    }

    function currentPage() {
        return state.studio?.pages?.find((page) => page.id === state.currentPageId) || null;
    }

    function sortByOrder(items) {
        return [...items].sort((a, b) => number(a.order) - number(b.order));
    }

    function sectionTemplate(section, index) {
        const custom = section.type !== "core";
        const buttonsText = (section.buttons || []).map((item) => `${item.label}|${item.url}|${item.style || "primary"}`).join("\n");
        const categoriesText = (section.categoryItems || []).map((item) => `${item.label}|${item.url}|${item.imageUrl || ""}`).join("\n");
        return `
            <article class="studio-section-card is-collapsed" data-section-index="${index}">
                <div class="studio-section-header">
                    <div class="studio-section-header-main">
                        <button type="button" class="admin-icon-button" data-section-toggle aria-label="Abrir o cerrar"><i class="fa-solid fa-chevron-down"></i></button>
                        <div>
                            <strong data-section-heading>${escapeHtml(section.title || section.id)}</strong>
                            <span class="studio-section-badge">${custom ? escapeHtml(section.type) : "Sección del sistema"}</span>
                        </div>
                    </div>
                    <div class="studio-card-actions">
                        <button type="button" data-move-up title="Subir"><i class="fa-solid fa-arrow-up"></i></button>
                        <button type="button" data-move-down title="Bajar"><i class="fa-solid fa-arrow-down"></i></button>
                        ${custom ? '<button type="button" class="danger" data-remove-section title="Eliminar"><i class="fa-solid fa-trash"></i></button>' : ""}
                    </div>
                </div>
                <div class="studio-section-body">
                    <input type="hidden" data-field="id" value="${escapeHtml(section.id)}">
                    <input type="hidden" data-field="type" value="${escapeHtml(section.type)}">
                    <label class="studio-inline-check studio-field-wide"><input type="checkbox" data-field="enabled" ${section.enabled !== false ? "checked" : ""}> <span>Mostrar sección</span></label>
                    <label class="admin-field"><span>Orden</span><input type="number" min="0" max="9999" data-field="order" value="${number(section.order, (index + 1) * 10)}"></label>
                    <label class="admin-field"><span>Zona</span><select data-field="zone">
                        ${["main", "before", "after", "left", "right"].map((value) => `<option value="${value}" ${section.zone === value ? "selected" : ""}>${value}</option>`).join("")}
                    </select></label>
                    <label class="admin-field"><span>Antetítulo</span><input maxlength="160" data-field="eyebrow" value="${escapeHtml(section.eyebrow || "")}"></label>
                    <label class="admin-field"><span>Título</span><input maxlength="260" data-field="title" value="${escapeHtml(section.title || "")}"></label>
                    <label class="admin-field studio-field-wide"><span>Texto</span><textarea rows="4" maxlength="12000" data-field="body">${escapeHtml(section.body || "")}</textarea></label>
                    <label class="admin-field"><span>Texto del botón</span><input maxlength="120" data-field="buttonLabel" value="${escapeHtml(section.buttonLabel || "")}"></label>
                    <label class="admin-field"><span>Destino del botón</span><input maxlength="1000" data-field="buttonUrl" value="${escapeHtml(section.buttonUrl || "")}" placeholder="catalogo.html o https://..."></label>
                    <label class="admin-field"><span>Alineación</span><select data-field="alignment">${["left", "center", "right"].map((value) => `<option value="${value}" ${section.alignment === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>
                    <div class="admin-field"><span>Fondo</span><input type="color" data-field="backgroundColor" value="${escapeHtml(section.backgroundColor || "#FFFFFF")}"><label class="studio-inline-check"><input type="checkbox" data-field="backgroundEnabled" ${section.backgroundColor ? "checked" : ""}> Aplicar fondo</label></div>
                    <div class="admin-field"><span>Color del texto</span><input type="color" data-field="textColor" value="${escapeHtml(section.textColor || "#372A32")}"><label class="studio-inline-check"><input type="checkbox" data-field="textColorEnabled" ${section.textColor ? "checked" : ""}> Aplicar color</label></div>
                    <label class="admin-field"><span>Espaciado vertical</span><input type="number" min="0" max="180" data-field="paddingY" value="${number(section.paddingY)}"></label>
                    <label class="admin-field"><span>Borde redondeado</span><input type="number" min="0" max="80" data-field="borderRadius" value="${number(section.borderRadius)}"></label>
                    <label class="admin-field"><span>Ancla</span><input maxlength="80" data-field="anchor" value="${escapeHtml(section.anchor || "")}" placeholder="ej.: ofertas"></label>
                    ${custom ? `
                    <label class="admin-field"><span>Imagen (URL https)</span><input maxlength="1000" data-field="imageUrl" value="${escapeHtml(section.imageUrl || "")}"></label>
                    <div class="admin-field"><span>Cargar imagen</span><input type="file" accept="image/jpeg,image/png,image/webp" data-section-image><button class="admin-button secondary small" type="button" data-upload-section-image>Subir</button></div>
                    <label class="admin-field"><span>Texto alternativo</span><input maxlength="260" data-field="imageAlt" value="${escapeHtml(section.imageAlt || "")}"></label>
                    <label class="admin-field"><span>Posición de imagen</span><select data-field="imagePosition">${["left", "right", "top", "background"].map((value) => `<option value="${value}" ${section.imagePosition === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>
                    <label class="admin-field studio-field-wide"><span>Botones adicionales, uno por línea: texto|ruta|primary</span><textarea rows="3" data-field="buttonsText">${escapeHtml(buttonsText)}</textarea></label>
                    ${section.type === "productGrid" ? `
                    <label class="admin-field"><span>Origen de productos</span><select data-field="productMode">${["featured", "new", "best-sellers", "category", "manual"].map((value) => `<option value="${value}" ${section.productMode === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>
                    <label class="admin-field"><span>Categoría</span><input data-field="productCategory" value="${escapeHtml(section.productCategory || "")}"></label>
                    <label class="admin-field"><span>Cantidad</span><input type="number" min="1" max="24" data-field="itemLimit" value="${number(section.itemLimit, 4)}"></label>
                    <label class="admin-field studio-field-wide"><span>ID de productos manuales, uno por línea</span><textarea rows="3" data-field="productIdsText">${escapeHtml((section.productIds || []).join("\n"))}</textarea></label>` : ""}
                    ${section.type === "categoryLinks" ? `<label class="admin-field studio-field-wide"><span>Categorías, una por línea: nombre|ruta|imagen</span><textarea rows="5" data-field="categoriesText">${escapeHtml(categoriesText)}</textarea></label>` : ""}
                    ` : ""}
                </div>
            </article>
        `;
    }

    function renderSections(page) {
        const container = $("#studio-sections-list");
        const sections = sortByOrder(page.sections || []);
        page.sections = sections;
        container.innerHTML = sections.length
            ? sections.map(sectionTemplate).join("")
            : '<div class="studio-empty">Esta página todavía no tiene bloques.</div>';
    }

    function populatePageSelect() {
        const select = $("#studio-page-select");
        const previous = state.currentPageId;
        select.innerHTML = state.studio.pages.map((page) => `<option value="${escapeHtml(page.id)}">${page.type === "custom" ? "Personalizada · " : ""}${escapeHtml(page.label)}</option>`).join("");
        state.currentPageId = state.studio.pages.some((page) => page.id === previous) ? previous : state.studio.pages[0]?.id || "";
        select.value = state.currentPageId;
    }

    function renderPage() {
        const page = currentPage();
        if (!page) return;
        $("#studio-page-label").value = page.label || "";
        $("#studio-page-path").value = page.path || "";
        $("#studio-page-seo-title").value = page.seoTitle || "";
        $("#studio-page-seo-description").value = page.seoDescription || "";
        $("#studio-page-max-width").value = number(page.layout?.maxWidth, 1320);
        $("#studio-page-padding").value = number(page.layout?.contentPadding, 20);
        $("#studio-page-gap").value = number(page.layout?.sectionGap, 40);
        $("#studio-page-background").value = page.layout?.backgroundColor || "#FFF9FD";
        $("#studio-page-enabled").checked = page.enabled !== false;
        $("#studio-delete-page").hidden = page.type !== "custom";
        renderSections(page);
    }

    function parseButtons(text) {
        return String(text || "").split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 4).map((line) => {
            const [label, url, style = "primary"] = line.split("|").map((part) => part.trim());
            return { label, url, style, openNewTab: /^https:\/\//i.test(url) };
        }).filter((item) => item.label && item.url);
    }

    function parseCategories(text) {
        return String(text || "").split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 20).map((line) => {
            const [label, url, imageUrl = ""] = line.split("|").map((part) => part.trim());
            return { label, url, imageUrl };
        }).filter((item) => item.label && item.url);
    }

    function collectSections() {
        return $$(".studio-section-card", $("#studio-sections-list")).map((card, index) => {
            const get = (field) => card.querySelector(`[data-field="${field}"]`);
            const type = get("type").value;
            const section = {
                id: get("id").value,
                type,
                enabled: get("enabled").checked,
                order: number(get("order").value, (index + 1) * 10),
                zone: get("zone").value,
                eyebrow: get("eyebrow").value,
                title: get("title").value,
                body: get("body").value,
                buttonLabel: get("buttonLabel").value,
                buttonUrl: get("buttonUrl").value,
                alignment: get("alignment").value,
                backgroundColor: get("backgroundEnabled").checked ? get("backgroundColor").value : "",
                textColor: get("textColorEnabled").checked ? get("textColor").value : "",
                paddingY: number(get("paddingY").value),
                borderRadius: number(get("borderRadius").value),
                anchor: get("anchor").value
            };
            if (type !== "core") {
                section.imageUrl = get("imageUrl")?.value || "";
                section.imageAlt = get("imageAlt")?.value || "";
                section.imagePosition = get("imagePosition")?.value || "right";
                section.buttons = parseButtons(get("buttonsText")?.value);
                section.productMode = get("productMode")?.value || "featured";
                section.productCategory = get("productCategory")?.value || "";
                section.itemLimit = number(get("itemLimit")?.value, 4);
                section.productIds = String(get("productIdsText")?.value || "").split("\n").map((value) => value.trim()).filter(Boolean);
                section.categoryItems = parseCategories(get("categoriesText")?.value);
            }
            return section;
        });
    }

    function collectCurrentPage() {
        const page = currentPage();
        if (!page) return;
        page.label = $("#studio-page-label").value.trim();
        page.seoTitle = $("#studio-page-seo-title").value.trim();
        page.seoDescription = $("#studio-page-seo-description").value.trim();
        page.enabled = $("#studio-page-enabled").checked;
        page.layout = {
            maxWidth: number($("#studio-page-max-width").value, 1320),
            contentPadding: number($("#studio-page-padding").value, 20),
            sectionGap: number($("#studio-page-gap").value, 40),
            backgroundColor: $("#studio-page-background").value
        };
        page.sections = collectSections();
    }

    function moveCard(card, direction) {
        const sibling = direction < 0 ? card.previousElementSibling : card.nextElementSibling;
        if (!sibling) return;
        if (direction < 0) card.parentElement.insertBefore(card, sibling);
        else card.parentElement.insertBefore(sibling, card);
        $$(".studio-section-card", card.parentElement).forEach((item, index) => {
            item.querySelector('[data-field="order"]').value = (index + 1) * 10;
        });
    }

    function newSection(type) {
        const stamp = Date.now().toString(36);
        return {
            id: `section-${stamp}`,
            type,
            zone: "after",
            enabled: true,
            order: ((currentPage()?.sections?.length || 0) + 1) * 10,
            eyebrow: "",
            title: type === "spacer" || type === "divider" ? "" : "Nueva sección",
            body: "",
            imageUrl: "",
            imageAlt: "",
            buttonLabel: "",
            buttonUrl: "",
            buttons: [],
            alignment: "left",
            imagePosition: "right",
            backgroundColor: "#FFFFFF",
            textColor: "#372A32",
            paddingY: type === "spacer" ? 40 : 36,
            borderRadius: 20,
            anchor: "",
            productMode: "featured",
            productCategory: "",
            productIds: [],
            itemLimit: 4,
            categoryItems: []
        };
    }

    function switchPage(id) {
        collectCurrentPage();
        state.currentPageId = id;
        renderPage();
    }

    function repeatCard(type, item, index) {
        const fields = type === "admin"
            ? `
                <label class="admin-field"><span>Nombre</span><input data-repeat-field="label" value="${escapeHtml(item.label || "")}"></label>
                <label class="admin-field"><span>Ruta</span><input data-repeat-field="href" value="${escapeHtml(item.href || "")}" ${item.custom ? "" : "readonly"}></label>
                <label class="admin-field"><span>Icono Font Awesome</span><input data-repeat-field="icon" value="${escapeHtml(item.icon || "fa-link")}"></label>
                <input type="hidden" data-repeat-field="id" value="${escapeHtml(item.id)}"><input type="hidden" data-repeat-field="custom" value="${item.custom ? "true" : "false"}">`
            : type === "nav"
                ? `
                <label class="admin-field"><span>Texto</span><input data-repeat-field="label" value="${escapeHtml(item.label || "")}"></label>
                <label class="admin-field"><span>Destino</span><input data-repeat-field="url" value="${escapeHtml(item.url || "")}"></label>
                <label class="admin-field"><span>Tipo</span><select data-repeat-field="kind">${["link", "categories", "customization"].map((value) => `<option value="${value}" ${item.kind === value ? "selected" : ""}>${value}</option>`).join("")}</select></label>
                <input type="hidden" data-repeat-field="id" value="${escapeHtml(item.id)}">`
                : `
                <label class="admin-field"><span>Texto</span><input data-repeat-field="label" value="${escapeHtml(item.label || "")}"></label>
                <label class="admin-field"><span>Destino</span><input data-repeat-field="url" value="${escapeHtml(item.url || "")}"></label>`;
        return `
            <article class="studio-repeat-card" data-repeat-type="${type}">
                <div class="studio-repeat-header"><strong>${escapeHtml(item.label || `Elemento ${index + 1}`)}</strong><div class="studio-card-actions"><button type="button" data-repeat-up><i class="fa-solid fa-arrow-up"></i></button><button type="button" data-repeat-down><i class="fa-solid fa-arrow-down"></i></button>${item.custom || type !== "admin" ? '<button type="button" class="danger" data-repeat-remove><i class="fa-solid fa-trash"></i></button>' : ""}</div></div>
                <div class="studio-repeat-body">
                    ${fields}
                    <label class="admin-field"><span>Orden</span><input type="number" data-repeat-field="order" value="${number(item.order, (index + 1) * 10)}"></label>
                    <label class="studio-inline-check"><input type="checkbox" data-repeat-field="enabled" ${item.enabled !== false ? "checked" : ""}> <span>Visible</span></label>
                    ${type === "nav" ? `<label class="studio-inline-check"><input type="checkbox" data-repeat-field="openNewTab" ${item.openNewTab ? "checked" : ""}> <span>Abrir en pestaña nueva</span></label>` : ""}
                </div>
            </article>`;
    }

    function renderRepeaters() {
        $("#studio-nav-list").innerHTML = sortByOrder(state.studio.navigation.items || []).map((item, index) => repeatCard("nav", item, index)).join("");
        $("#studio-footer-links").innerHTML = sortByOrder(state.studio.footer.links || []).map((item, index) => repeatCard("footer", item, index)).join("");
        $("#studio-admin-list").innerHTML = sortByOrder(state.studio.adminPanel.items || []).map((item, index) => repeatCard("admin", item, index)).join("");
    }

    function collectRepeater(containerSelector, type) {
        return $$(".studio-repeat-card", $(containerSelector)).map((card, index) => {
            const get = (name) => card.querySelector(`[data-repeat-field="${name}"]`);
            const base = {
                label: get("label").value.trim(),
                enabled: get("enabled").checked,
                order: number(get("order").value, (index + 1) * 10)
            };
            if (type === "nav") return { ...base, id: get("id").value, url: get("url").value.trim(), kind: get("kind").value, openNewTab: get("openNewTab").checked };
            if (type === "admin") return { ...base, id: get("id").value, href: get("href").value.trim(), icon: get("icon").value.trim(), custom: get("custom").value === "true" };
            return { ...base, url: get("url").value.trim() };
        });
    }

    function renderGlobal() {
        const c = state.studio.components;
        $("#studio-global-width").value = c.contentMaxWidth;
        $("#studio-button-radius").value = c.buttonRadius;
        $("#studio-button-height").value = c.buttonHeight;
        $("#studio-button-font").value = c.buttonFontSize;
        $("#studio-card-radius").value = c.cardRadius;
        $("#studio-card-shadow").value = c.cardShadow;
        $("#studio-modal-width").value = c.modalMaxWidth;
        $("#studio-modal-radius").value = c.modalRadius;
        $("#studio-modal-overlay").value = c.modalOverlayOpacity;
        $("#studio-heading-scale").value = c.headingScale;
        $("#studio-body-scale").value = c.bodyScale;
        $("#studio-header-sticky").checked = c.headerSticky;

        const footer = state.studio.footer;
        $("#studio-footer-heading").value = footer.heading || "";
        $("#studio-footer-description").value = footer.description || "";
        $("#studio-footer-copyright").value = footer.copyright || "";
        $("#studio-footer-enabled").checked = footer.enabled !== false;
        $("#studio-footer-newsletter").checked = footer.showNewsletter !== false;

        const admin = state.studio.adminPanel;
        $("#studio-admin-accent").value = admin.accentColor;
        $("#studio-admin-sidebar").value = admin.sidebarBackground;
        $("#studio-admin-text").value = admin.sidebarText;
        renderRepeaters();
    }

    function collectGlobal() {
        state.studio.components = {
            contentMaxWidth: number($("#studio-global-width").value, 1320),
            buttonRadius: number($("#studio-button-radius").value, 14),
            buttonHeight: number($("#studio-button-height").value, 48),
            buttonFontSize: number($("#studio-button-font").value, 15),
            cardRadius: number($("#studio-card-radius").value, 20),
            cardShadow: $("#studio-card-shadow").value,
            modalMaxWidth: number($("#studio-modal-width").value, 1120),
            modalRadius: number($("#studio-modal-radius").value, 24),
            modalOverlayOpacity: number($("#studio-modal-overlay").value, 0.62),
            headingScale: number($("#studio-heading-scale").value, 1),
            bodyScale: number($("#studio-body-scale").value, 1),
            headerSticky: $("#studio-header-sticky").checked
        };
        state.studio.navigation.items = collectRepeater("#studio-nav-list", "nav");
        state.studio.footer = {
            enabled: $("#studio-footer-enabled").checked,
            heading: $("#studio-footer-heading").value.trim(),
            description: $("#studio-footer-description").value.trim(),
            copyright: $("#studio-footer-copyright").value.trim(),
            showNewsletter: $("#studio-footer-newsletter").checked,
            links: collectRepeater("#studio-footer-links", "footer")
        };
        state.studio.adminPanel = {
            accentColor: $("#studio-admin-accent").value,
            sidebarBackground: $("#studio-admin-sidebar").value,
            sidebarText: $("#studio-admin-text").value,
            items: collectRepeater("#studio-admin-list", "admin")
        };
    }

    async function save() {
        try {
            collectCurrentPage();
            collectGlobal();
            const result = await AdminAPI.request("/admin/estudio-sitio", { method: "PUT", body: state.studio });
            state.studio = result.studio;
            populatePageSelect();
            renderPage();
            renderGlobal();
            message("Editor guardado. Los cambios ya están disponibles en la tienda.");
        } catch (error) {
            message(error.message, "danger");
        }
    }

    async function reset() {
        if (!AdminUI.confirmAction("¿Restaurar páginas, bloques, menú y diseño del editor?")) return;
        try {
            const result = await AdminAPI.request("/admin/estudio-sitio/restablecer", { method: "POST" });
            state.studio = result.studio;
            state.currentPageId = "home";
            populatePageSelect();
            renderPage();
            renderGlobal();
            message("Se restauró la configuración predeterminada.");
        } catch (error) {
            message(error.message, "danger");
        }
    }

    async function uploadSectionImage(card) {
        const input = card.querySelector("[data-section-image]");
        const file = input?.files?.[0];
        if (!file) return message("Selecciona una imagen antes de subir.", "danger");
        try {
            const form = new FormData();
            form.append("image", file);
            const result = await AdminAPI.request("/admin/estudio-sitio/imagen", { method: "POST", body: form });
            card.querySelector('[data-field="imageUrl"]').value = result.asset.url;
            message("Imagen cargada correctamente.");
        } catch (error) {
            message(error.message, "danger");
        }
    }

    function addCustomPage() {
        const name = window.prompt("Nombre de la nueva página:", "Nueva página");
        if (!name) return;
        const rawSlug = window.prompt("Identificador corto, sin espacios ni acentos:", "nueva-pagina");
        if (!rawSlug) return;
        const slug = rawSlug.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (!slug) return message("El identificador no es válido.", "danger");
        const id = `custom-${slug}`;
        if (state.studio.pages.some((page) => page.id === id)) return message("Ya existe una página con ese identificador.", "danger");
        collectCurrentPage();
        state.studio.pages.push({
            id,
            type: "custom",
            label: name.trim(),
            path: `pagina.html?slug=${slug}`,
            enabled: true,
            seoTitle: `${name.trim()} | Mommy Crafts`,
            seoDescription: "",
            layout: { maxWidth: 1100, contentPadding: 20, sectionGap: 36, backgroundColor: "#FFF9FD" },
            sections: [newSection("hero")]
        });
        state.currentPageId = id;
        populatePageSelect();
        renderPage();
    }

    function deleteCurrentPage() {
        const page = currentPage();
        if (!page || page.type !== "custom") return;
        if (!AdminUI.confirmAction(`¿Eliminar la página “${page.label}”?`)) return;
        state.studio.pages = state.studio.pages.filter((item) => item.id !== page.id);
        state.currentPageId = "home";
        populatePageSelect();
        renderPage();
    }

    function bindEvents() {
        $$("[data-studio-tab]").forEach((button) => button.addEventListener("click", () => {
            $$("[data-studio-tab]").forEach((item) => item.classList.toggle("active", item === button));
            $$("[data-studio-panel]").forEach((panel) => { panel.hidden = panel.dataset.studioPanel !== button.dataset.studioTab; });
        }));
        $("#studio-page-select").addEventListener("change", (event) => switchPage(event.target.value));
        $("#studio-add-page").addEventListener("click", addCustomPage);
        $("#studio-delete-page").addEventListener("click", deleteCurrentPage);
        $("#studio-preview-page").addEventListener("click", () => {
            collectCurrentPage();
            const page = currentPage();
            if (page) window.open(`../${page.path}`, "_blank", "noopener");
        });
        $("#studio-add-block").addEventListener("click", () => {
            collectCurrentPage();
            currentPage().sections.push(newSection($("#studio-new-block-type").value));
            renderSections(currentPage());
        });
        $("#studio-sections-list").addEventListener("click", (event) => {
            const card = event.target.closest(".studio-section-card");
            if (!card) return;
            if (event.target.closest("[data-section-toggle]")) card.classList.toggle("is-collapsed");
            if (event.target.closest("[data-move-up]")) moveCard(card, -1);
            if (event.target.closest("[data-move-down]")) moveCard(card, 1);
            if (event.target.closest("[data-remove-section]")) card.remove();
            if (event.target.closest("[data-upload-section-image]")) uploadSectionImage(card);
        });
        $("#studio-sections-list").addEventListener("input", (event) => {
            if (event.target.matches('[data-field="title"]')) {
                event.target.closest(".studio-section-card")?.querySelector("[data-section-heading]")?.replaceChildren(document.createTextNode(event.target.value || "Sección"));
            }
        });

        function repeatAction(event) {
            const card = event.target.closest(".studio-repeat-card");
            if (!card) return;
            if (event.target.closest("[data-repeat-remove]")) card.remove();
            if (event.target.closest("[data-repeat-up]") && card.previousElementSibling) card.parentElement.insertBefore(card, card.previousElementSibling);
            if (event.target.closest("[data-repeat-down]") && card.nextElementSibling) card.parentElement.insertBefore(card.nextElementSibling, card);
        }
        ["#studio-nav-list", "#studio-footer-links", "#studio-admin-list"].forEach((selector) => $(selector).addEventListener("click", repeatAction));
        $("#studio-add-nav").addEventListener("click", () => {
            const item = { id: `nav-${Date.now().toString(36)}`, label: "Nuevo enlace", url: "index.html", kind: "link", enabled: true, openNewTab: false, order: $("#studio-nav-list").children.length * 10 + 10 };
            $("#studio-nav-list").insertAdjacentHTML("beforeend", repeatCard("nav", item, $("#studio-nav-list").children.length));
        });
        $("#studio-add-footer-link").addEventListener("click", () => {
            const item = { label: "Nuevo enlace", url: "index.html", enabled: true, order: $("#studio-footer-links").children.length * 10 + 10 };
            $("#studio-footer-links").insertAdjacentHTML("beforeend", repeatCard("footer", item, $("#studio-footer-links").children.length));
        });
        $("#studio-add-admin-link").addEventListener("click", () => {
            const item = { id: `custom-${Date.now().toString(36)}`, label: "Enlace personalizado", href: "../index.html", icon: "fa-link", enabled: true, order: $("#studio-admin-list").children.length * 10 + 10, custom: true };
            $("#studio-admin-list").insertAdjacentHTML("beforeend", repeatCard("admin", item, $("#studio-admin-list").children.length));
        });
        ["#studio-save-top", "#studio-save-bottom"].forEach((selector) => $(selector).addEventListener("click", save));
        $("#studio-reset").addEventListener("click", reset);
    }

    async function init() {
        try {
            const result = await AdminAPI.request("/admin/estudio-sitio");
            state.studio = result.studio;
            state.currentPageId = "home";
            populatePageSelect();
            renderPage();
            renderGlobal();
            bindEvents();
        } catch (error) {
            message(error.message, "danger");
        }
    }

    document.addEventListener("admin:ready", init, { once: true });
})();
