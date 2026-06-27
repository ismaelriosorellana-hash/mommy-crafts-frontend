"use strict";

(function () {
    const DEFAULTS = {
        branding: {
            logo: {
                url: "https://res.cloudinary.com/jo3bgrnh/image/upload/v1782320550/LOGO_MOMMY_CRAFTS_PNGG_mpgyfl.png",
                publicId: "",
                alt: "Logo Mommy Crafts",
                width: 52,
                offsetX: 0,
                offsetY: 0
            },
            title: {
                mode: "image",
                url: "https://res.cloudinary.com/jo3bgrnh/image/upload/v1782320550/Mommy_Crafts_2_1_hbj8xi.png",
                publicId: "",
                text: "Mommy Crafts",
                width: 220,
                fontSize: 32,
                offsetX: 0,
                offsetY: 0,
                gap: 10
            }
        },
        colors: {
            primary: "#FCC0E6",
            primaryDark: "#8E456A",
            primaryDeep: "#71364F",
            primarySoft: "#FFF2FA",
            secondary: "#65445A",
            accent: "#F59BCF",
            background: "#FFF9FD",
            surface: "#FFFFFF",
            surfaceSoft: "#FFF2FA",
            text: "#372A32",
            textSoft: "#715F69",
            border: "#F0D6E6",
            headerBackground: "#FFF9FD",
            footerBackground: "#2F292C",
            footerText: "#F9F3F5",
            buttonText: "#FFFFFF"
        }
    };

    const COLOR_FIELDS = [
        ["primary", "Principal"],
        ["primaryDark", "Principal oscuro"],
        ["primaryDeep", "Principal profundo"],
        ["primarySoft", "Principal suave"],
        ["secondary", "Secundario"],
        ["accent", "Acento"],
        ["background", "Fondo general"],
        ["surface", "Tarjetas y superficies"],
        ["surfaceSoft", "Superficie suave"],
        ["text", "Texto principal"],
        ["textSoft", "Texto secundario"],
        ["border", "Bordes"],
        ["headerBackground", "Fondo del encabezado"],
        ["footerBackground", "Fondo del pie"],
        ["footerText", "Texto del pie"],
        ["buttonText", "Texto de botones"]
    ];

    const state = { settings: structuredClone(DEFAULTS), customized: false, saving: false, uploading: false };
    const $ = (selector) => document.querySelector(selector);

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function message(text, type = "") {
        const element = $("#site-settings-message");
        if (!element) return;
        element.hidden = !text;
        element.className = `admin-alert ${type}`.trim();
        element.textContent = text;
    }

    function mergeSettings(value = {}) {
        const defaults = clone(DEFAULTS);
        return {
            ...defaults,
            ...value,
            branding: {
                ...defaults.branding,
                ...(value.branding || {}),
                logo: { ...defaults.branding.logo, ...(value.branding?.logo || {}) },
                title: { ...defaults.branding.title, ...(value.branding?.title || {}) }
            },
            colors: { ...defaults.colors, ...(value.colors || {}) }
        };
    }

    function renderColorFields() {
        const grid = $("#site-color-grid");
        if (!grid) return;
        grid.innerHTML = COLOR_FIELDS.map(([key, label]) => `
            <label class="site-color-field" for="site-color-${key}">
                <span>${AdminUI.escapeHtml(label)}</span>
                <div>
                    <input id="site-color-${key}" data-color-key="${key}" type="color">
                    <input data-color-text="${key}" type="text" maxlength="7" inputmode="text" aria-label="Valor hexadecimal de ${AdminUI.escapeHtml(label)}">
                </div>
            </label>
        `).join("");
    }

    function setRange(id, value, suffix = "px") {
        const input = $(`#${id}`);
        const output = $(`#${id}-output`);
        if (input) input.value = value;
        if (output) output.textContent = `${value}${suffix}`;
    }

    function renderForm() {
        const { logo, title } = state.settings.branding;
        $("#site-logo-alt").value = logo.alt || "";
        setRange("site-logo-width", logo.width);
        setRange("site-logo-x", logo.offsetX);
        setRange("site-logo-y", logo.offsetY);

        $("#site-title-mode").value = title.mode || "image";
        $("#site-title-text").value = title.text || "Mommy Crafts";
        setRange("site-title-width", title.width);
        setRange("site-title-font-size", title.fontSize);
        setRange("site-title-x", title.offsetX);
        setRange("site-title-y", title.offsetY);
        setRange("site-title-gap", title.gap);

        for (const [key] of COLOR_FIELDS) {
            const color = state.settings.colors[key] || DEFAULTS.colors[key];
            const picker = $(`[data-color-key="${key}"]`);
            const text = $(`[data-color-text="${key}"]`);
            if (picker) picker.value = color;
            if (text) text.value = color.toUpperCase();
        }

        updateModeVisibility();
        updatePreview();
    }

    function valueNumber(id) {
        return Number($(`#${id}`)?.value || 0);
    }

    function collect() {
        const colors = {};
        for (const [key] of COLOR_FIELDS) {
            colors[key] = ($(`[data-color-text="${key}"]`)?.value || DEFAULTS.colors[key]).toUpperCase();
        }

        return {
            branding: {
                logo: {
                    ...state.settings.branding.logo,
                    alt: $("#site-logo-alt").value.trim(),
                    width: valueNumber("site-logo-width"),
                    offsetX: valueNumber("site-logo-x"),
                    offsetY: valueNumber("site-logo-y")
                },
                title: {
                    ...state.settings.branding.title,
                    mode: $("#site-title-mode").value,
                    text: $("#site-title-text").value.trim(),
                    width: valueNumber("site-title-width"),
                    fontSize: valueNumber("site-title-font-size"),
                    offsetX: valueNumber("site-title-x"),
                    offsetY: valueNumber("site-title-y"),
                    gap: valueNumber("site-title-gap")
                }
            },
            colors
        };
    }

    function updateModeVisibility() {
        const mode = $("#site-title-mode")?.value || "image";
        const field = $("#site-title-file-field");
        if (field) field.hidden = mode !== "image";
    }

    function updatePreview() {
        const current = collect();
        const { logo, title } = current.branding;
        const colors = current.colors;
        const root = $("#site-brand-preview");
        const brand = $("#site-brand-preview-brand");
        const logoImage = $("#site-preview-logo");
        const titleImage = $("#site-preview-title-image");
        const titleText = $("#site-preview-title-text");
        if (!root || !brand || !logoImage || !titleImage || !titleText) return;

        root.style.setProperty("--preview-primary", colors.primary);
        root.style.setProperty("--preview-primary-dark", colors.primaryDark);
        root.style.setProperty("--preview-primary-deep", colors.primaryDeep);
        root.style.setProperty("--preview-primary-soft", colors.primarySoft);
        root.style.setProperty("--preview-background", colors.background);
        root.style.setProperty("--preview-surface", colors.surface);
        root.style.setProperty("--preview-surface-soft", colors.surfaceSoft);
        root.style.setProperty("--preview-text", colors.text);
        root.style.setProperty("--preview-text-soft", colors.textSoft);
        root.style.setProperty("--preview-border", colors.border);
        root.style.setProperty("--preview-header", colors.headerBackground);
        root.style.setProperty("--preview-footer", colors.footerBackground);
        root.style.setProperty("--preview-footer-text", colors.footerText);
        root.style.setProperty("--preview-button-text", colors.buttonText);

        brand.style.gap = `${title.gap}px`;
        logoImage.src = logo.url;
        logoImage.alt = logo.alt;
        logoImage.style.width = `${logo.width}px`;
        logoImage.style.transform = `translate(${logo.offsetX}px, ${logo.offsetY}px)`;

        const imageMode = title.mode === "image";
        titleImage.hidden = !imageMode;
        titleText.hidden = imageMode;
        if (imageMode) {
            titleImage.src = title.url;
            titleImage.style.width = `${title.width}px`;
            titleImage.style.transform = `translate(${title.offsetX}px, ${title.offsetY}px)`;
        } else {
            titleText.textContent = title.text || "Mommy Crafts";
            titleText.style.fontSize = `${title.fontSize}px`;
            titleText.style.transform = `translate(${title.offsetX}px, ${title.offsetY}px)`;
            titleText.style.color = colors.primaryDark;
        }
    }

    function setStatus(settings, customized) {
        const status = $("#site-settings-status");
        const meta = $("#site-settings-meta");
        status.className = `admin-status ${customized ? "success" : "info"}`;
        status.textContent = customized ? `Personalizada · revisión ${settings.revision || 1}` : "Apariencia predeterminada";
        const date = settings.updatedAt ? new Date(settings.updatedAt) : null;
        meta.textContent = date && !Number.isNaN(date.getTime())
            ? `Modificada ${new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short" }).format(date)}`
            : customized ? "Configuración guardada" : "Se usa la configuración predeterminada";
    }

    async function upload(type, file) {
        if (!file || state.uploading) return;
        state.uploading = true;
        message(`Subiendo ${type === "logo" ? "logo" : "título"}...`);
        try {
            const form = new FormData();
            form.append("type", type);
            form.append("image", file, file.name);
            const result = await AdminAPI.request("/admin/configuracion-sitio/imagen", { method: "POST", body: form });
            const target = type === "logo" ? state.settings.branding.logo : state.settings.branding.title;
            target.url = result.asset.url;
            target.publicId = result.asset.publicId || "";
            updatePreview();
            message("Imagen cargada. Presiona Guardar cambios para publicarla.", "success");
        } catch (error) {
            message(error.message, "danger");
        } finally {
            state.uploading = false;
        }
    }

    async function save() {
        if (state.saving || state.uploading) return;
        state.saving = true;
        document.querySelectorAll("#site-settings-save, #site-settings-mobile-save").forEach((button) => button.disabled = true);
        message("Guardando apariencia...");
        try {
            const result = await AdminAPI.request("/admin/configuracion-sitio", { method: "PUT", body: collect() });
            state.settings = mergeSettings(result.settings);
            state.customized = true;
            renderForm();
            setStatus(result.settings, true);
            message("La identidad y los colores ya están publicados.", "success");
            AdminUI.toast("Apariencia guardada.", "success");
        } catch (error) {
            message(error.message, "danger");
            AdminUI.toast(error.message, "error");
        } finally {
            state.saving = false;
            document.querySelectorAll("#site-settings-save, #site-settings-mobile-save").forEach((button) => button.disabled = false);
        }
    }

    async function reset() {
        if (!AdminUI.confirmAction("¿Restaurar el logo, título, posiciones, tamaños y colores predeterminados?")) return;
        try {
            const result = await AdminAPI.request("/admin/configuracion-sitio/restablecer", { method: "POST" });
            state.settings = mergeSettings(result.settings);
            state.customized = false;
            renderForm();
            setStatus(result.settings, false);
            message("Se restauró la apariencia predeterminada.", "success");
            AdminUI.toast("Apariencia restaurada.", "success");
        } catch (error) {
            message(error.message, "danger");
        }
    }

    function bind() {
        document.querySelectorAll('input[type="range"]').forEach((input) => {
            input.addEventListener("input", () => {
                const output = $(`#${input.id}-output`);
                if (output) output.textContent = `${input.value}px`;
                updatePreview();
            });
        });

        $("#site-logo-alt")?.addEventListener("input", updatePreview);
        $("#site-title-text")?.addEventListener("input", updatePreview);
        $("#site-title-mode")?.addEventListener("change", () => { updateModeVisibility(); updatePreview(); });
        $("#site-logo-file")?.addEventListener("change", (event) => upload("logo", event.target.files?.[0]));
        $("#site-title-file")?.addEventListener("change", (event) => upload("title", event.target.files?.[0]));

        document.addEventListener("input", (event) => {
            const key = event.target.dataset.colorKey;
            const textKey = event.target.dataset.colorText;
            if (key) {
                const text = $(`[data-color-text="${key}"]`);
                if (text) text.value = event.target.value.toUpperCase();
                updatePreview();
            }
            if (textKey && /^#[0-9a-f]{6}$/i.test(event.target.value)) {
                const picker = $(`[data-color-key="${textKey}"]`);
                if (picker) picker.value = event.target.value;
                updatePreview();
            }
        });

        $("#site-logo-default")?.addEventListener("click", () => {
            state.settings = mergeSettings(collect());
            state.settings.branding.logo = clone(DEFAULTS.branding.logo);
            renderForm();
        });
        $("#site-title-default")?.addEventListener("click", () => {
            state.settings = mergeSettings(collect());
            state.settings.branding.title = clone(DEFAULTS.branding.title);
            renderForm();
        });
        $("#site-settings-save")?.addEventListener("click", save);
        $("#site-settings-mobile-save")?.addEventListener("click", save);
        $("#site-settings-reset")?.addEventListener("click", reset);
    }

    async function init() {
        renderColorFields();
        bind();
        try {
            const result = await AdminAPI.request("/admin/configuracion-sitio");
            state.settings = mergeSettings(result.settings);
            state.customized = Boolean(result.customized);
            renderForm();
            setStatus(result.settings, result.customized);
            message("");
        } catch (error) {
            message(error.message, "danger");
        }
    }

    document.addEventListener("admin:ready", init, { once: true });
})();
