"use strict";

(function () {
    const CONSENT_KEY = "mc_analytics_consent";
    const CONSENT_ACCEPTED = "accepted";
    const CONSENT_DECLINED = "declined";

    const state = {
        enabled: false,
        ga4MeasurementId: "",
        clarityProjectId: "",
        anonymizeIp: true,
        trackEcommerce: true,
        gaLoaded: false,
        clarityLoaded: false,
        pending: []
    };

    const GA4_RE = /^G-[A-Z0-9]{4,24}$/;
    const CLARITY_RE = /^[A-Za-z0-9_-]{4,64}$/;
    const loadedScripts = new Set();

    function cleanText(value, max = 180) {
        return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
    }

    function cleanNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) ? Math.max(0, number) : 0;
    }

    function currency() {
        return window.CONFIG?.currency || "CLP";
    }

    function pagePath() {
        return `${location.pathname}${location.search}` || "/";
    }

    function consentValue() {
        try {
            return localStorage.getItem(CONSENT_KEY) || "";
        } catch {
            return "";
        }
    }

    function analyticsAllowed() {
        return consentValue() === CONSENT_ACCEPTED;
    }

    function analyticsDeclined() {
        return consentValue() === CONSENT_DECLINED;
    }

    function appendExternalScript(id, src) {
        if (!src || loadedScripts.has(id) || document.getElementById(id)) return;
        loadedScripts.add(id);
        const script = document.createElement("script");
        script.id = id;
        script.async = true;
        script.src = src;
        document.head.appendChild(script);
    }

    function ecommerceItem(item = {}, index = 0) {
        const product = item.product || item;
        const id = cleanText(product.id || product._id || product.productId || item.productId || product.slug || item.productSlug || "", 100);
        const name = cleanText(product.nombre || product.name || item.name || "Producto", 160);
        const category = cleanText(product.categoria || product.category || item.category || (Array.isArray(product.categorias) ? product.categorias[0] : ""), 100);
        const variant = cleanText(item.variant || item.variante || item.variantName || item.customization?.productVariant || product.variante || "", 100);
        const price = cleanNumber(product.precio || product.price || item.price || item.precio);
        const quantity = Math.max(1, Number(item.quantity || item.cantidad || 1) || 1);
        const result = {
            item_id: id || name,
            item_name: name,
            index,
            price,
            quantity
        };
        if (category) result.item_category = category;
        if (variant) result.item_variant = variant;
        return result;
    }

    function gaEvent(name, params = {}) {
        if (!state.gaLoaded || typeof window.gtag !== "function") return false;
        window.gtag("event", name, params);
        return true;
    }

    function clarityEvent(name) {
        if (!state.clarityLoaded || typeof window.clarity !== "function") return false;
        try {
            window.clarity("event", name);
            return true;
        } catch {
            return false;
        }
    }

    function flush() {
        if (!state.pending.length || !analyticsAllowed()) return;
        const events = state.pending.splice(0, state.pending.length);
        events.forEach(({ name, params }) => track(name, params));
    }

    function track(name, params = {}) {
        const eventName = cleanText(name, 80).replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
        if (!eventName || !state.enabled || !analyticsAllowed()) return;

        const payload = {
            page_location: location.href,
            page_path: pagePath(),
            ...params
        };

        const sentGa = gaEvent(eventName, payload);
        const sentClarity = clarityEvent(eventName);
        if (!sentGa && !sentClarity && state.pending.length < 30) {
            state.pending.push({ name: eventName, params: payload });
        }
    }

    function loadGoogleAnalytics() {
        const id = state.ga4MeasurementId;
        if (!analyticsAllowed() || !GA4_RE.test(id) || state.gaLoaded) return;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag("js", new Date());
        window.gtag("config", id, {
            anonymize_ip: state.anonymizeIp !== false,
            send_page_view: true,
            page_title: document.title,
            page_location: location.href
        });
        state.gaLoaded = true;
        appendExternalScript("mc-ga4-loader", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
        window.setTimeout(flush, 800);
    }

    function loadClarity() {
        const id = state.clarityProjectId;
        if (!analyticsAllowed() || !CLARITY_RE.test(id) || state.clarityLoaded) return;
        window.clarity = window.clarity || function () {
            (window.clarity.q = window.clarity.q || []).push(arguments);
        };
        state.clarityLoaded = true;
        appendExternalScript("mc-clarity-loader", `https://www.clarity.ms/tag/${encodeURIComponent(id)}`);
        window.setTimeout(flush, 800);
    }

    function apply(settings = {}) {
        const analytics = settings.analytics || window.CONFIG?.ANALYTICS || {};
        state.enabled = Boolean(analytics.enabled);
        state.ga4MeasurementId = cleanText(analytics.ga4MeasurementId || analytics.ga4Id || "", 32).toUpperCase();
        state.clarityProjectId = cleanText(analytics.clarityProjectId || analytics.clarityId || "", 64);
        state.anonymizeIp = analytics.anonymizeIp !== false;
        state.trackEcommerce = analytics.trackEcommerce !== false;

        if (!state.enabled || analyticsDeclined() || !analyticsAllowed()) return;
        loadGoogleAnalytics();
        loadClarity();
    }

    function trackProductList(products = [], listName = "Catálogo") {
        if (!state.trackEcommerce || !Array.isArray(products) || !products.length) return;
        track("view_item_list", {
            item_list_name: listName,
            items: products.slice(0, 20).map(ecommerceItem)
        });
    }

    function trackCurrentProduct(products = []) {
        if (!state.trackEcommerce || document.body?.dataset.page !== "product") return;
        const product = Array.isArray(products) ? products[0] : null;
        if (!product) return;
        const item = ecommerceItem(product, 0);
        track("view_item", {
            currency: currency(),
            value: item.price || 0,
            items: [item]
        });
    }

    function trackCartAdded(detail = {}) {
        if (!state.trackEcommerce) return;
        const item = ecommerceItem(detail.product || detail.item || detail, 0);
        track("add_to_cart", {
            currency: currency(),
            value: (item.price || 0) * (item.quantity || 1),
            items: [item]
        });
    }

    function trackCheckoutStart() {
        if (!state.trackEcommerce) return;
        const items = typeof window.Cart?.read === "function" ? window.Cart.read() : [];
        track("begin_checkout", {
            currency: currency(),
            value: typeof window.Cart?.total === "function" ? cleanNumber(window.Cart.total()) : 0,
            items: items.slice(0, 20).map(ecommerceItem)
        });
    }

    function trackPurchase(order = {}) {
        if (!state.trackEcommerce || order.estadoPago !== "pagado") return;
        const rawItems = Array.isArray(order.items) ? order.items : Array.isArray(order.productos) ? order.productos : [];
        const value = cleanNumber(order.total || order.montoTotal || order.totalPago || order.monto || 0);
        track("purchase", {
            transaction_id: cleanText(order.numeroPedido || order.numero || order._id || order.id || "", 100),
            currency: currency(),
            value,
            shipping: cleanNumber(order.costoEnvio || order.envio?.costo || 0),
            items: rawItems.slice(0, 40).map(ecommerceItem)
        });
    }

    window.MommyAnalytics = Object.freeze({
        apply,
        track,
        trackProductList,
        trackCurrentProduct,
        trackCartAdded,
        trackCheckoutStart,
        trackPurchase,
        getState: () => ({ ...state, pending: state.pending.length, consent: consentValue() })
    });

    document.addEventListener("privacy:analytics-consent", () => apply(window.MommySiteSettings || window.CONFIG?.ANALYTICS || {}));
    document.addEventListener("site:settings-applied", (event) => apply(event.detail || {}));
    window.addEventListener("products:loaded", (event) => {
        const products = event.detail || [];
        trackCurrentProduct(products);
        if (document.body?.dataset.page === "catalog" || document.body?.dataset.page === "home") {
            trackProductList(products, document.body.dataset.page === "home" ? "Home" : "Catálogo");
        }
    });
    window.addEventListener("cart:item-added", (event) => trackCartAdded(event.detail || {}));
    window.addEventListener("payment:order-rendered", (event) => trackPurchase(event.detail || {}));

    document.addEventListener("submit", (event) => {
        if (event.target?.id === "form-pedido") trackCheckoutStart();
    }, true);

    document.addEventListener("click", (event) => {
        const link = event.target.closest?.("a[href*='wa.me'], a[href*='api.whatsapp.com']");
        if (link) track("contact_whatsapp", { link_url: link.href });
        const checkoutLink = event.target.closest?.("a[href*='finalizar-compra.html'], #btn-open-checkout, #checkout-mobile-pay-button");
        if (checkoutLink) track("checkout_click");
    }, true);

    document.addEventListener("DOMContentLoaded", () => apply(window.CONFIG?.ANALYTICS || {}), { once: true });
})();
