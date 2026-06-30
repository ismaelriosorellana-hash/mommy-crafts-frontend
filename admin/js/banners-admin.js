"use strict";

let adminBanners = [];

document.addEventListener(
    "admin:ready",
    async () => {
        document.getElementById(
            "banner-new"
        ).addEventListener(
            "click",
            () => openBannerForm()
        );

        document.getElementById(
            "banner-form"
        ).addEventListener(
            "submit",
            saveBanner
        );

        document.getElementById(
            "banner-desktop"
        ).addEventListener(
            "input",
            updateBannerPreview
        );

        document.getElementById(
            "banners-table"
        ).addEventListener(
            "click",
            handleBannerTable
        );

        document.getElementById("banner-target-type")
            ?.addEventListener("change", updateDestinationFields);
        document.getElementById("banner-target-category")
            ?.addEventListener("change", syncBannerDestination);
        document.getElementById("banner-target-section")
            ?.addEventListener("change", syncBannerDestination);

        await loadBannerCategories();
        await loadBanners();
    }
);

async function loadBannerCategories() {
    const select = document.getElementById("banner-target-category");
    if (!select) return;

    try {
        const products = await AdminAPI.request("/admin/productos");
        const categories = [...new Set(
            (products || [])
                .flatMap((product) => [
                    product.categoriaPrincipal,
                    ...(Array.isArray(product.categorias) ? product.categorias : [])
                ])
                .map((item) => String(item || "").trim())
                .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, "es"));

        select.innerHTML = '<option value="">Selecciona una categoría</option>' +
            categories.map((category) =>
                `<option value="${AdminUI.escapeHtml(category)}">${AdminUI.escapeHtml(category)}</option>`
            ).join("");
    } catch (error) {
        console.warn("No fue posible cargar las categorías para los banners:", error);
    }
}

function destinationTypeFromBanner(banner = {}) {
    if (banner.destinoTipo) return banner.destinoTipo;
    const target = String(banner.destino || "");
    if (/catalogo\.html\?categoria=/i.test(target)) return "categoria";
    if (target.startsWith("#")) return "seccion";
    return "url";
}

function categoryFromTarget(target) {
    try {
        const value = String(target || "");
        const query = value.split("?")[1] || "";
        return new URLSearchParams(query).get("categoria") || "";
    } catch {
        return "";
    }
}

function updateDestinationFields() {
    const type = document.getElementById("banner-target-type")?.value || "seccion";
    const categoryField = document.getElementById("banner-category-field");
    const sectionField = document.getElementById("banner-section-field");
    const urlField = document.getElementById("banner-url-field");

    if (categoryField) categoryField.hidden = type !== "categoria";
    if (sectionField) sectionField.hidden = type !== "seccion";
    if (urlField) urlField.hidden = type !== "url";

    syncBannerDestination();
}

function syncBannerDestination() {
    const type = document.getElementById("banner-target-type")?.value || "seccion";
    const target = document.getElementById("banner-target");
    if (!target) return;

    if (type === "categoria") {
        const category = document.getElementById("banner-target-category")?.value || "";
        target.value = category
            ? `catalogo.html?categoria=${encodeURIComponent(category)}`
            : "catalogo.html";
    } else if (type === "seccion") {
        target.value = document.getElementById("banner-target-section")?.value || "#lo-mas-vendido";
    }
}

async function loadBanners() {
    const container =
        document.getElementById(
            "banners-table"
        );

    AdminUI.showLoading(
        container,
        "Cargando banners..."
    );

    try {
        adminBanners =
            await AdminAPI.request(
                "/admin/banners"
            );

        renderBanners();
    } catch (error) {
        container.innerHTML = `
            <div class="admin-empty">
                ${AdminUI.escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}

function renderBanners() {
    const container =
        document.getElementById(
            "banners-table"
        );

    if (!adminBanners.length) {
        container.innerHTML = `
            <div class="admin-empty">
                Todavía no hay banners guardados en MongoDB.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Banner</th>
                    <th>Título</th>
                    <th>Orden</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>

            <tbody>
                ${adminBanners.map(
                    (banner) => `
                    <tr>
                        <td>
                            <div class="admin-table-product">
                                <img
                                    src="${AdminUI.escapeHtml(banner.imagenEscritorio)}"
                                    alt=""
                                    style="width:90px;aspect-ratio:16/7"
                                >
                                <div>
                                    <strong>${AdminUI.escapeHtml(banner.nombre)}</strong>
                                    <small>${AdminUI.escapeHtml(banner.destino || "")}</small>
                                </div>
                            </div>
                        </td>
                        <td>${AdminUI.escapeHtml(banner.titulo)}</td>
                        <td>${Number(banner.orden) || 0}</td>
                        <td>
                            <span class="admin-status ${banner.activo ? "success" : "danger"}">
                                ${banner.activo ? "Activo" : "Inactivo"}
                            </span>
                        </td>
                        <td>
                            <div class="admin-toolbar-group">
                                <button class="admin-button secondary small" type="button" data-edit-banner="${banner._id}">
                                    Editar
                                </button>
                                <button class="admin-button danger small" type="button" data-delete-banner="${banner._id}">
                                    Eliminar
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function handleBannerTable(event) {
    const edit =
        event.target.closest(
            "[data-edit-banner]"
        );

    if (edit) {
        openBannerForm(
            adminBanners.find(
                (item) =>
                    String(item._id) ===
                    String(
                        edit.dataset.editBanner
                    )
            )
        );

        return;
    }

    const remove =
        event.target.closest(
            "[data-delete-banner]"
        );

    if (remove) {
        deleteBanner(
            remove.dataset.deleteBanner
        );
    }
}

function openBannerForm(banner = null) {
    document.getElementById(
        "banner-form"
    ).reset();

    document.getElementById(
        "banner-id"
    ).value =
        banner?._id || "";

    document.getElementById(
        "banner-modal-title"
    ).textContent =
        banner
            ? "Editar banner"
            : "Nuevo banner";

    document.getElementById(
        "banner-name"
    ).value =
        banner?.nombre || "";

    document.getElementById(
        "banner-order"
    ).value =
        banner?.orden ?? 0;

    document.getElementById(
        "banner-eyebrow"
    ).value =
        banner?.eyebrow || "";

    document.getElementById(
        "banner-title"
    ).value =
        banner?.titulo || "";

    document.getElementById(
        "banner-button"
    ).value =
        banner?.textoBoton ||
        "Ver productos";

    const destinationType = destinationTypeFromBanner(banner || {});
    document.getElementById("banner-target-type").value = destinationType;
    document.getElementById("banner-target").value =
        banner?.destino || "#lo-mas-vendido";
    document.getElementById("banner-target-section").value =
        destinationType === "seccion"
            ? (banner?.destino || "#lo-mas-vendido")
            : "#lo-mas-vendido";
    document.getElementById("banner-target-category").value =
        banner?.categoriaDestino || categoryFromTarget(banner?.destino);
    updateDestinationFields();

    document.getElementById(
        "banner-desktop"
    ).value =
        banner?.imagenEscritorio ||
        "";

    document.getElementById(
        "banner-mobile"
    ).value =
        banner?.imagenMovil || "";

    document.getElementById(
        "banner-position"
    ).value =
        banner?.posicion ||
        "center";

    document.getElementById(
        "banner-active"
    ).checked =
        banner?.activo !== false;

    updateBannerPreview();

    AdminUI.openModal(
        "banner-modal"
    );
}

function updateBannerPreview() {
    const url =
        document.getElementById(
            "banner-desktop"
        ).value.trim();

    const preview =
        document.getElementById(
            "banner-preview"
        );

    preview.innerHTML =
        url
            ? `<img src="${AdminUI.escapeHtml(url)}" alt="Vista previa">`
            : "Ingresa una imagen de escritorio";
}

async function saveBanner(event) {
    event.preventDefault();

    const id =
        document.getElementById(
            "banner-id"
        ).value;

    const data = {
        nombre:
            document.getElementById(
                "banner-name"
            ).value.trim(),
        orden:
            Number(
                document.getElementById(
                    "banner-order"
                ).value
            ) || 0,
        eyebrow:
            document.getElementById(
                "banner-eyebrow"
            ).value.trim(),
        titulo:
            document.getElementById(
                "banner-title"
            ).value.trim(),
        textoBoton:
            document.getElementById(
                "banner-button"
            ).value.trim(),
        destino:
            document.getElementById(
                "banner-target"
            ).value.trim(),
        destinoTipo:
            document.getElementById("banner-target-type").value,
        categoriaDestino:
            document.getElementById("banner-target-type").value === "categoria"
                ? document.getElementById("banner-target-category").value
                : "",
        imagenEscritorio:
            document.getElementById(
                "banner-desktop"
            ).value.trim(),
        imagenMovil:
            document.getElementById(
                "banner-mobile"
            ).value.trim(),
        posicion:
            document.getElementById(
                "banner-position"
            ).value.trim(),
        activo:
            document.getElementById(
                "banner-active"
            ).checked
    };

    try {
        await AdminAPI.request(
            id
                ? `/admin/banners/${id}`
                : "/admin/banners",
            {
                method:
                    id ? "PATCH" : "POST",
                body: data
            }
        );

        AdminUI.toast(
            "Banner guardado.",
            "success"
        );

        AdminUI.closeModal(
            "banner-modal"
        );

        loadBanners();
    } catch (error) {
        AdminUI.toast(
            error.message,
            "error"
        );
    }
}

async function deleteBanner(id) {
    if (
        !AdminUI.confirmAction(
            "¿Eliminar este banner definitivamente?"
        )
    ) {
        return;
    }

    try {
        await AdminAPI.request(
            `/admin/banners/${id}`,
            {
                method: "DELETE"
            }
        );

        AdminUI.toast(
            "Banner eliminado.",
            "success"
        );

        loadBanners();
    } catch (error) {
        AdminUI.toast(
            error.message,
            "error"
        );
    }
}
