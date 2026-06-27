"use strict";

(function () {
    const PAGE_HREFS = Object.freeze({
        "quienes-somos": "../quienes-somos.html",
        contacto: "../contacto.html",
        "preguntas-frecuentes": "../preguntas-frecuentes.html",
        "despachos-retiros": "../despachos-retiros.html",
        "cambios-pedidos": "../cambios-pedidos.html",
        privacidad: "../privacidad.html",
        terminos: "../terminos.html",
        seguridad: "../seguridad.html"
    });

    const state = {
        pages: [],
        currentSlug: "",
        customized: false,
        saving: false
    };

    const $ = (selector) => document.querySelector(selector);

    function escape(value) {
        return AdminUI.escapeHtml(value);
    }

    function message(text, type = "") {
        const element = $("#content-manager-message");
        if (!element) return;
        element.hidden = !text;
        element.className = `admin-alert ${type}`.trim();
        element.textContent = text;
    }

    function setStatus(customized, revision, updatedAt, updatedBy) {
        const status = $("#content-custom-status");
        const meta = $("#content-update-meta");
        state.customized = Boolean(customized);
        status.className = `admin-status ${customized ? "success" : "info"}`;
        status.textContent = customized
            ? `Personalizada${revision ? ` · revisión ${revision}` : ""}`
            : "Contenido predeterminado";

        if (!meta) return;

        const date = updatedAt ? new Date(updatedAt) : null;
        const formatted = date && !Number.isNaN(date.getTime())
            ? new Intl.DateTimeFormat("es-CL", {
                dateStyle: "short",
                timeStyle: "short"
            }).format(date)
            : "";

        const user = updatedBy?.nombre || updatedBy?.email || "";
        meta.textContent = customized
            ? [formatted ? `Modificado ${formatted}` : "Modificado", user ? `por ${user}` : ""]
                .filter(Boolean)
                .join(" ")
            : "Se usa la versión predeterminada";
    }

    function repeatableHeader(label, index) {
        return `
            <div class="admin-repeatable-header">
                <strong>${escape(label)} ${index + 1}</strong>
                <div class="admin-repeatable-actions">
                    <button class="admin-icon-button" type="button" data-move-up aria-label="Subir elemento">
                        <i class="fa-solid fa-arrow-up"></i>
                    </button>
                    <button class="admin-icon-button" type="button" data-move-down aria-label="Bajar elemento">
                        <i class="fa-solid fa-arrow-down"></i>
                    </button>
                    <button class="admin-icon-button danger" type="button" data-remove-item aria-label="Eliminar elemento">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    function sectionTemplate(section = {}, index = 0) {
        return `
            <article class="admin-repeatable-card" data-section-item>
                ${repeatableHeader("Sección", index)}
                <div class="admin-form-grid">
                    <label class="admin-field full">
                        <span>Título</span>
                        <input data-section-title type="text" maxlength="180" value="${escape(section.title || "")}">
                    </label>
                    <label class="admin-field full">
                        <span>Contenido</span>
                        <textarea data-section-body maxlength="6000">${escape(section.body || "")}</textarea>
                    </label>
                    <label class="admin-field full">
                        <span>Puntos destacados</span>
                        <textarea data-section-items maxlength="7500" placeholder="Un punto por línea">${escape((section.items || []).join("\n"))}</textarea>
                        <small>Escribe un punto por línea. Déjalo vacío cuando la sección no necesite lista.</small>
                    </label>
                </div>
            </article>
        `;
    }

    function faqTemplate(faq = {}, index = 0) {
        return `
            <article class="admin-repeatable-card" data-faq-item>
                ${repeatableHeader("Pregunta", index)}
                <div class="admin-form-grid">
                    <label class="admin-field full">
                        <span>Pregunta</span>
                        <input data-faq-question type="text" maxlength="260" value="${escape(faq.question || "")}">
                    </label>
                    <label class="admin-field full">
                        <span>Respuesta</span>
                        <textarea data-faq-answer maxlength="4000">${escape(faq.answer || "")}</textarea>
                    </label>
                </div>
            </article>
        `;
    }

    function contactTemplate(card = {}, index = 0) {
        return `
            <article class="admin-repeatable-card" data-contact-item>
                ${repeatableHeader("Tarjeta", index)}
                <div class="admin-form-grid">
                    <label class="admin-field">
                        <span>Título</span>
                        <input data-contact-title type="text" maxlength="160" value="${escape(card.title || "")}">
                    </label>
                    <label class="admin-field">
                        <span>Texto del botón</span>
                        <input data-contact-action-label type="text" maxlength="100" value="${escape(card.actionLabel || "")}">
                    </label>
                    <label class="admin-field full">
                        <span>Detalle</span>
                        <textarea data-contact-detail maxlength="2000">${escape(card.detail || "")}</textarea>
                    </label>
                    <label class="admin-field full">
                        <span>Enlace del botón</span>
                        <input data-contact-action-url type="text" maxlength="500" value="${escape(card.actionUrl || "")}" placeholder="https://, mailto: o tel:">
                    </label>
                </div>
            </article>
        `;
    }

    function renderList(container, items, template, emptyText) {
        container.innerHTML = items.length
            ? items.map(template).join("")
            : `<div class="admin-empty compact">${escape(emptyText)}</div>`;
    }

    function renderContent(content, customized) {
        $("#content-label").value = content.label || "";
        $("#content-kicker").value = content.kicker || "";
        $("#content-title").value = content.title || "";
        $("#content-summary").value = content.summary || "";
        $("#content-notice").value = content.notice || "";
        $("#content-seo-title").value = content.seoTitle || "";
        $("#content-seo-description").value = content.seoDescription || "";
        $("#content-published").checked = content.published !== false;

        renderList(
            $("#content-sections-list"),
            content.sections || [],
            sectionTemplate,
            "Esta página no tiene secciones."
        );
        renderList(
            $("#content-faqs-list"),
            content.faqs || [],
            faqTemplate,
            "Esta página no tiene preguntas frecuentes."
        );
        renderList(
            $("#content-contacts-list"),
            content.contactCards || [],
            contactTemplate,
            "Esta página no tiene tarjetas de contacto."
        );

        document.dispatchEvent(new CustomEvent("admin:content-rendered"));

        setStatus(
            customized,
            content.revision,
            content.updatedAt,
            content.updatedBy
        );
        $("#content-preview-link").href = PAGE_HREFS[state.currentSlug] || "../index.html";
        message("");
    }

    async function loadPage(slug) {
        state.currentSlug = slug;
        if (!slug) return;

        message("Cargando contenido...");
        try {
            const result = await AdminAPI.request(`/admin/contenido/${encodeURIComponent(slug)}`);
            renderContent(result.content, result.customized);
        } catch (error) {
            message(error.message, "danger");
        }
    }

    function populateSelector(pages) {
        const select = $("#content-page-select");
        select.innerHTML = pages.map((page) => `
            <option value="${escape(page.slug)}">${escape(page.label || page.title || page.slug)}</option>
        `).join("");

        const preferred = new URLSearchParams(location.search).get("pagina");
        const initial = pages.some((page) => page.slug === preferred)
            ? preferred
            : pages[0]?.slug || "";

        select.value = initial;
        loadPage(initial);
    }

    function lines(value) {
        return String(value || "")
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    function collect() {
        return {
            label: $("#content-label").value,
            kicker: $("#content-kicker").value,
            title: $("#content-title").value,
            summary: $("#content-summary").value,
            notice: $("#content-notice").value,
            seoTitle: $("#content-seo-title").value,
            seoDescription: $("#content-seo-description").value,
            published: $("#content-published").checked,
            sections: [...document.querySelectorAll("[data-section-item]")].map((item) => ({
                title: item.querySelector("[data-section-title]").value,
                body: item.querySelector("[data-section-body]").value,
                items: lines(item.querySelector("[data-section-items]").value)
            })),
            faqs: [...document.querySelectorAll("[data-faq-item]")].map((item) => ({
                question: item.querySelector("[data-faq-question]").value,
                answer: item.querySelector("[data-faq-answer]").value
            })),
            contactCards: [...document.querySelectorAll("[data-contact-item]")].map((item) => ({
                title: item.querySelector("[data-contact-title]").value,
                detail: item.querySelector("[data-contact-detail]").value,
                actionLabel: item.querySelector("[data-contact-action-label]").value,
                actionUrl: item.querySelector("[data-contact-action-url]").value
            }))
        };
    }

    async function save() {
        if (state.saving || !state.currentSlug) return;
        state.saving = true;
        message("Guardando cambios...");
        document.querySelectorAll("#content-save-button, #content-mobile-save")
            .forEach((button) => button.disabled = true);

        try {
            const result = await AdminAPI.request(
                `/admin/contenido/${encodeURIComponent(state.currentSlug)}`,
                { method: "PUT", body: collect() }
            );
            renderContent(result.content, true);
            AdminUI.toast("Contenido guardado.", "success");
            message("Los cambios quedaron guardados y ya pueden verse en la página pública.", "success");
        } catch (error) {
            message(error.message, "danger");
            AdminUI.toast(error.message, "error");
        } finally {
            state.saving = false;
            document.querySelectorAll("#content-save-button, #content-mobile-save")
                .forEach((button) => button.disabled = false);
        }
    }

    async function reset() {
        if (!state.currentSlug || !AdminUI.confirmAction("¿Restaurar el contenido predeterminado de esta página? Se perderán sus cambios personalizados.")) {
            return;
        }

        try {
            const result = await AdminAPI.request(
                `/admin/contenido/${encodeURIComponent(state.currentSlug)}/restablecer`,
                { method: "POST" }
            );
            renderContent(result.content, false);
            AdminUI.toast("Contenido restaurado.", "success");
        } catch (error) {
            message(error.message, "danger");
        }
    }

    function addItem(containerSelector, template) {
        const container = $(containerSelector);
        const empty = container.querySelector(".admin-empty");
        if (empty) empty.remove();
        const index = container.children.length;
        container.insertAdjacentHTML("beforeend", template({}, index));

        const parentCard = container.closest(".admin-card");
        if (parentCard?.classList.contains("is-collapsed")) {
            parentCard.classList.remove("is-collapsed");
            parentCard.querySelector(":scope > .admin-card-header .admin-card-collapse")
                ?.setAttribute("aria-expanded", "true");
        }

        document.dispatchEvent(new CustomEvent("admin:content-rendered"));
        container.lastElementChild?.querySelector("input, textarea")?.focus();
    }

    function renumber(container) {
        [...container.querySelectorAll(".admin-repeatable-card")].forEach((card, index) => {
            const strong = card.querySelector(".admin-repeatable-header strong");
            if (strong) {
                const label = strong.textContent.replace(/\s+\d+$/, "");
                strong.textContent = `${label} ${index + 1}`;
            }
        });
    }

    function handleRepeatableAction(event) {
        const card = event.target.closest(".admin-repeatable-card");
        if (!card) return;
        const container = card.parentElement;

        if (event.target.closest("[data-remove-item]")) {
            card.remove();
            renumber(container);
            return;
        }

        if (event.target.closest("[data-move-up]") && card.previousElementSibling) {
            container.insertBefore(card, card.previousElementSibling);
            renumber(container);
            return;
        }

        if (event.target.closest("[data-move-down]") && card.nextElementSibling) {
            container.insertBefore(card.nextElementSibling, card);
            renumber(container);
        }
    }

    async function init() {
        document.addEventListener("click", handleRepeatableAction);
        $("#content-page-select").addEventListener("change", (event) => loadPage(event.target.value));
        $("#content-save-button").addEventListener("click", save);
        $("#content-mobile-save").addEventListener("click", save);
        $("#content-reset-button").addEventListener("click", reset);
        $("#content-add-section").addEventListener("click", () => addItem("#content-sections-list", sectionTemplate));
        $("#content-add-faq").addEventListener("click", () => addItem("#content-faqs-list", faqTemplate));
        $("#content-add-contact").addEventListener("click", () => addItem("#content-contacts-list", contactTemplate));

        try {
            const result = await AdminAPI.request("/admin/contenido");
            state.pages = result.pages || [];
            populateSelector(state.pages);
        } catch (error) {
            message(error.message, "danger");
        }
    }

    document.addEventListener("admin:ready", init, { once: true });
})();
