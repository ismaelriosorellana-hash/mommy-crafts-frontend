"use strict";

(function () {
    let bannerTimer = 0;
    let bannerIndex = 0;

    function initCarouselArrows() {
        document
            .querySelectorAll(".carousel-arrow")
            .forEach((button) => {
                button.addEventListener("click", () => {
                    const container =
                        document.getElementById(
                            button.dataset.carousel
                        );

                    if (!container) return;

                    const direction =
                        Number(button.dataset.direction) || 1;

                    container.scrollBy({
                        left:
                            container.clientWidth *
                            0.82 *
                            direction,
                        behavior: "smooth"
                    });
                });
            });
    }

    function bannerImage(slide) {
        const mobile = window.matchMedia(
            "(max-width: 700px)"
        ).matches;

        return mobile && slide.mobileImage
            ? slide.mobileImage
            : slide.desktopImage;
    }

    function applyBannerSlide(slide) {
        const background =
            document.getElementById("banner-bg");

        const eyebrow =
            document.getElementById("hero-eyebrow");

        const title =
            document.getElementById("hero-title");

        const button =
            document.getElementById("hero-cta");

        if (!background || !slide) return;

        const image = bannerImage(slide);
        const overlay =
            "linear-gradient(90deg, rgba(35, 26, 29, 0.74), rgba(35, 26, 29, 0.08))";

        background.classList.add("is-changing");

        window.setTimeout(() => {
            background.style.backgroundImage = image
                ? `${overlay}, url("${image}")`
                : `${overlay}, linear-gradient(135deg, #6f5059, #e9a8b5)`;

            background.style.backgroundPosition =
                slide.position || "center";

            if (eyebrow && slide.eyebrow) {
                eyebrow.textContent = slide.eyebrow;
            }

            if (title && slide.title) {
                title.textContent = slide.title;
            }

            if (button) {
                button.textContent =
                    slide.buttonText || "Ver productos";

                button.href =
                    slide.target || "#lo-mas-vendido";
            }

            background.classList.remove("is-changing");
        }, 120);
    }

    function mapApiBanner(banner) {
        return {
            desktopImage:
                banner.imagenEscritorio ||
                banner.desktopImage ||
                "",
            mobileImage:
                banner.imagenMovil ||
                banner.mobileImage ||
                "",
            position:
                banner.posicion ||
                banner.position ||
                "center",
            eyebrow:
                banner.eyebrow ||
                banner.textoSuperior ||
                "",
            title:
                banner.titulo ||
                banner.title ||
                "",
            buttonText:
                banner.textoBoton ||
                banner.buttonText ||
                "Ver productos",
            target:
                banner.destino ||
                banner.target ||
                "#lo-mas-vendido"
        };
    }

    async function getBannerSlides() {
        try {
            const data =
                await API.request(
                    "/banners"
                );

            if (
                Array.isArray(data) &&
                data.length
            ) {
                return data.map(
                    mapApiBanner
                );
            }
        } catch (error) {
            console.warn(
                "Se utilizarán los banners de config.js:",
                error.message
            );
        }

        return Array.isArray(
            CONFIG.HOME_BANNERS
        )
            ? CONFIG.HOME_BANNERS
            : [];
    }

    async function initBanner() {
        const slides =
            await getBannerSlides();

        if (!slides.length) return;

        applyBannerSlide(slides[0]);

        if (slides.length > 1) {
            bannerTimer = window.setInterval(() => {
                bannerIndex =
                    (bannerIndex + 1) % slides.length;

                applyBannerSlide(
                    slides[bannerIndex]
                );
            }, 7000);
        }

        window
            .matchMedia("(max-width: 700px)")
            .addEventListener?.("change", () => {
                applyBannerSlide(
                    slides[bannerIndex]
                );
            });
    }

    function initHeroScroll() {
        const button =
            document.getElementById("hero-cta");

        button?.addEventListener("click", (event) => {
            const selector =
                button.getAttribute("href");

            if (!selector?.startsWith("#")) return;

            const destination =
                document.querySelector(selector);

            if (!destination) return;

            event.preventDefault();

            destination.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    }

    function openCustomizationFromQuery() {
        const params =
            new URLSearchParams(window.location.search);

        if (params.get("personalizar") === "1") {
            window.Customization?.open();
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        initCarouselArrows();
        initBanner();
        initHeroScroll();

        window.setTimeout(
            openCustomizationFromQuery,
            0
        );
    });

    window.addEventListener("beforeunload", () => {
        window.clearInterval(bannerTimer);
    });
})();
