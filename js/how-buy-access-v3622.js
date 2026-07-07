"use strict";

(function () {
    const LINK_URL = "como-comprar.html";
    const LABEL = "Cómo comprar";

    function hasHowBuyLink(root) {
        return !!root?.querySelector?.('a[href*="como-comprar.html"]');
    }

    function createLegacyItem() {
        const li = document.createElement("li");
        li.className = "how-buy-menu-item";
        const a = document.createElement("a");
        a.href = LINK_URL;
        a.textContent = LABEL;
        li.appendChild(a);
        return li;
    }

    function ensureMainMenuLink() {
        const menu = document.getElementById("main-menu");
        if (!menu || hasHowBuyLink(menu)) return;
        const item = createLegacyItem();
        const categoriesItem = [...menu.children].find((child) => child.classList?.contains("has-dropdown"));
        if (categoriesItem?.nextSibling) {
            menu.insertBefore(item, categoriesItem.nextSibling);
        } else {
            menu.appendChild(item);
        }
    }

    function createDrawerItem() {
        const li = document.createElement("li");
        li.className = "mc-mobile-menu-how-buy-item";
        li.innerHTML = `
            <a class="mc-mobile-menu-row" href="${LINK_URL}">
                <span class="mc-mobile-menu-row-icon" aria-hidden="true"><i class="fa-solid fa-circle-question"></i></span>
                <span class="mc-mobile-menu-row-content">
                    <strong>${LABEL}</strong>
                    <small>Paso a paso y guía de personalización</small>
                </span>
                <i class="fa-solid fa-arrow-right mc-mobile-menu-row-arrow" aria-hidden="true"></i>
            </a>`;
        return li;
    }

    function ensureDrawerLink() {
        const list = document.querySelector('#mc-mobile-menu-panel [data-mobile-menu-view="main"] .mc-mobile-menu-list');
        if (!list || hasHowBuyLink(list)) return;
        const item = createDrawerItem();
        const rows = list.querySelectorAll(":scope > li");
        const afterCatalog = [...rows].find((li) => li.textContent.toLowerCase().includes("todos los productos"));
        if (afterCatalog?.nextSibling) {
            list.insertBefore(item, afterCatalog.nextSibling);
        } else {
            list.appendChild(item);
        }
    }

    function ensureAll() {
        ensureMainMenuLink();
        ensureDrawerLink();
    }

    document.addEventListener("DOMContentLoaded", ensureAll);
    document.addEventListener("studio:navigation-applied", ensureAll);
    document.addEventListener("categories:updated", ensureAll);

    document.addEventListener("click", (event) => {
        if (!event.target.closest("#mobile-menu-button")) return;
        setTimeout(ensureDrawerLink, 60);
        setTimeout(ensureDrawerLink, 180);
        setTimeout(ensureDrawerLink, 420);
    }, true);

    const observer = new MutationObserver(() => ensureAll());
    document.addEventListener("DOMContentLoaded", () => {
        observer.observe(document.body, { childList: true, subtree: true });
    });
})();
