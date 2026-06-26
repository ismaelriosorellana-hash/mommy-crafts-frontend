"use strict";

(function () {
    const TOKEN_KEY = "mommycrafts_customer_token";
    const USER_KEY = "mommycrafts_customer_user";

    function getToken() {
        return (
            localStorage.getItem(TOKEN_KEY) ||
            sessionStorage.getItem(TOKEN_KEY) ||
            ""
        );
    }

    function getUser() {
        const raw =
            localStorage.getItem(USER_KEY) ||
            sessionStorage.getItem(USER_KEY);

        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    function activeStorage() {
        return localStorage.getItem(TOKEN_KEY)
            ? localStorage
            : sessionStorage;
    }

    function clearSession() {
        for (const storage of [localStorage, sessionStorage]) {
            storage.removeItem(TOKEN_KEY);
            storage.removeItem(USER_KEY);
        }
    }

    function saveSession(token, user, remember = false) {
        clearSession();
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(TOKEN_KEY, token);
        storage.setItem(USER_KEY, JSON.stringify(user));
        renderAccountMenu();
    }

    function saveUser(user) {
        const storage = activeStorage();
        storage.setItem(USER_KEY, JSON.stringify(user));
        renderAccountMenu();
    }

    async function authRequest(endpoint, options = {}) {
        try {
            return await API.request(endpoint, options);
        } catch (error) {
            if (error.status === 401) {
                clearSession();
                renderAccountMenu();
            }
            throw error;
        }
    }

    async function login(email, password, remember = false) {
        const data = await API.request("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password,
                area: "cliente"
            })
        });

        saveSession(data.token, data.usuario, remember);
        return data.usuario;
    }

    async function register(payload, remember = true) {
        const data = await API.request("/auth/registro", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        saveSession(data.token, data.usuario, remember);
        return data.usuario;
    }

    async function getProfile() {
        const data = await authRequest("/cuenta/perfil");
        saveUser(data.usuario);
        return data.usuario;
    }

    async function updateProfile(payload) {
        const data = await authRequest("/cuenta/perfil", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        saveUser(data.usuario);
        return data.usuario;
    }

    async function getOrders() {
        return authRequest("/cuenta/pedidos");
    }

    async function getOrder(id) {
        return authRequest(`/cuenta/pedidos/${encodeURIComponent(id)}`);
    }

    async function createPaymentPreference(orderId) {
        return authRequest(
            `/pagos/mercadopago/pedidos/${encodeURIComponent(orderId)}/preferencia`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: "{}"
            }
        );
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function renderAccountMenu() {
        document
            .querySelectorAll("[data-customer-account-menu]")
            .forEach((element) => element.remove());

        const actions = document.querySelector(".navbar-actions");
        if (!actions) return;

        const user = getUser();
        const loggedIn = Boolean(getToken() && user?.rol === "cliente");
        const firstName = String(user?.nombre || "Cliente")
            .trim()
            .split(/\s+/)[0];

        const menu = document.createElement("details");
        menu.className = "customer-account-menu";
        menu.dataset.customerAccountMenu = "";

        menu.innerHTML = `
            <summary class="icon-btn account-button" aria-label="Acceso de usuarios">
                <i class="fa-${loggedIn ? "solid" : "regular"} fa-circle-user" aria-hidden="true"></i>
                ${loggedIn ? '<span class="account-online-dot" aria-hidden="true"></span>' : ""}
            </summary>
            <div class="customer-account-dropdown">
                <div class="customer-account-heading">
                    <strong>${loggedIn ? `Hola, ${escapeHtml(firstName)}` : "Acceso de usuarios"}</strong>
                    <span>${loggedIn ? escapeHtml(user.email) : "Cuenta de clientes"}</span>
                </div>
                ${loggedIn ? `
                    <a href="cuenta.html#perfil">
                        <i class="fa-regular fa-user"></i>
                        Mi cuenta
                    </a>
                    <a href="cuenta.html#pedidos">
                        <i class="fa-solid fa-bag-shopping"></i>
                        Mis pedidos
                    </a>
                    <button type="button" data-customer-logout>
                        <i class="fa-solid fa-right-from-bracket"></i>
                        Cerrar sesión
                    </button>
                ` : `
                    <a href="acceso.html?modo=login">
                        <i class="fa-solid fa-right-to-bracket"></i>
                        Iniciar sesión
                    </a>
                    <a href="acceso.html?modo=registro">
                        <i class="fa-regular fa-address-card"></i>
                        Crear cuenta
                    </a>
                `}
            </div>
        `;

        actions.insertBefore(menu, actions.firstChild);

        menu.querySelector("[data-customer-logout]")
            ?.addEventListener("click", () => {
                clearSession();
                location.href = "index.html";
            });
    }

    function requireCustomer() {
        if (!getToken() || getUser()?.rol !== "cliente") {
            const next = encodeURIComponent(
                location.pathname.split("/").pop() + location.search
            );
            location.replace(`acceso.html?modo=login&next=${next}`);
            return false;
        }
        return true;
    }

    window.CustomerAuth = Object.freeze({
        getToken,
        getUser,
        saveSession,
        saveUser,
        clearSession,
        login,
        register,
        getProfile,
        updateProfile,
        getOrders,
        getOrder,
        createPaymentPreference,
        renderAccountMenu,
        requireCustomer
    });

    document.addEventListener("DOMContentLoaded", renderAccountMenu);
})();
