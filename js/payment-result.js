"use strict";

(function () {
    const params = new URLSearchParams(location.search);
    const pending = (() => {
        try {
            return JSON.parse(
                sessionStorage.getItem("mommycrafts_pending_payment") || "{}"
            );
        } catch {
            return {};
        }
    })();

    const orderId = params.get("pedido") || pending.pedidoId || "";
    const token = params.get("token") || pending.token || "";
    const paymentId = params.get("payment_id") || params.get("collection_id") || "";

    const title = document.getElementById("payment-result-title");
    const message = document.getElementById("payment-result-message");
    const icon = document.getElementById("payment-result-icon");
    const orderBox = document.getElementById("payment-result-order");
    const retry = document.getElementById("payment-retry");
    const accountLink = document.getElementById("payment-account-link");

    function endpoint(suffix) {
        const query = token
            ? `?token=${encodeURIComponent(token)}`
            : "";
        return `/pagos/mercadopago/pedidos/${encodeURIComponent(orderId)}/${suffix}${query}`;
    }

    function setView(type, heading, detail, order) {
        icon.className = `payment-result-icon ${type}`;
        icon.innerHTML = type === "success"
            ? '<i class="fa-solid fa-circle-check"></i>'
            : type === "failure"
                ? '<i class="fa-solid fa-circle-xmark"></i>'
                : '<i class="fa-solid fa-clock"></i>';
        title.textContent = heading;
        message.textContent = detail;

        if (order) {
            orderBox.hidden = false;
            orderBox.innerHTML = `
                <strong>${order.numeroPedido}</strong>
                <span>Total: ${new Intl.NumberFormat("es-CL", {
                    style: "currency",
                    currency: "CLP",
                    maximumFractionDigits: 0
                }).format(Number(order.total) || 0)}</span>
            `;
        }

        retry.hidden = !(
            order &&
            order.metodoPago === "mercadopago" &&
            order.estadoPago !== "pagado" &&
            order.estadoPedido !== "cancelado"
        );

        accountLink.hidden = !(
            CustomerAuth.getToken() &&
            CustomerAuth.getUser()?.rol === "cliente"
        );
    }

    function renderOrder(order) {
        if (order.estadoPago === "pagado") {
            sessionStorage.removeItem("mommycrafts_pending_payment");
            setView(
                "success",
                "Pago confirmado",
                "Recibimos tu pago. El pedido ya quedó confirmado para comenzar su preparación.",
                order
            );
            return;
        }

        if (order.estadoPago === "rechazado") {
            setView(
                "failure",
                "El pago no fue aprobado",
                "Tu pedido quedó guardado y puedes volver a intentar el pago.",
                order
            );
            return;
        }

        if (order.estadoPago === "reembolsado") {
            setView(
                "failure",
                "Pago reembolsado",
                "El pago figura como reembolsado. Revisa el pedido o comunícate con Mommy Crafts.",
                order
            );
            return;
        }

        setView(
            "pending",
            "Pago pendiente",
            "Mercado Pago todavía está procesando el pago. El estado se actualizará automáticamente.",
            order
        );
    }

    async function synchronizeReturn() {
        if (!paymentId) return;

        await API.request(endpoint("retorno"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                paymentId,
                token
            })
        });
    }

    async function getStatus() {
        const data = await API.request(endpoint("estado"));
        renderOrder(data.pedido);
        return data.pedido;
    }

    async function init() {
        if (!orderId) {
            setView(
                "failure",
                "No encontramos el pedido",
                "Falta el identificador necesario para consultar el pago."
            );
            return;
        }

        try {
            await synchronizeReturn();
            const order = await getStatus();

            if (order.estadoPago === "pendiente") {
                let attempts = 0;
                const interval = setInterval(async () => {
                    attempts += 1;
                    try {
                        const updated = await getStatus();
                        if (updated.estadoPago !== "pendiente" || attempts >= 8) {
                            clearInterval(interval);
                        }
                    } catch {
                        clearInterval(interval);
                    }
                }, 5000);
            }
        } catch (error) {
            setView(
                "failure",
                "No pudimos comprobar el pago",
                error.message || "Intenta nuevamente desde tu cuenta."
            );
        }
    }

    retry.addEventListener("click", async () => {
        retry.disabled = true;
        retry.textContent = "Preparando pago...";

        try {
            const result = await API.request(endpoint("preferencia"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token })
            });
            location.href = result.checkoutUrl;
        } catch (error) {
            alert(error.message || "No fue posible iniciar el pago.");
            retry.disabled = false;
            retry.textContent = "Intentar pago nuevamente";
        }
    });

    document.addEventListener("DOMContentLoaded", init);
})();
