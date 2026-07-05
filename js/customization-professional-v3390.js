"use strict";

(function () {
    const MODAL_SELECTOR = "#modal-personalizar";
    const DRAFT_KEY = "mommycrafts_customization_draft_v3410";
    const LEGACY_DRAFT_KEYS = ["mommycrafts_customization_draft_v3390"];
    const STEP_HINTS = {
        1: "Elige el tipo de producto que quieres personalizar.",
        2: "Selecciona el producto base. El precio se actualizará automáticamente.",
        3: "Escoge un estilo referencial para orientar el diseño.",
        4: "Elige color o variante. Si el producto tiene talla, también debes seleccionarla.",
        5: "Sube una imagen si quieres incluirla. También puedes continuar sin imagen.",
        6: "Agrega textos, dedicatorias o instrucciones especiales para el diseño."
    };
    const STEP_ERRORS = {
        1: "Selecciona primero un tipo de producto.",
        2: "Selecciona un producto base para continuar.",
        3: "Elige un estilo referencial.",
        4: "Selecciona color/variante y talla si corresponde.",
        5: "Puedes subir una imagen o continuar con el texto.",
        6: "Revisa el texto o continúa para ver el resumen."
    };

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    function currentStep() {
        const active = $(".modal-step-content.active");
        return Number(active?.dataset.stepContent || 1);
    }

    function addTrustStrip(modal) {
        const header = $(".modal-header", modal);
        if (!header || $(".mc-customization-trust-strip", modal)) return;

        const strip = document.createElement("div");
        strip.className = "mc-customization-trust-strip";
        strip.innerHTML = `
            <div class="mc-customization-trust-item"><i class="fa-solid fa-eye" aria-hidden="true"></i><span>Vista referencial antes de comprar</span></div>
            <div class="mc-customization-trust-item"><i class="fa-solid fa-shield-heart" aria-hidden="true"></i><span>Diseño revisado antes de fabricar</span></div>
            <div class="mc-customization-trust-item"><i class="fa-solid fa-receipt" aria-hidden="true"></i><span>Precio estimado siempre visible</span></div>
        `;
        header.insertAdjacentElement("afterend", strip);
    }

    function addStepHelpers(modal) {
        $$(".modal-step-content", modal).forEach((section) => {
            const step = Number(section.dataset.stepContent || 0);
            if (!step || $(".mc-customization-helper", section)) return;

            const helper = document.createElement("div");
            helper.className = "mc-customization-helper";
            helper.innerHTML = `<i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>${STEP_HINTS[step] || "Completa este paso para avanzar."}</span>`;

            const description = $(".customization-step-description", section);
            if (description) {
                description.insertAdjacentElement("afterend", helper);
            } else {
                const title = $("h3", section);
                title?.insertAdjacentElement("afterend", helper);
            }

            const validation = document.createElement("div");
            validation.className = "mc-customization-validation";
            validation.setAttribute("role", "status");
            validation.setAttribute("aria-live", "polite");
            validation.innerHTML = `<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i><span>${STEP_ERRORS[step] || "Completa este paso para continuar."}</span>`;
            section.appendChild(validation);
        });
    }

    function hideValidation(modal) {
        $$(".mc-customization-validation.is-visible", modal).forEach((item) => {
            item.classList.remove("is-visible");
        });
    }

    function showValidationForActiveStep(modal) {
        const step = currentStep();
        const section = $(`.modal-step-content[data-step-content="${step}"]`, modal);
        const validation = $(".mc-customization-validation", section || modal);
        if (!validation) return;
        validation.classList.add("is-visible");
        validation.scrollIntoView({ block: "nearest", behavior: "auto" });
    }

    function saveDraft() {
        const payload = {
            main: $("#texto-principal")?.value || "",
            secondary: $("#texto-secundario")?.value || "",
            instructions: $("#instrucciones")?.value || "",
            updatedAt: Date.now()
        };
        try {
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        } catch (_) {
            // sessionStorage puede no estar disponible en algunos navegadores privados.
        }
    }

    function clearLegacyDrafts() {
        try {
            LEGACY_DRAFT_KEYS.forEach((key) => sessionStorage.removeItem(key));
        } catch (_) {
            // sessionStorage puede no estar disponible en algunos navegadores privados.
        }
    }

    function restoreDraft() {
        if (currentStep() !== 6) return;

        let payload = null;
        try {
            payload = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null");
        } catch (_) {
            payload = null;
        }
        if (!payload) return;

        const map = [
            ["#texto-principal", payload.main],
            ["#texto-secundario", payload.secondary],
            ["#instrucciones", payload.instructions]
        ];
        map.forEach(([selector, value]) => {
            const field = $(selector);
            if (!field || field.value || !value) return;
            field.value = value;
            field.dispatchEvent(new Event("input", { bubbles: true }));
        });
    }

    function bindDraft() {
        ["#texto-principal", "#texto-secundario", "#instrucciones"].forEach((selector) => {
            const field = $(selector);
            field?.addEventListener("input", saveDraft);
        });
    }

    function observeStepChanges(modal) {
        const target = $(".customization-form", modal);
        if (!target) return;

        let timer = 0;
        let lastStep = currentStep();
        const isMobile = () => window.matchMedia?.("(max-width: 760px)")?.matches;

        const observer = new MutationObserver(() => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                hideValidation(modal);
                const step = currentStep();
                if (step === lastStep) return;
                lastStep = step;

                const activeStep = $(`.modal-steps .step[data-step="${step}"]`, modal);
                if (activeStep && typeof activeStep.scrollIntoView === "function") {
                    activeStep.scrollIntoView({
                        inline: "center",
                        block: "nearest",
                        behavior: "auto"
                    });
                }

                // En móvil evitamos cualquier scroll forzado del cuerpo del modal.
                // El scroll queda completamente nativo para prevenir congelamientos.
                if (!isMobile()) {
                    $(".modal-body", modal)?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
                }

                if (step === 6) {
                    window.setTimeout(restoreDraft, 80);
                }
            }, 90);
        });

        observer.observe(target, {
            subtree: true,
            attributes: true,
            attributeFilter: ["class"]
        });
    }

    function bindValidationFeedback(modal) {
        const next = $("#btn-next", modal);
        if (!next || next.dataset.mcProfessionalBound === "true") return;
        next.dataset.mcProfessionalBound = "true";

        next.addEventListener("click", () => {
            const before = currentStep();
            window.setTimeout(() => {
                const after = currentStep();
                const summaryVisible = $("#modal-summary", modal)?.hidden === false;
                if (before === after && !summaryVisible && before < 5) {
                    showValidationForActiveStep(modal);
                }
            }, 60);
        }, true);

        modal.addEventListener("click", (event) => {
            if (event.target.closest("button, label, input, textarea, select")) {
                hideValidation(modal);
            }
        });
    }

    function init() {
        const modal = $(MODAL_SELECTOR);
        if (!modal || modal.dataset.mcCustomizationProfessional === "true") return;
        modal.dataset.mcCustomizationProfessional = "true";
        modal.classList.add("mc-customization-pro");

        addTrustStrip(modal);
        addStepHelpers(modal);
        bindValidationFeedback(modal);
        bindDraft();
        observeStepChanges(modal);

        const openObserver = new MutationObserver(() => {
            if (modal.getAttribute("aria-hidden") === "false") {
                clearLegacyDrafts();
                hideValidation(modal);
            }
        });
        openObserver.observe(modal, { attributes: true, attributeFilter: ["aria-hidden"] });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
}());
