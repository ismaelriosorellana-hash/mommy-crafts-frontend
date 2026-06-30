"use strict";

(function () {
    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function money(value) {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    function dateTime(value) {
        if (!value) return "—";
        return new Intl.DateTimeFormat("es-CL", {
            dateStyle: "medium",
            timeStyle: "short"
        }).format(new Date(value));
    }

    function dateOnlyDisplay(value) {
        if (!value) return "—";
        return new Intl.DateTimeFormat("es-CL", {
            dateStyle: "long",
            timeZone: "America/Santiago"
        }).format(new Date(value));
    }

    function statusLabel(value) {
        const labels = {
            pendiente: "Pendiente",
            pendiente_comprobante: "Pendiente de comprobante",
            comprobante_recibido: "Comprobante recibido",
            en_revision: "Comprobante en revisión",
            confirmado: "Confirmado",
            validacion_diseno: "Validación de diseño",
            en_produccion: "En producción",
            listo: "Listo para entrega",
            enviado: "Enviado",
            entregado: "Entregado",
            cancelado: "Cancelado",
            pagado: "Pagado",
            rechazado: "Pago rechazado",
            vencido: "Plazo vencido",
            reembolsado: "Reembolsado",
            enviado_diseno: "Diseño enviado",
            diseno_enviado: "Diseño enviado",
            diseno_aprobado: "Diseño aprobado",
            cambios_solicitados: "Cambios solicitados",
            corregido: "Diseño corregido",
            aprobado: "Aprobado",
            stock_reservado: "Stock reservado",
            comprobante_rechazado: "Comprobante rechazado",
            plazo_extendido: "Plazo extendido"
        };
        return labels[value] || value || "Pendiente";
    }

    function showAlert(element, message, success = false) {
        if (!element) return;
        element.hidden = !message;
        element.textContent = message || "";
        element.classList.toggle("success", success);
    }

    function nextUrl() {
        const params = new URLSearchParams(location.search);
        const candidate = params.get("next") || "cuenta.html";

        if (
            candidate.startsWith("//") ||
            candidate.includes("..") ||
            !/^[a-z0-9][a-z0-9._/-]*(?:\?[^#]*)?(?:#.*)?$/i.test(candidate)
        ) {
            return "cuenta.html";
        }

        return candidate;
    }

    function initAccess() {
        if (CustomerAuth.getToken() && CustomerAuth.getUser()?.rol === "cliente") {
            location.replace(nextUrl());
            return;
        }

        const tabs = document.querySelectorAll("[data-auth-tab]");
        const loginPanel = document.getElementById("login-panel");
        const registerPanel = document.getElementById("register-panel");

        function select(mode) {
            const registration = mode === "registro";
            loginPanel.hidden = registration;
            registerPanel.hidden = !registration;
            tabs.forEach((tab) => {
                tab.classList.toggle(
                    "active",
                    tab.dataset.authTab === mode
                );
            });
        }

        tabs.forEach((tab) => {
            tab.addEventListener("click", () => select(tab.dataset.authTab));
        });

        const accessParams = new URLSearchParams(location.search);
        select(accessParams.get("modo") === "registro" ? "registro" : "login");

        if (accessParams.get("sesion") === "revocada") {
            showAlert(
                document.getElementById("login-error"),
                "Todas las sesiones fueron cerradas. Inicia sesión nuevamente.",
                true
            );
        }

        if (accessParams.get("sesion") === "expirada") {
            showAlert(
                document.getElementById("login-error"),
                "La sesión expiró o dejó de ser válida. Inicia sesión nuevamente."
            );
        }

        document.getElementById("customer-login-form")
            ?.addEventListener("submit", async (event) => {
                event.preventDefault();
                const button = document.getElementById("customer-login-submit");
                const errorBox = document.getElementById("login-error");
                showAlert(errorBox, "");
                button.disabled = true;
                button.textContent = "Ingresando...";

                try {
                    await CustomerAuth.login(
                        document.getElementById("customer-login-email").value.trim(),
                        document.getElementById("customer-login-password").value
                    );
                    location.replace(nextUrl());
                } catch (error) {
                    showAlert(errorBox, error.message);
                } finally {
                    button.disabled = false;
                    button.textContent = "Iniciar sesión";
                }
            });

        document.getElementById("customer-register-form")
            ?.addEventListener("submit", async (event) => {
                event.preventDefault();
                const button = document.getElementById("customer-register-submit");
                const errorBox = document.getElementById("register-error");
                const password = document.getElementById("customer-register-password").value;
                const confirmation = document.getElementById("customer-register-confirm").value;
                showAlert(errorBox, "");

                if (password !== confirmation) {
                    showAlert(errorBox, "Las contraseñas no coinciden.");
                    return;
                }

                button.disabled = true;
                button.textContent = "Creando cuenta...";

                try {
                    await CustomerAuth.register({
                        nombre: document.getElementById("customer-register-name").value.trim(),
                        email: document.getElementById("customer-register-email").value.trim(),
                        telefono: document.getElementById("customer-register-phone").value.trim(),
                        password
                    });
                    location.replace(nextUrl());
                } catch (error) {
                    showAlert(errorBox, error.message);
                } finally {
                    button.disabled = false;
                    button.textContent = "Crear mi cuenta";
                }
            });
    }

    function orderCard(order) {
        return `
            <article class="account-order-card">
                <div>
                    <h3>${escapeHtml(order.numeroPedido)}</h3>
                    <div class="account-order-meta">
                        <span><i class="fa-regular fa-calendar"></i> ${dateTime(order.fecha)}</span>
                        <span><i class="fa-solid fa-box"></i> ${Number(order.cantidadProductos) || 0} producto(s)</span>
                        <span><i class="fa-solid fa-truck"></i> ${order.metodoEntrega === "retiro" ? "Retiro" : "Envío"}</span>
                    </div>
                    <p>
                        <span class="account-status">${statusLabel(order.estadoPedido)}</span>
                        <span class="account-status">${statusLabel(order.estadoPago)}</span>
                    </p>
                    ${order.venceAt && order.estadoPago === "pendiente_comprobante" ? `
                        <p class="account-order-deadline">
                            Comprobante hasta ${dateTime(order.venceAt)}
                        </p>
                    ` : ""}
                </div>
                <div class="account-order-total">
                    <strong>${money(order.total)}</strong>
                    <a class="btn-secondary" href="pedido.html?id=${encodeURIComponent(order.id)}">Ver detalle</a>
                    ${order.puedePagar ? `
                        <button class="btn-primary customer-pay-button" type="button" data-pay-order="${escapeHtml(order.id)}">
                            Pagar con Mercado Pago
                        </button>
                    ` : ""}
                </div>
            </article>
        `;
    }

    async function initAccount() {
        if (!CustomerAuth.requireCustomer()) return;

        const list = document.getElementById("customer-orders-list");
        const form = document.getElementById("customer-profile-form");
        const errorBox = document.getElementById("profile-error");
        const successBox = document.getElementById("profile-success");
        const passwordForm = document.getElementById("customer-password-form");
        const passwordError = document.getElementById("password-error");
        const passwordSuccess = document.getElementById("password-success");
        const revokeButton = document.getElementById("customer-revoke-sessions");

        try {
            const [user, ordersData] = await Promise.all([
                CustomerAuth.getProfile(),
                CustomerAuth.getOrders()
            ]);

            document.getElementById("account-welcome").textContent =
                `Hola, ${String(user.nombre).split(/\s+/)[0]}`;
            document.getElementById("profile-email").textContent = user.email;
            document.getElementById("profile-name").value = user.nombre || "";
            document.getElementById("profile-rut").value = user.rut || "";
            document.getElementById("profile-phone").value = user.telefono || "";
            document.getElementById("profile-address").value = user.direccion || "";
            document.getElementById("profile-commune").value = user.comuna || "";

            const orders = ordersData.pedidos || [];
            list.innerHTML = orders.length
                ? orders.map(orderCard).join("")
                : `
                    <div class="account-empty">
                        <i class="fa-solid fa-bag-shopping"></i>
                        <p>Todavía no tienes pedidos vinculados a esta cuenta.</p>
                        <a class="btn-primary" href="catalogo.html">Explorar productos</a>
                    </div>
                `;

            list.addEventListener("click", async (event) => {
                const button = event.target.closest("[data-pay-order]");
                if (!button) return;

                button.disabled = true;
                const original = button.textContent;
                button.textContent = "Preparando pago...";

                try {
                    const result = await CustomerAuth.createPaymentPreference(
                        button.dataset.payOrder
                    );
                    sessionStorage.setItem(
                        "mommycrafts_pending_payment",
                        JSON.stringify({
                            pedidoId: button.dataset.payOrder
                        })
                    );
                    location.href = result.checkoutUrl;
                } catch (error) {
                    alert(error.message || "No fue posible iniciar el pago.");
                    button.disabled = false;
                    button.textContent = original;
                }
            });
        } catch (error) {
            if (error.status === 401) {
                location.replace("acceso.html?modo=login&sesion=expirada");
                return;
            }
            list.innerHTML = `<div class="account-alert">${escapeHtml(error.message)}</div>`;
        }

        form?.addEventListener("submit", async (event) => {
            event.preventDefault();
            const button = document.getElementById("profile-submit");
            showAlert(errorBox, "");
            showAlert(successBox, "");
            button.disabled = true;
            button.textContent = "Guardando...";

            try {
                const user = await CustomerAuth.updateProfile({
                    nombre: document.getElementById("profile-name").value.trim(),
                    rut: document.getElementById("profile-rut").value.trim(),
                    telefono: document.getElementById("profile-phone").value.trim(),
                    direccion: document.getElementById("profile-address").value.trim(),
                    comuna: document.getElementById("profile-commune").value.trim()
                });
                document.getElementById("account-welcome").textContent =
                    `Hola, ${String(user.nombre).split(/\s+/)[0]}`;
                showAlert(successBox, "Tus datos se guardaron correctamente.", true);
            } catch (error) {
                showAlert(errorBox, error.message);
            } finally {
                button.disabled = false;
                button.textContent = "Guardar cambios";
            }
        });

        passwordForm?.addEventListener("submit", async (event) => {
            event.preventDefault();

            const currentPassword =
                document.getElementById("password-current").value;

            const newPassword =
                document.getElementById("password-new").value;

            const confirmation =
                document.getElementById("password-confirm").value;

            const button =
                document.getElementById("password-submit");

            showAlert(passwordError, "");
            showAlert(passwordSuccess, "");

            if (newPassword !== confirmation) {
                showAlert(
                    passwordError,
                    "La confirmación no coincide con la nueva contraseña."
                );
                return;
            }

            button.disabled = true;
            button.textContent = "Actualizando...";

            try {
                const data = await CustomerAuth.changePassword(
                    currentPassword,
                    newPassword
                );

                passwordForm.reset();

                showAlert(
                    passwordSuccess,
                    data.mensaje ||
                        "La contraseña se actualizó correctamente.",
                    true
                );
            } catch (error) {
                showAlert(
                    passwordError,
                    error.message
                );
            } finally {
                button.disabled = false;
                button.textContent = "Cambiar contraseña";
            }
        });

        revokeButton?.addEventListener("click", async () => {
            const confirmed = window.confirm(
                "Se cerrarán todas las sesiones de esta cuenta, incluida la actual. ¿Continuar?"
            );

            if (!confirmed) return;

            revokeButton.disabled = true;
            revokeButton.textContent = "Cerrando sesiones...";

            try {
                await CustomerAuth.revokeSessions();
                location.replace("acceso.html?modo=login&sesion=revocada");
            } catch (error) {
                showAlert(
                    passwordError,
                    error.message
                );
                revokeButton.disabled = false;
                revokeButton.textContent = "Cerrar todas mis sesiones";
            }
        });
    }

    function customizationType(customization) {
        if (!customization || typeof customization !== "object") {
            return { type: "ninguna", label: "Sin personalización" };
        }

        const type = customization.type === "light" ? "simple" : "avanzada";
        const texts = [
            customization.requestedName,
            customization.mainText,
            customization.secondaryText,
            customization.texts?.main?.value,
            customization.texts?.secondary?.value
        ].filter((value) => String(value || "").trim());

        const simpleAssets = Array.isArray(customization.assets?.images)
            ? customization.assets.images
            : [];

        const imageCount =
            simpleAssets.length ||
            (customization.assets?.original || customization.image?.asset ? 1 : 0) ||
            (Array.isArray(customization.imageNames) ? customization.imageNames.length : 0) ||
            (customization.imageName ? 1 : 0);

        const elements = [];
        if (texts.length) elements.push(texts.length > 1 ? `${texts.length} textos` : "Texto");
        if (imageCount) elements.push(imageCount > 1 ? `${imageCount} imágenes` : "Imagen");
        if (customization.observation || customization.instructions) elements.push("Indicaciones");

        return {
            type,
            label: elements.join(" + ") || "Opciones seleccionadas"
        };
    }

    function customizationBlock(customization, summary) {
        if (!customization || typeof customization !== "object") return "";

        const info = summary?.tipo
            ? {
                type: summary.tipo,
                label: summary.descripcion
            }
            : customizationType(customization);

        const preview =
            summary?.vistaPrevia ||
            customization.assets?.preview?.url ||
            customization.assets?.finalPreview?.url ||
            customization.finalPreview?.asset?.url ||
            customization.finalPreviewUrl ||
            "";

        const simpleAssets = Array.isArray(customization.assets?.images)
            ? customization.assets.images
            : [];

        const original =
            customization.assets?.original ||
            customization.image?.asset;

        const textValues = [
            customization.requestedName,
            customization.mainText,
            customization.secondaryText,
            customization.texts?.main?.value,
            customization.texts?.secondary?.value
        ].filter((value) => String(value || "").trim());

        return `
            <div class="customer-personalization-block">
                <p>
                    <strong>
                        Personalización ${escapeHtml(info.type)}: ${escapeHtml(info.label)}
                    </strong>
                </p>

                ${textValues.map((value) => `
                    <p>Texto: ${escapeHtml(value)}</p>
                `).join("")}

                ${customization.observation ? `
                    <p>Indicaciones: ${escapeHtml(customization.observation)}</p>
                ` : ""}

                ${customization.instructions ? `
                    <p>Indicaciones: ${escapeHtml(customization.instructions)}</p>
                ` : ""}

                <div class="customer-personalization-assets">
                    ${preview ? `
                        <a href="${escapeHtml(preview)}" target="_blank" rel="noopener">
                            <img class="customer-personalization-preview" src="${escapeHtml(preview)}" alt="Vista previa de la personalización">
                        </a>
                    ` : ""}

                    ${simpleAssets.map((asset) => `
                        <a href="${escapeHtml(asset.url)}" target="_blank" rel="noopener">
                            <img class="customer-personalization-preview" src="${escapeHtml(asset.url)}" alt="Imagen enviada por el cliente">
                        </a>
                    `).join("")}

                    ${original?.url && !simpleAssets.length ? `
                        <a href="${escapeHtml(original.url)}" target="_blank" rel="noopener">
                            <img class="customer-personalization-preview" src="${escapeHtml(original.url)}" alt="Imagen enviada por el cliente">
                        </a>
                    ` : ""}
                </div>
            </div>
        `;
    }

    function designApprovalBlock(item) {
        const design = item.disenoFinal || {};
        const personalized = item.personalizacionResumen?.tipo !== "ninguna";

        if (!personalized) return "";

        if (!design.asset?.url) {
            return `
                <div class="customer-design-status">
                    <strong>Diseño final:</strong>
                    pendiente de envío por Mommy Crafts.
                </div>
            `;
        }

        const canRespond = ["enviado", "corregido"].includes(design.estado);

        return `
            <section class="customer-design-review" data-line-id="${escapeHtml(item.lineaId)}">
                <h4>Diseño final para aprobación</h4>

                <a href="${escapeHtml(design.asset.url)}" target="_blank" rel="noopener">
                    <img src="${escapeHtml(design.asset.url)}" alt="Diseño final enviado por Mommy Crafts">
                </a>

                <p>${escapeHtml(design.mensaje || "Revisa el diseño y confirma si está correcto.")}</p>
                <p>Estado: <strong>${statusLabel(design.estado || "pendiente")}</strong></p>

                ${design.observacionesCliente ? `
                    <p>Tu respuesta: ${escapeHtml(design.observacionesCliente)}</p>
                ` : ""}

                ${canRespond ? `
                    <textarea
                        class="design-observations"
                        maxlength="1500"
                        placeholder="Describe aquí los cambios que necesitas"
                    ></textarea>

                    <div class="customer-design-actions">
                        <button class="btn-primary design-response" data-action="aprobar" type="button">
                            Aprobar diseño
                        </button>
                        <button class="btn-secondary design-response" data-action="solicitar_cambios" type="button">
                            Solicitar cambios
                        </button>
                    </div>
                ` : ""}
            </section>
        `;
    }

    function itemBlock(item) {
        return `
            <article class="customer-order-item">
                <img src="${escapeHtml(item.imagen || CONFIG.placeholderImage)}" alt="${escapeHtml(item.nombre)}">

                <div>
                    <h3>${escapeHtml(item.nombre)}</h3>
                    <p>Cantidad: ${Number(item.cantidad) || 1}</p>
                    ${item.color ? `<p>Color: ${escapeHtml(item.color)}</p>` : ""}
                    ${item.talla || item.personalizacion?.talla || item.personalizacion?.size ? `<p>Talla: ${escapeHtml(item.talla || item.personalizacion?.talla || item.personalizacion?.size)}</p>` : ""}
                    ${customizationBlock(item.personalizacion, item.personalizacionResumen)}
                    ${designApprovalBlock(item)}
                </div>

                <strong>${money(item.subtotal)}</strong>
            </article>
        `;
    }

    function transferBlock(order) {
        if (order.metodoPago !== "transferencia") return "";

        const pending =
            ["pendiente_comprobante", "rechazado"].includes(order.estadoPago) &&
            order.estadoPedido !== "cancelado";

        const receipt = order.transferencia?.comprobante;
        const whatsappMessage = encodeURIComponent(
            `Hola, necesito ayuda con el pago del pedido ${order.numeroPedido}.`
        );
        const whatsappUrl = `${CONFIG.social?.whatsapp || "https://wa.me/56954633848"}?text=${whatsappMessage}`;

        return `
            <section class="account-detail-card customer-transfer-card">
                <h2>Pago por transferencia</h2>
                <p>Estado: <span class="account-status">${statusLabel(order.estadoPago)}</span></p>

                ${order.transferencia?.venceAt && pending ? `
                    <p class="transfer-deadline">
                        Tienes plazo para cargar el comprobante hasta:
                        <strong>${dateTime(order.transferencia.venceAt)}</strong>
                    </p>
                ` : ""}

                <div class="transfer-security-notice">
                    <strong>Antes de transferir</strong>
                    <p>
                        ${escapeHtml(
                            CONFIG.PAYMENT?.bankDetailsMessage ||
                            "Los datos bancarios se entregarán únicamente mediante un canal oficial de Mommy Crafts."
                        )}
                    </p>
                    <p>
                        El comprobante no confirma el pago automáticamente. La tienda verificará el abono antes de iniciar la preparación o validación del diseño.
                    </p>
                </div>

                ${receipt?.url ? `
                    <p class="receipt-file-link">
                        <a href="${escapeHtml(receipt.url)}" target="_blank" rel="noopener">
                            Ver comprobante enviado
                        </a>
                    </p>
                ` : ""}

                ${pending ? `
                    <form class="receipt-upload-form" enctype="multipart/form-data">
                        <label for="receipt-file">Subir comprobante</label>
                        <input
                            id="receipt-file"
                            type="file"
                            name="archivo"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            required
                        >
                        <small>JPG, PNG, WEBP o PDF. Máximo 8 MB.</small>
                        <button class="btn-primary" type="submit">
                            Enviar comprobante
                        </button>
                    </form>
                ` : ""}

                <div class="transfer-help-actions">
                    <a class="btn-secondary" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener">
                        Coordinar por WhatsApp
                    </a>
                </div>

                <p class="account-help-text">
                    Cuando el comprobante sea validado, el estado cambiará a “Pagado”. Los productos personalizados pasarán luego a revisión del diseño.
                </p>
            </section>
        `;
    }


    function mercadoPagoBlock(order) {
        if (order.metodoPago !== "mercadopago") return "";

        const canPay =
            order.estadoPago !== "pagado" &&
            order.estadoPedido !== "cancelado";

        return `
            <section class="account-detail-card customer-mercadopago-card">
                <h2>Pago con Mercado Pago</h2>
                <p>Estado: <span class="account-status">${statusLabel(order.estadoPago)}</span></p>
                <p>
                    ${order.estadoPago === "pagado"
                        ? "Mercado Pago confirmó el pago correctamente."
                        : "Completa el pago en el entorno seguro de Mercado Pago. El estado se actualizará automáticamente."}
                </p>
                ${order.mercadoPago?.paymentId ? `
                    <p>ID de pago: <strong>${escapeHtml(order.mercadoPago.paymentId)}</strong></p>
                ` : ""}
                ${canPay ? `
                    <button
                        class="btn-primary customer-mercadopago-pay"
                        type="button"
                        data-pay-mercadopago="${escapeHtml(order.id || order._id)}"
                    >
                        ${order.estadoPago === "rechazado" ? "Reintentar con Mercado Pago" : "Pagar con Mercado Pago"}
                    </button>
                ` : ""}
            </section>
        `;
    }


    function bindOrderActions(order, container) {
        container.querySelector(".receipt-upload-form")?.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                const button = event.currentTarget.querySelector("button");
                button.disabled = true;
                button.textContent = "Enviando comprobante...";

                try {
                    const formData = new FormData(event.currentTarget);

                    await API.request(
                        `/cuenta/pedidos/${encodeURIComponent(order.id || order._id)}/comprobante`,
                        {
                            method: "POST",
                            body: formData,
                            timeoutMs: 70000
                        }
                    );

                    alert("Comprobante recibido. Mommy Crafts revisará la transferencia.");
                    await initOrder();
                } catch (error) {
                    alert(error.message || "No fue posible enviar el comprobante.");
                    button.disabled = false;
                    button.textContent = "Enviar comprobante";
                }
            }
        );

        container.querySelector("[data-pay-mercadopago]")?.addEventListener(
            "click",
            async (event) => {
                const button = event.currentTarget;
                const original = button.textContent;
                button.disabled = true;
                button.textContent = "Preparando pago...";

                try {
                    const orderId = button.dataset.payMercadopago;
                    const result = await CustomerAuth.createPaymentPreference(orderId);
                    sessionStorage.setItem(
                        "mommycrafts_pending_payment",
                        JSON.stringify({
                            pedidoId: orderId,
                            numeroPedido: order.numeroPedido
                        })
                    );
                    location.href = result.checkoutUrl;
                } catch (error) {
                    alert(error.message || "No fue posible iniciar el pago.");
                    button.disabled = false;
                    button.textContent = original;
                }
            }
        );

        container.querySelectorAll(".design-response").forEach((button) => {
            button.addEventListener("click", async () => {
                const block = button.closest("[data-line-id]");
                const observations =
                    block.querySelector(".design-observations")?.value.trim() || "";

                if (
                    button.dataset.action === "solicitar_cambios" &&
                    !observations
                ) {
                    alert("Describe los cambios que necesitas.");
                    return;
                }

                button.disabled = true;

                try {
                    await API.request(
                        `/cuenta/pedidos/${encodeURIComponent(order.id || order._id)}/items/${encodeURIComponent(block.dataset.lineId)}/diseno-respuesta`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                accion: button.dataset.action,
                                observaciones
                            })
                        }
                    );

                    await initOrder();
                } catch (error) {
                    alert(error.message || "No fue posible enviar tu respuesta.");
                    button.disabled = false;
                }
            });
        });
    }

    async function initOrder() {
        if (!CustomerAuth.requireCustomer()) return;

        const params = new URLSearchParams(location.search);
        const id = params.get("id") || params.get("pedido");
        const container = document.getElementById("customer-order-detail");

        if (!id) {
            container.innerHTML = `
                <section class="account-detail-card">
                    <p>Falta el identificador del pedido.</p>
                </section>
            `;
            return;
        }

        try {
            const data = await CustomerAuth.getOrder(id);
            const order = data.pedido;

            document.getElementById("customer-order-title").textContent =
                order.numeroPedido;

            document.getElementById("customer-order-date").textContent =
                `Creado el ${dateTime(order.createdAt)}`;

            const history = Array.isArray(order.historial)
                ? order.historial
                : [];

            const receiver = order.entrega?.receptorTercero;

            container.innerHTML = `
                <section>
                    <section class="account-detail-card">
                        <h2>Productos y personalizaciones</h2>
                        ${(order.items || []).map(itemBlock).join("")}
                    </section>

                    ${transferBlock(order)}
                    ${mercadoPagoBlock(order)}
                </section>

                <aside>
                    <section class="account-detail-card">
                        <h2>Resumen</h2>
                        <p>Estado: <span class="account-status">${statusLabel(order.estadoPedido)}</span></p>
                        <p>Pago: <span class="account-status">${statusLabel(order.estadoPago)}</span></p>
                        <p>Entrega: <strong>${order.entrega?.metodo === "retiro" ? "Retiro" : "Envío"}</strong></p>

                        ${order.entrega?.metodo === "envio" ? `
                            <p>
                                ${escapeHtml(order.entrega?.direccion || "")},
                                ${escapeHtml(order.entrega?.comuna || "")}
                            </p>
                        ` : ""}

                        ${order.entrega?.metodo === "retiro" && order.entrega?.fechaPreferida ? `
                            <p>
                                Fecha preferida:
                                <strong>${dateOnlyDisplay(order.entrega.fechaPreferida)}</strong>
                            </p>
                        ` : ""}

                        ${order.entrega?.metodo === "envio" ? `
                            <p>
                                Zona de envío:
                                <strong>${order.entrega?.zonaEnvio === "santiago" ? "Provincia de Santiago" : "Otros sectores de Chile"}</strong>
                            </p>
                            <p>
                                Plazo estimado:
                                <strong>
                                    Desde ${dateOnlyDisplay(order.entrega?.fechaMinima)}
                                    ${order.entrega?.fechaEstimadaHasta ? ` hasta ${dateOnlyDisplay(order.entrega.fechaEstimadaHasta)}` : ""}
                                </strong>
                            </p>
                            <p>
                                Costo de envío:
                                <strong>${String(order.entrega?.modalidadEnvio || "").toLowerCase().includes("chilexpress") ? "Por pagar a Chilexpress" : money(order.costoEnvio || 0)}</strong>
                            </p>
                        ` : ""}

                        ${receiver?.habilitado ? `
                            <div class="customer-order-receiver">
                                <strong>Recibe un tercero</strong>
                                <p>${escapeHtml(receiver.nombre)}</p>
                                <p>${escapeHtml(receiver.telefono)}</p>
                                <p>${escapeHtml(receiver.relacion)}</p>
                            </div>
                        ` : ""}

                        ${order.observaciones ? `
                            <div class="customer-order-note">
                                <strong>Nota del pedido</strong>
                                <p>${escapeHtml(order.observaciones)}</p>
                            </div>
                        ` : ""}

                        <p>Subtotal: <strong>${money(order.subtotal)}</strong></p>
                        <p>Total: <strong>${money(order.total)}</strong></p>
                    </section>

                    <section class="account-detail-card" style="margin-top:1.6rem">
                        <h2>Seguimiento</h2>
                        <div class="account-timeline">
                            ${history.length
                                ? history.slice().reverse().map((entry) => `
                                    <div class="account-timeline-entry">
                                        <strong>${statusLabel(entry.estado)}</strong>
                                        ${entry.detalle ? `<p>${escapeHtml(entry.detalle)}</p>` : ""}
                                        <span>${dateTime(entry.fecha)}</span>
                                    </div>
                                `).join("")
                                : "<p>El pedido todavía no tiene actualizaciones.</p>"
                            }
                        </div>
                    </section>
                </aside>
            `;

            bindOrderActions(order, container);
        } catch (error) {
            container.innerHTML = `
                <section class="account-detail-card">
                    <div class="account-alert">${escapeHtml(error.message)}</div>
                </section>
            `;
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const page = document.body.dataset.accountPage;
        if (page === "access") initAccess();
        if (page === "account") initAccount();
        if (page === "order") initOrder();
    });
})();
