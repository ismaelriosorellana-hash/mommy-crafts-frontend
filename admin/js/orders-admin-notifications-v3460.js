"use strict";

(function () {
    const templates = [
        ["order_created", "Pedido recibido"],
        ["payment_confirmed", "Pago confirmado"],
        ["design_review", "Revisión diseño"],
        ["production_started", "Producción"],
        ["ready", "Listo"],
        ["shipped", "Enviado"],
        ["delivered", "Entregado"],
        ["cancelled", "Cancelado"],
        ["status_update", "Estado actual"]
    ];

    function detailRoot() {
        return document.getElementById("order-detail");
    }

    function currentOrderId() {
        return detailRoot()?.querySelector("[data-copy-order-id]")?.dataset?.copyOrderId || "";
    }

    function escapeHtml(value) {
        return window.AdminUI?.escapeHtml
            ? AdminUI.escapeHtml(value)
            : String(value ?? "").replace(/[&<>\"']/g, (char) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;",
                "'": "&#039;"
            }[char]));
    }

    async function copyText(text) {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }

        const input = document.createElement("textarea");
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
    }

    async function loadPreview(orderId, eventName) {
        const panel = document.querySelector(".admin-notification-panel");
        if (!panel) return;

        const status = panel.querySelector(".notification-delivery-status");
        status.textContent = "Preparando mensaje...";

        try {
            const data = await AdminAPI.request(
                `/admin/pedidos/${encodeURIComponent(orderId)}/notificaciones/${encodeURIComponent(eventName)}`
            );

            panel.querySelector(".notification-subject").value = data.asunto || "";
            panel.querySelector(".notification-message").value = data.whatsappTexto || data.texto || "";
            panel.querySelector(".notification-email-to").textContent = data.correoPara || "Sin correo";
            panel.querySelector(".notification-whatsapp-link").href = data.whatsappUrl || "#";
            panel.querySelector(".notification-whatsapp-link").toggleAttribute("aria-disabled", !data.whatsappUrl);
            panel.querySelector(".notification-send-email").dataset.event = data.evento || eventName;
            panel.querySelector(".notification-copy").dataset.message = data.whatsappTexto || data.texto || "";

            panel.querySelectorAll("[data-template]").forEach((button) => {
                button.classList.toggle("active", button.dataset.template === (data.evento || eventName));
            });

            status.textContent = data.correoPara
                ? "Mensaje listo. El correo real se enviará solo si el backend tiene Resend configurado."
                : "Mensaje listo para copiar por WhatsApp. Este pedido no tiene correo válido.";
        } catch (error) {
            status.textContent = error.message || "No fue posible preparar el mensaje.";
        }
    }

    function panelHtml() {
        return `
            <section class="admin-notification-panel" data-notifications-ready="true">
                <header>
                    <div>
                        <h4><i class="fa-regular fa-paper-plane"></i> Mensajes automáticos</h4>
                        <p>Prepara correos y WhatsApp para informar el avance del pedido sin escribir todo manualmente.</p>
                    </div>
                    <span class="admin-status info">Etapa 2Z</span>
                </header>

                <div class="notification-template-grid" aria-label="Plantillas de notificación">
                    ${templates.map(([key, label]) => `
                        <button type="button" data-template="${escapeHtml(key)}">${escapeHtml(label)}</button>
                    `).join("")}
                </div>

                <div class="notification-preview-box">
                    <div class="notification-preview-card">
                        <label>Asunto del correo</label>
                        <input class="notification-subject" type="text" readonly>

                        <label style="margin-top:.75rem">Mensaje para cliente</label>
                        <textarea class="notification-message" readonly></textarea>
                    </div>

                    <aside class="notification-preview-actions">
                        <div class="notification-delivery-status">Selecciona una plantilla para preparar el mensaje.</div>
                        <p>Correo: <strong class="notification-email-to">—</strong></p>

                        <button class="admin-button secondary notification-copy" type="button">
                            <i class="fa-regular fa-copy"></i>
                            Copiar mensaje
                        </button>

                        <a class="admin-button secondary notification-whatsapp-link" href="#" target="_blank" rel="noopener">
                            <i class="fa-brands fa-whatsapp"></i>
                            Abrir WhatsApp
                        </a>

                        <button class="admin-button notification-send-email" type="button" data-event="status_update">
                            <i class="fa-regular fa-envelope"></i>
                            Enviar / registrar correo
                        </button>
                    </aside>
                </div>
            </section>
        `;
    }

    function mountPanel() {
        const root = detailRoot();
        const orderId = currentOrderId();
        if (!root || !orderId || root.querySelector("[data-notifications-ready]")) return;

        const anchor = root.querySelector(".order-admin-hero");
        if (!anchor) return;

        anchor.insertAdjacentHTML("afterend", panelHtml());
        bindPanel(orderId);
        loadPreview(orderId, "status_update");
    }

    function bindPanel(orderId) {
        const panel = document.querySelector(".admin-notification-panel");
        if (!panel) return;

        panel.querySelectorAll("[data-template]").forEach((button) => {
            button.addEventListener("click", () => {
                loadPreview(orderId, button.dataset.template);
            });
        });

        panel.querySelector(".notification-copy")?.addEventListener("click", async (event) => {
            try {
                const message = event.currentTarget.dataset.message || panel.querySelector(".notification-message")?.value || "";
                await copyText(message);
                AdminUI.toast("Mensaje copiado.", "success");
            } catch {
                AdminUI.toast("No fue posible copiar el mensaje.", "error");
            }
        });

        panel.querySelector(".notification-send-email")?.addEventListener("click", async (event) => {
            const button = event.currentTarget;
            const status = panel.querySelector(".notification-delivery-status");
            button.disabled = true;
            status.textContent = "Enviando o registrando notificación...";

            try {
                const result = await AdminAPI.request(
                    `/admin/pedidos/${encodeURIComponent(orderId)}/notificaciones/${encodeURIComponent(button.dataset.event || "status_update")}`,
                    {
                        method: "POST",
                        body: { email: true }
                    }
                );

                status.textContent = result.correo?.sent
                    ? "Correo enviado correctamente."
                    : `Notificación registrada. ${result.correo?.reason || "Configura Resend para enviar correos reales."}`;

                AdminUI.toast(result.correo?.sent ? "Correo enviado." : "Notificación registrada.", "success");
            } catch (error) {
                status.textContent = error.message || "No fue posible enviar la notificación.";
                AdminUI.toast(error.message, "error");
            } finally {
                button.disabled = false;
            }
        });
    }

    document.addEventListener("admin:ready", () => {
        const root = detailRoot();
        if (!root) return;

        const observer = new MutationObserver(() => {
            window.requestAnimationFrame(mountPanel);
        });

        observer.observe(root, {
            childList: true,
            subtree: false
        });
    });
})();
