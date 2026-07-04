"use strict";

(function () {
    const state = {
        thumbnailContainer: null,
        suppressClickUntil: 0,
        dragAnimation: 0,
        zoomScale: 1,
        zoomOriginX: 50,
        zoomOriginY: 50,
        zoomFrame: 0,
        suppressZoomUntil: 0
    };

    const clamp = (value, min, max) =>
        Math.min(max, Math.max(min, value));

    function initThumbnailDrag() {
        const container = document.getElementById("detalle-thumbnails");
        if (!container || container.dataset.dragReady === "true") return;

        container.dataset.dragReady = "true";
        state.thumbnailContainer = container;

        let pointerDown = false;
        let dragging = false;
        let pointerId = null;
        let startX = 0;
        let startScrollLeft = 0;
        let lastX = 0;
        let lastTime = 0;
        let velocity = 0;

        const stopInertia = () => {
            if (state.dragAnimation) {
                cancelAnimationFrame(state.dragAnimation);
                state.dragAnimation = 0;
            }
        };

        const startInertia = () => {
            stopInertia();

            const animate = () => {
                velocity *= 0.91;

                if (Math.abs(velocity) < 0.05) {
                    state.dragAnimation = 0;
                    return;
                }

                container.scrollLeft += velocity * 16;
                state.dragAnimation = requestAnimationFrame(animate);
            };

            state.dragAnimation = requestAnimationFrame(animate);
        };

        container.addEventListener("pointerdown", (event) => {
            if (event.pointerType === "mouse" && event.button !== 0) return;

            stopInertia();
            pointerDown = true;
            dragging = false;
            pointerId = event.pointerId;
            startX = event.clientX;
            lastX = event.clientX;
            startScrollLeft = container.scrollLeft;
            lastTime = performance.now();
            velocity = 0;
        });

        container.addEventListener("pointermove", (event) => {
            if (!pointerDown || event.pointerId !== pointerId) return;

            const delta = event.clientX - startX;

            if (!dragging && Math.abs(delta) > 8) {
                dragging = true;
                container.classList.add("is-dragging");
                container.setPointerCapture?.(pointerId);
            }

            if (!dragging) return;

            container.scrollLeft = startScrollLeft - delta;

            const now = performance.now();
            const elapsed = Math.max(1, now - lastTime);
            velocity = (lastX - event.clientX) / elapsed;
            lastX = event.clientX;
            lastTime = now;
            event.preventDefault();
        });

        const finish = (event) => {
            if (!pointerDown || event.pointerId !== pointerId) return;

            pointerDown = false;

            if (dragging) {
                dragging = false;
                container.classList.remove("is-dragging");
                state.suppressClickUntil = performance.now() + 180;

                try {
                    container.releasePointerCapture?.(pointerId);
                } catch {}

                startInertia();
            }

            pointerId = null;
        };

        container.addEventListener("pointerup", finish);
        container.addEventListener("pointercancel", finish);
        container.addEventListener("lostpointercapture", () => {
            pointerDown = false;
            dragging = false;
            container.classList.remove("is-dragging");
        });

        container.addEventListener(
            "click",
            (event) => {
                if (performance.now() < state.suppressClickUntil) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            },
            true
        );

        container.addEventListener(
            "wheel",
            (event) => {
                if (container.scrollWidth <= container.clientWidth) return;

                const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
                    ? event.deltaX
                    : event.deltaY;

                if (!delta) return;

                event.preventDefault();
                stopInertia();
                container.scrollBy({
                    left: delta,
                    behavior: "smooth"
                });
            },
            { passive: false }
        );
    }

    function scrollThumbnailIntoView(index) {
        const container = state.thumbnailContainer ||
            document.getElementById("detalle-thumbnails");
        const thumbnail = container?.children?.[index];

        if (!container || !thumbnail || container.classList.contains("is-dragging")) {
            return;
        }

        const target = thumbnail.offsetLeft -
            (container.clientWidth - thumbnail.clientWidth) / 2;

        container.scrollTo({
            left: Math.max(0, target),
            behavior: "smooth"
        });
    }

    function zoomElements() {
        return {
            track: document.getElementById("detalle-imagen-track"),
            image: document.getElementById("detalle-imagen-principal"),
            hint: document.getElementById("detail-zoom-help")
        };
    }

    function updateHint() {
        const { hint } = zoomElements();
        if (!hint) return;

        hint.innerHTML = state.zoomScale > 1
            ? '<i class="fa-solid fa-magnifying-glass-minus" aria-hidden="true"></i> Haz clic para alejar'
            : '<i class="fa-solid fa-magnifying-glass-plus" aria-hidden="true"></i> Haz clic para acercar';
    }

    function applyInlineZoom(animate = true) {
        const { track, image } = zoomElements();
        if (!track || !image) return;

        if (state.zoomFrame) cancelAnimationFrame(state.zoomFrame);

        state.zoomFrame = requestAnimationFrame(() => {
            image.classList.toggle("zoom-no-transition", !animate);
            image.style.transformOrigin =
                `${state.zoomOriginX}% ${state.zoomOriginY}%`;
            image.style.transform = `scale(${state.zoomScale})`;

            track.classList.toggle("is-inline-zoomed", state.zoomScale > 1);
            track.setAttribute("aria-pressed", String(state.zoomScale > 1));
            updateHint();

            if (!animate) {
                requestAnimationFrame(() => {
                    image.classList.remove("zoom-no-transition");
                });
            }
        });
    }

    function pointFromEvent(event) {
        const { track } = zoomElements();
        if (!track) return { x: 50, y: 50 };

        const rect = track.getBoundingClientRect();
        const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 5, 95);
        const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 5, 95);
        return { x, y };
    }

    function resetZoom(animate = true) {
        state.zoomScale = 1;
        state.zoomOriginX = 50;
        state.zoomOriginY = 50;
        applyInlineZoom(animate);
    }

    function setZoom(scale, event = null) {
        state.zoomScale = clamp(scale, 1, 3.5);

        if (event && state.zoomScale > 1) {
            const point = pointFromEvent(event);
            state.zoomOriginX = point.x;
            state.zoomOriginY = point.y;
        }

        if (state.zoomScale <= 1) {
            state.zoomOriginX = 50;
            state.zoomOriginY = 50;
        }

        applyInlineZoom();
    }

    function toggleZoom(event = null) {
        if (state.zoomScale > 1) {
            resetZoom();
            return;
        }

        const point = event?.clientX
            ? pointFromEvent(event)
            : { x: 50, y: 50 };

        state.zoomOriginX = point.x;
        state.zoomOriginY = point.y;
        state.zoomScale = 2.35;
        applyInlineZoom();
    }

    function syncZoomSource() {
        resetZoom(false);
    }


    function initMainImageSwipe() {
        const { track } = zoomElements();
        if (!track || track.dataset.swipeReady === "true") return;

        track.dataset.swipeReady = "true";

        let pointerDown = false;
        let pointerId = null;
        let startX = 0;
        let startY = 0;
        let moved = false;

        track.addEventListener("pointerdown", (event) => {
            if (!window.matchMedia("(max-width: 700px)").matches) return;
            if (event.pointerType === "mouse") return;
            if (state.zoomScale > 1) return;

            pointerDown = true;
            pointerId = event.pointerId;
            startX = event.clientX;
            startY = event.clientY;
            moved = false;
        }, { passive: true });

        track.addEventListener("pointermove", (event) => {
            if (!pointerDown || event.pointerId !== pointerId) return;
            const deltaX = event.clientX - startX;
            const deltaY = event.clientY - startY;
            if (Math.abs(deltaX) > 18 && Math.abs(deltaX) > Math.abs(deltaY)) {
                moved = true;
            }
        }, { passive: true });

        const finishSwipe = (event) => {
            if (!pointerDown || event.pointerId !== pointerId) return;

            const deltaX = event.clientX - startX;
            const deltaY = event.clientY - startY;
            pointerDown = false;
            pointerId = null;

            if (!moved || Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

            state.suppressZoomUntil = performance.now() + 260;
            const selector = deltaX < 0 ? "#detail-next" : "#detail-prev";
            document.querySelector(selector)?.click();
        };

        track.addEventListener("pointerup", finishSwipe);
        track.addEventListener("pointercancel", () => {
            pointerDown = false;
            pointerId = null;
            moved = false;
        });
    }

    function initZoom() {
        const { track, image } = zoomElements();
        if (!track || !image || track.dataset.inlineZoomReady === "true") return;

        track.dataset.inlineZoomReady = "true";
        image.draggable = false;
        resetZoom(false);

        track.addEventListener("click", (event) => {
            if (performance.now() < state.suppressZoomUntil) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            toggleZoom(event);
        });

        track.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggleZoom();
            }

            if (event.key === "Escape") {
                resetZoom();
            }
        });

        track.addEventListener("pointermove", (event) => {
            if (state.zoomScale <= 1 || event.pointerType === "touch") return;

            const point = pointFromEvent(event);
            state.zoomOriginX = point.x;
            state.zoomOriginY = point.y;
            applyInlineZoom(false);
        });

        track.addEventListener(
            "wheel",
            (event) => {
                if (state.zoomScale <= 1) return;

                event.preventDefault();
                const direction = event.deltaY < 0 ? 0.25 : -0.25;
                setZoom(state.zoomScale + direction, event);
            },
            { passive: false }
        );

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && state.zoomScale > 1) {
                resetZoom();
            }
        });
    }

    function init() {
        initThumbnailDrag();
        initMainImageSwipe();
        initZoom();
    }

    window.ProductGallery = Object.freeze({
        init,
        scrollThumbnailIntoView,
        syncZoomSource,
        openZoom: () => toggleZoom(),
        closeZoom: () => resetZoom()
    });

    document.addEventListener("DOMContentLoaded", init);
})();
