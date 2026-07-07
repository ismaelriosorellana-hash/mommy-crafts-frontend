"use strict";

(function () {
    const CONSENT_KEY = "mc_analytics_consent";
    const ACCEPTED = "accepted";
    const DECLINED = "declined";
    let lastAnalyticsEnabled = false;

    function getConsent() {
        try {
            return localStorage.getItem(CONSENT_KEY) || "";
        } catch {
            return "";
        }
    }

    function setConsent(value) {
        try {
            localStorage.setItem(CONSENT_KEY, value);
        } catch {
            // Sin almacenamiento disponible: solo se aplica durante la sesión.
        }
        document.dispatchEvent(new CustomEvent("privacy:analytics-consent", {
            detail: { granted: value === ACCEPTED, value }
        }));
        hideBanner();
    }

    function banner() {
        let element = document.getElementById("mc-privacy-banner");
        if (element) return element;

        element = document.createElement("section");
        element.id = "mc-privacy-banner";
        element.className = "mc-privacy-banner";
        element.setAttribute("role", "dialog");
        element.setAttribute("aria-live", "polite");
        element.setAttribute("aria-label", "Preferencias de privacidad y analítica");
        element.innerHTML = `
            <h2>Privacidad y mejora de la tienda</h2>
            <p>Usamos medición básica para entender qué productos interesan más y mejorar la experiencia. Puedes aceptar la analítica o usar solo las funciones necesarias de la tienda.</p>
            <div class="mc-privacy-actions">
                <button class="mc-privacy-accept" type="button" data-privacy-accept>Aceptar medición</button>
                <button class="mc-privacy-decline" type="button" data-privacy-decline>Solo necesarias</button>
                <a class="mc-privacy-link" href="privacidad.html">Ver privacidad</a>
            </div>
        `;
        document.body.appendChild(element);
        element.addEventListener("click", (event) => {
            if (event.target.closest("[data-privacy-accept]")) setConsent(ACCEPTED);
            if (event.target.closest("[data-privacy-decline]")) setConsent(DECLINED);
        });
        return element;
    }

    function hideBanner() {
        const element = document.getElementById("mc-privacy-banner");
        if (element) element.classList.remove("is-visible");
    }

    function showBanner() {
        if (!lastAnalyticsEnabled || getConsent()) return;
        banner().classList.add("is-visible");
    }

    function applySettings(settings = {}) {
        const analytics = settings.analytics || window.CONFIG?.ANALYTICS || {};
        lastAnalyticsEnabled = Boolean(analytics.enabled && (analytics.ga4MeasurementId || analytics.clarityProjectId));
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", showBanner, { once: true });
        } else {
            showBanner();
        }
    }

    function openPreferences() {
        try {
            localStorage.removeItem(CONSENT_KEY);
        } catch {
            // Ignorar.
        }
        showBanner();
    }

    window.MommyPrivacyConsent = Object.freeze({
        getConsent,
        hasAnalyticsConsent: () => getConsent() === ACCEPTED,
        accept: () => setConsent(ACCEPTED),
        decline: () => setConsent(DECLINED),
        openPreferences
    });

    document.addEventListener("site:settings-applied", (event) => applySettings(event.detail || {}));
    document.addEventListener("DOMContentLoaded", () => {
        applySettings(window.CONFIG || {});
        document.querySelectorAll("[data-open-privacy-preferences]").forEach((button) => {
            button.addEventListener("click", openPreferences);
        });
    }, { once: true });
})();
