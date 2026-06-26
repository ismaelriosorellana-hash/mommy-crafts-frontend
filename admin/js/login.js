"use strict";

document.addEventListener(
    "DOMContentLoaded",
    () => {
        if (AdminAPI.getToken()) {
            location.replace(
                "index.html"
            );

            return;
        }

        const form =
            document.getElementById(
                "admin-login-form"
            );

        const button =
            document.getElementById(
                "admin-login-button"
            );

        const errorBox =
            document.getElementById(
                "admin-login-error"
            );

        const siteHost =
            document.getElementById(
                "admin-site-host"
            );

        const connectionStatus =
            document.getElementById(
                "admin-connection-status"
            );

        if (siteHost) {
            siteHost.textContent =
                location.hostname ||
                "Mommy Crafts";
        }

        if (connectionStatus) {
            const isLocal =
                ["localhost", "127.0.0.1"]
                    .includes(
                        location.hostname
                    );

            connectionStatus.textContent =
                location.protocol === "https:"
                    ? "Conexión HTTPS activa"
                    : isLocal
                        ? "Entorno local de desarrollo"
                        : "Conexión sin HTTPS";
        }

        const params =
            new URLSearchParams(
                location.search
            );

        if (
            params.get("sesion") ===
            "expirada"
        ) {
            errorBox.hidden = false;
            errorBox.textContent =
                "Tu sesión expiró. Vuelve a iniciar sesión.";
        }

        form.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                const email =
                    document.getElementById(
                        "admin-email"
                    ).value.trim();

                const password =
                    document.getElementById(
                        "admin-password"
                    ).value;

                const remember =
                    document.getElementById(
                        "admin-remember"
                    ).checked;

                errorBox.hidden = true;
                button.disabled = true;
                button.innerHTML = `
                    <span class="admin-spinner"></span>
                    Verificando...
                `;

                try {
                    const data =
                        await AdminAPI.login(
                            email,
                            password
                        );

                    AdminAPI.saveSession(
                        data.token,
                        data.usuario,
                        remember
                    );

                    location.replace(
                        "index.html"
                    );
                } catch (error) {
                    errorBox.hidden = false;
                    errorBox.textContent =
                        error.message;
                } finally {
                    button.disabled = false;
                    button.innerHTML = `
                        <i class="fa-solid fa-right-to-bracket"></i>
                        Iniciar sesión
                    `;
                }
            }
        );
    }
);
