"use strict";

(function () {
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

    function openCustomizationFromQuery() {
        const params =
            new URLSearchParams(window.location.search);

        if (params.get("personalizar") === "1") {
            window.Customization?.open();
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        initCarouselArrows();

        window.setTimeout(
            openCustomizationFromQuery,
            0
        );
    });
})();
