"use strict";

(function () {
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const MAX_STORED_IMAGE_SIZE = 520_000;
    const MAX_IMAGE_DIMENSION = 800;
    const MAX_TEXT_LENGTH = 25;

    const state = {
        product: null,
        options: null,
        images: [],
        processingImages: false
    };

    const $ = (selector) =>
        document.querySelector(selector);

    function booleanValue(value, fallback = false) {
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;

        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();

            if (["true", "verdadero", "1", "si", "sí"].includes(normalized)) {
                return true;
            }

            if (["false", "falso", "0", "no"].includes(normalized)) {
                return false;
            }
        }

        return fallback;
    }

    function numberValue(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function normalizeOptions(product) {
        const raw =
            product?.personalizacionLigera ??
            product?.personalizacionSimple ??
            product?.personalizacionCatalogo ??
            null;

        if (!raw) {
            return {
                enabled: false,
                allowName: false,
                allowImage: false,
                allowObservation: false,
                maxImages: 1,
                description: "",
                notice: ""
            };
        }

        if (typeof raw !== "object") {
            const enabled = booleanValue(raw, false);

            return {
                enabled,
                allowName: enabled,
                allowImage: enabled,
                allowObservation: enabled,
                maxImages: 1,
                description: "",
                notice: ""
            };
        }

        const enabled = booleanValue(
            raw.habilitada ??
            raw.habilitado ??
            raw.activa ??
            raw.activo ??
            raw.enabled,
            true
        );

        const maxImages = numberValue(
            raw.cantidadMaximaImagenes ??
            raw.cantidadMáximaImagenes ??
            raw.maximoImagenes ??
            raw.máximoImagenes ??
            raw.maxImages,
            1
        ) >= 2 ? 2 : 1;

        return {
            enabled,
            allowName: enabled && booleanValue(
                raw.permitirNombre ?? raw.nombre ?? raw.allowName,
                true
            ),
            allowImage: enabled && booleanValue(
                raw.permitirImagen ?? raw.imagen ?? raw.allowImage,
                true
            ),
            allowObservation: enabled && booleanValue(
                raw.permitirObservacion ??
                raw.permitirObservación ??
                raw.observacion ??
                raw.observación ??
                raw.allowObservation,
                true
            ),
            maxImages,
            description: String(
                raw.descripcion ?? raw.descripción ?? raw.description ?? ""
            ).trim(),
            notice: String(
                raw.aviso ?? raw.nota ?? raw.notice ?? ""
            ).trim()
        };
    }

    function updateNameCount() {
        const input = $("#light-customization-name");
        const counter = $("#light-customization-name-count");

        if (!input || !counter) return;

        if (input.value.length > MAX_TEXT_LENGTH) {
            input.value = input.value.slice(0, MAX_TEXT_LENGTH);
        }

        counter.textContent = `${input.value.length} / ${MAX_TEXT_LENGTH}`;
    }

    function updateObservationCount() {
        const textarea = $("#light-customization-observation");
        const counter = $("#light-customization-observation-count");

        if (textarea && counter) {
            counter.textContent = `${textarea.value.length} / 400`;
        }
    }

    function updateUploadHelp() {
        const title = $("#light-image-upload-title");
        const help = $("#light-image-upload-help");
        const input = $("#light-customization-image");
        const maxImages = state.options?.maxImages || 1;
        const remaining = Math.max(0, maxImages - state.images.length);

        if (input) {
            input.multiple = maxImages === 2;
            input.disabled = remaining === 0;
        }

        if (title) {
            title.textContent = remaining === 0
                ? "Máximo de imágenes alcanzado"
                : maxImages === 2
                    ? `Seleccionar hasta ${remaining} imagen${remaining === 1 ? "" : "es"}`
                    : "Seleccionar imagen";
        }

        if (help) {
            help.textContent = maxImages === 2
                ? `Puedes adjuntar hasta 2 imágenes · ${state.images.length}/2 seleccionadas · Máximo 5 MB cada una`
                : `Puedes adjuntar 1 imagen · ${state.images.length}/1 seleccionada · Máximo 5 MB`;
        }
    }

    function reset() {
        state.product = null;
        state.options = null;
        state.images = [];
        state.processingImages = false;

        const panel = $("#light-customization-panel");
        const name = $("#light-customization-name");
        const image = $("#light-customization-image");
        const observation = $("#light-customization-observation");
        const previews = $("#light-image-preview-grid");

        if (panel) panel.hidden = true;
        if (name) name.value = "";
        if (image) {
            image.value = "";
            image.disabled = false;
        }
        if (observation) observation.value = "";
        if (previews) {
            previews.hidden = true;
            previews.innerHTML = "";
        }

        updateNameCount();
        updateObservationCount();
    }

    function showOrHideField(selector, visible) {
        const field = $(selector);
        if (field) field.hidden = !visible;
    }

    function init(product) {
        reset();

        state.product = product;
        state.options = product?.lightCustomization ?? normalizeOptions(product);

        const panel = $("#light-customization-panel");

        if (
            !panel ||
            !state.options.enabled ||
            product.personalizable ||
            !product.publicarCatalogo
        ) {
            return;
        }

        showOrHideField("#light-customization-name-field", state.options.allowName);
        showOrHideField("#light-customization-image-field", state.options.allowImage);
        showOrHideField("#light-customization-observation-field", state.options.allowObservation);

        const description = $("#light-customization-description");
        const notice = $("#light-customization-notice-text");

        if (description && state.options.description) {
            description.textContent = state.options.description;
        }

        if (notice && state.options.notice) {
            notice.textContent = state.options.notice;
        }

        updateUploadHelp();
        panel.hidden = false;
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener("load", () => resolve(reader.result));
            reader.addEventListener("error", () => reject(new Error("No se pudo leer la imagen.")));
            reader.readAsDataURL(file);
        });
    }

    function loadImageElement(dataUrl) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", () => reject(new Error("El archivo seleccionado no es una imagen válida.")));
            image.src = dataUrl;
        });
    }

    function canvasToDataUrl(canvas, quality) {
        const webp = canvas.toDataURL("image/webp", quality);

        return webp.startsWith("data:image/webp")
            ? webp
            : canvas.toDataURL("image/jpeg", quality);
    }

    async function prepareImage(file) {
        if (!file) return null;

        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`${file.name}: supera el máximo permitido de 5 MB.`);
        }

        const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

        if (!allowedTypes.has(file.type)) {
            throw new Error(`${file.name}: solo se permiten imágenes JPG, PNG o WEBP.`);
        }

        const sourceData = await readFileAsDataUrl(file);
        const image = await loadImageElement(sourceData);
        const scale = Math.min(
            1,
            MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight)
        );
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("El navegador no pudo preparar la imagen.");
        }

        context.drawImage(image, 0, 0, width, height);

        let output = canvasToDataUrl(canvas, 0.72);

        if (output.length > MAX_STORED_IMAGE_SIZE) {
            output = canvasToDataUrl(canvas, 0.52);
        }

        if (output.length > MAX_STORED_IMAGE_SIZE) {
            throw new Error(`${file.name}: la imagen sigue siendo demasiado pesada. Usa una imagen más pequeña.`);
        }

        return {
            name: file.name,
            data: output
        };
    }

    function renderImagePreviews() {
        const container = $("#light-image-preview-grid");

        if (!container) return;

        container.innerHTML = "";
        container.hidden = state.images.length === 0;

        state.images.forEach((image, index) => {
            const card = document.createElement("article");
            const preview = document.createElement("img");
            const content = document.createElement("div");
            const name = document.createElement("strong");
            const remove = document.createElement("button");

            card.className = "light-image-preview-card";
            preview.src = image.data;
            preview.alt = `Vista previa ${index + 1}: ${image.name}`;
            name.textContent = image.name;
            name.title = image.name;

            remove.type = "button";
            remove.className = "light-image-remove";
            remove.textContent = "Quitar";
            remove.setAttribute("aria-label", `Quitar ${image.name}`);
            remove.addEventListener("click", () => removeImage(index));

            content.append(name, remove);
            card.append(preview, content);
            container.appendChild(card);
        });

        updateUploadHelp();
    }

    function removeImage(index) {
        state.images.splice(index, 1);

        const input = $("#light-customization-image");
        if (input) input.value = "";

        renderImagePreviews();
    }

    async function addSelectedImages(fileList) {
        const maxImages = state.options?.maxImages || 1;
        const remaining = Math.max(0, maxImages - state.images.length);
        const files = Array.from(fileList || []);

        if (remaining === 0) {
            alert(`Este producto permite un máximo de ${maxImages} imagen${maxImages === 1 ? "" : "es"}.`);
            return;
        }

        if (files.length > remaining) {
            alert(`Solo puedes agregar ${remaining} imagen${remaining === 1 ? "" : "es"} más.`);
        }

        state.processingImages = true;

        try {
            for (const file of files.slice(0, remaining)) {
                const prepared = await prepareImage(file);

                if (prepared) {
                    state.images.push(prepared);
                }
            }

            renderImagePreviews();
        } finally {
            state.processingImages = false;

            const input = $("#light-customization-image");
            if (input) input.value = "";
        }
    }

    function getCustomization() {
        if (!state.options?.enabled || !state.product) {
            return null;
        }

        const requestedName = state.options.allowName
            ? ($("#light-customization-name")?.value.trim().slice(0, MAX_TEXT_LENGTH) || "")
            : "";

        const observation = state.options.allowObservation
            ? ($("#light-customization-observation")?.value.trim() || "")
            : "";

        const images = state.options.allowImage
            ? state.images.slice(0, state.options.maxImages || 1)
            : [];

        if (!requestedName && !observation && images.length === 0) {
            return null;
        }

        return {
            type: "light",
            requestedName,
            observation,
            imageNames: images.map((image) => image.name),
            imageDataList: images.map((image) => image.data),
            imageName: images[0]?.name || "",
            imageData: images[0]?.data || ""
        };
    }

    function validate() {
        if (state.processingImages) {
            alert("Espera un momento mientras se procesan las imágenes.");
            return false;
        }

        const name = $("#light-customization-name")?.value || "";

        if (name.length > MAX_TEXT_LENGTH) {
            alert(`El texto puede tener un máximo de ${MAX_TEXT_LENGTH} caracteres.`);
            return false;
        }

        return true;
    }

    function bindEvents() {
        $("#light-customization-image")?.addEventListener("change", async (event) => {
            try {
                await addSelectedImages(event.target.files);
            } catch (error) {
                alert(error.message || "No se pudieron procesar las imágenes.");
            }
        });

        $("#light-customization-name")?.addEventListener("input", updateNameCount);
        $("#light-customization-observation")?.addEventListener("input", updateObservationCount);
    }

    window.ProductOptions = Object.freeze({
        init,
        reset,
        validate,
        getCustomization
    });

    document.addEventListener("DOMContentLoaded", bindEvents);
})();
