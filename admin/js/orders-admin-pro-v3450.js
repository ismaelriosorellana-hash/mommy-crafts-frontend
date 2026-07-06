"use strict";

(function () {
    function updateLastSync() {
        const label = document.querySelector(".orders-last-sync");
        if (!label) return;

        const now = new Intl.DateTimeFormat("es-CL", {
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date());

        label.textContent = `Vista actualizada a las ${now}.`;
    }

    function markOrdersPageReady() {
        if (document.body?.dataset?.adminPage !== "pedidos") return;
        document.body.classList.add("orders-admin-pro-ready");
        updateLastSync();
    }

    document.addEventListener("admin:ready", markOrdersPageReady);

    const observer = new MutationObserver(() => {
        if (document.body?.dataset?.adminPage === "pedidos") updateLastSync();
    });

    document.addEventListener("DOMContentLoaded", () => {
        const table = document.getElementById("orders-table");
        if (table) {
            observer.observe(table, {
                childList: true,
                subtree: true
            });
        }
    });
})();
