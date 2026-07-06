"use strict";

(function () {
    const TOKEN_KEY =
        "mommycrafts_customer_token";

    const USER_KEY =
        "mommycrafts_customer_user";

    function clearLegacyPersistentSession() {
        localStorage.removeItem(
            TOKEN_KEY
        );

        localStorage.removeItem(
            USER_KEY
        );
    }

    clearLegacyPersistentSession();

    function getToken() {
        return (
            sessionStorage.getItem(
                TOKEN_KEY
            ) || ""
        );
    }

    function getUser() {
        const raw =
            sessionStorage.getItem(
                USER_KEY
            );

        if (!raw) return null;

        try {
            return JSON.parse(
                raw
            );
        } catch {
            clearSession();
            return null;
        }
    }

    function clearSession() {
        sessionStorage.removeItem(
            TOKEN_KEY
        );

        sessionStorage.removeItem(
            USER_KEY
        );

        localStorage.removeItem(
            TOKEN_KEY
        );

        localStorage.removeItem(
            USER_KEY
        );
    }

    function saveSession(
        token,
        user
    ) {
        clearSession();

        sessionStorage.setItem(
            TOKEN_KEY,
            token
        );

        sessionStorage.setItem(
            USER_KEY,
            JSON.stringify(
                user
            )
        );

        renderAccountMenu();
    }

    function saveUser(user) {
        if (!getToken()) return;

        sessionStorage.setItem(
            USER_KEY,
            JSON.stringify(
                user
            )
        );

        renderAccountMenu();
    }

    async function authRequest(
        endpoint,
        options = {}
    ) {
        try {
            return await API.request(
                endpoint,
                options
            );
        } catch (error) {
            if (
                error.status ===
                401
            ) {
                clearSession();
                renderAccountMenu();
            }

            throw error;
        }
    }

    async function login(
        email,
        password
    ) {
        const data =
            await API.request(
                "/auth/login",
                {
                    method:
                        "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify({
                            email,
                            password,
                            area:
                                "cliente"
                        })
                }
            );

        saveSession(
            data.token,
            data.usuario
        );

        return data.usuario;
    }

    async function register(
        payload
    ) {
        const data =
            await API.request(
                "/auth/registro",
                {
                    method:
                        "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        saveSession(
            data.token,
            data.usuario
        );

        return data.usuario;
    }

    async function getProfile() {
        const data =
            await authRequest(
                "/cuenta/perfil"
            );

        saveUser(
            data.usuario
        );

        return data.usuario;
    }

    async function updateProfile(
        payload
    ) {
        const data =
            await authRequest(
                "/cuenta/perfil",
                {
                    method:
                        "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        saveUser(
            data.usuario
        );

        return data.usuario;
    }

    async function changePassword(
        currentPassword,
        newPassword
    ) {
        const data =
            await authRequest(
                "/auth/cambiar-password",
                {
                    method:
                        "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify({
                            passwordActual:
                                currentPassword,
                            passwordNueva:
                                newPassword
                        })
                }
            );

        saveSession(
            data.token,
            data.usuario
        );

        return data;
    }

    async function revokeSessions() {
        const data =
            await authRequest(
                "/auth/revocar-sesiones",
                {
                    method:
                        "POST"
                }
            );

        clearSession();
        renderAccountMenu();

        return data;
    }

    async function getOrders() {
        return authRequest(
            "/cuenta/pedidos"
        );
    }

    async function getOrder(id) {
        return authRequest(
            `/cuenta/pedidos/${encodeURIComponent(id)}`
        );
    }

    async function cancelOrder(
        orderId
    ) {
        return authRequest(
            `/cuenta/pedidos/${encodeURIComponent(orderId)}/cancelar`,
            {
                method:
                    "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: "{}"
            }
        );
    }

    async function createPaymentPreference(
        orderId
    ) {
        return authRequest(
            `/pagos/mercadopago/pedidos/${encodeURIComponent(orderId)}/preferencia`,
            {
                method:
                    "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: "{}"
            }
        );
    }

    function escapeHtml(value) {
        return String(
            value ?? ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );
    }

    function renderAccountMenu() {
        document
            .querySelectorAll(
                "[data-customer-account-menu]"
            )
            .forEach(
                (element) =>
                    element.remove()
            );

        const actions =
            document.querySelector(
                ".navbar-actions"
            );

        if (!actions) return;

        const user =
            getUser();

        const loggedIn =
            Boolean(
                getToken() &&
                user?.rol ===
                    "cliente"
            );

        const firstName =
            String(
                user?.nombre ||
                "Cliente"
            )
                .trim()
                .split(/\s+/)[0];

        const menu =
            document.createElement(
                "details"
            );

        menu.className =
            "customer-account-menu";

        menu.dataset
            .customerAccountMenu =
            "";

        menu.innerHTML = `
            <summary class="icon-btn account-button account-session-chip ${loggedIn ? "is-logged-in" : ""}" aria-label="${loggedIn ? `Cuenta de ${escapeHtml(firstName)} con sesión activa` : "Iniciar sesión o crear una cuenta"}">
                <span class="account-session-icon" aria-hidden="true">
                    <i class="fa-${loggedIn ? "solid" : "regular"} fa-circle-user"></i>
                    ${loggedIn ? '<span class="account-online-dot"></span>' : ""}
                </span>
                <span class="account-session-copy">
                    <strong>${loggedIn ? escapeHtml(firstName) : "Ingresar"}</strong>
                    <small>${loggedIn ? "Sesión activa" : "Cuenta cliente"}</small>
                </span>
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
                    <a href="cuenta.html#seguridad-cuenta">
                        <i class="fa-solid fa-shield-halved"></i>
                        Seguridad
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

        actions.insertBefore(
            menu,
            actions.firstChild
        );

        menu
            .querySelector(
                "[data-customer-logout]"
            )
            ?.addEventListener(
                "click",
                () => {
                    clearSession();

                    location.href =
                        "index.html";
                }
            );
    }

    function requireCustomer() {
        if (
            !getToken() ||
            getUser()?.rol !==
                "cliente"
        ) {
            const next =
                encodeURIComponent(
                    location.pathname
                        .split("/")
                        .pop() +
                    location.search
                );

            location.replace(
                `acceso.html?modo=login&next=${next}`
            );

            return false;
        }

        return true;
    }

    window.CustomerAuth =
        Object.freeze({
            getToken,
            getUser,
            saveSession,
            saveUser,
            clearSession,
            login,
            register,
            getProfile,
            updateProfile,
            changePassword,
            revokeSessions,
            getOrders,
            getOrder,
            cancelOrder,
            createPaymentPreference,
            renderAccountMenu,
            requireCustomer
        });

    document.addEventListener(
        "DOMContentLoaded",
        renderAccountMenu
    );
})();
