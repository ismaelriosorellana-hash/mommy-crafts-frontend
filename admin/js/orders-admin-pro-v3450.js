"use strict";

(function () {
    let lastLabel = "";

    function updateLastSync() {
        const label = document.querySelector(".orders-last-sync");
        if (!label) return;

        const now = new Intl.DateTimeFormat("es-CL", {
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date());

        const text = `Vista actualizada a las ${now}.`;
        if (lastLabel === text && label.textContent === text) return;
        lastLabel = text;
        label.textContent = text;
    }

    function markOrdersPageReady() {
        if (document.body?.dataset?.adminPage !== "pedidos") return;
        document.body.classList.add("orders-admin-pro-ready");
        window.requestAnimationFrame(updateLastSync);
    }

    document.addEventListener("admin:ready", markOrdersPageReady);
    document.addEventListener("orders:rendered", () => {
        window.requestAnimationFrame(updateLastSync);
    });
})();
