"use strict";

(function () {
    const DEFAULT_TITLE = "Mommy Crafts | Productos personalizados en Chile";
    const DEFAULT_DESCRIPTION = "Productos personalizados, regalos sublimados y detalles únicos preparados con revisión previa, atención cercana y entrega coordinada en Chile.";
    const DEFAULT_IMAGE = "https://res.cloudinary.com/jo3bgrnh/image/upload/v1782320550/Mommy_Crafts_2_1_hbj8xi.png";
    const SITE_URL = String(window.CONFIG?.SITE_URL || window.location.origin || "https://mommycrafts.cl").replace(/\/+$/, "");
    const SITE_NAME = window.CONFIG?.SITE_NAME || "Mommy Crafts";
    const BRAND_NAME = window.CONFIG?.BRAND_NAME || SITE_NAME;
    const LOCALE = window.CONFIG?.locale || "es-CL";
    const CURRENCY = window.CONFIG?.currency || "CLP";

    const PAGE_SEO = Object.freeze({
        "home": {
            path: "/",
            title: DEFAULT_TITLE,
            description: DEFAULT_DESCRIPTION,
            type: "website"
        },
        "catalog": {
            path: "/catalogo.html",
            title: "Catálogo de productos personalizados | Mommy Crafts",
            description: "Explora productos personalizados, regalos, librería, tazas, botellas, vestuario y opciones especiales de Mommy Crafts.",
            type: "website"
        },
        "product": {
            path: "/producto.html",
            title: "Producto personalizado | Mommy Crafts",
            description: "Revisa precio, imágenes, stock, opciones de personalización y condiciones de entrega de este producto Mommy Crafts.",
            type: "product"
        },
        "cart": {
            path: "/carrito.html",
            title: "Carrito | Mommy Crafts",
            description: "Revisa los productos seleccionados antes de finalizar tu compra en Mommy Crafts.",
            noindex: true
        },
        "checkout": {
            path: "/finalizar-compra.html",
            title: "Finalizar compra | Mommy Crafts",
            description: "Completa tus datos de entrega, pago y personalización para finalizar tu pedido en Mommy Crafts.",
            noindex: true
        },
        "account": {
            path: "/cuenta.html",
            title: "Mi cuenta | Mommy Crafts",
            description: "Consulta tus pedidos, pagos, diseños y datos de cliente en Mommy Crafts.",
            noindex: true
        },
        "access": {
            path: "/acceso.html",
            title: "Acceso de clientes | Mommy Crafts",
            description: "Ingresa o crea tu cuenta de cliente Mommy Crafts.",
            noindex: true
        },
        "payment": {
            path: "/pago.html",
            title: "Estado del pago | Mommy Crafts",
            description: "Revisa el resultado del pago asociado a tu pedido Mommy Crafts.",
            noindex: true
        },
        "order": {
            path: "/pedido.html",
            title: "Detalle del pedido | Mommy Crafts",
            description: "Consulta el estado y detalle de tu pedido Mommy Crafts.",
            noindex: true
        },
        "tracking": {
            path: "/seguimiento-pedido.html",
            title: "Seguimiento de pedido | Mommy Crafts",
            description: "Consulta el avance de un pedido Mommy Crafts con la información solicitada.",
            noindex: true
        },
        "comparison": {
            path: "/comparacion.html",
            title: "Comparar productos personalizados | Mommy Crafts",
            description: "Compara productos, precios, stock y características antes de elegir tu regalo personalizado en Mommy Crafts."
        },
        "page": {
            path: "/pagina.html",
            title: "Información | Mommy Crafts",
            description: "Información operativa de Mommy Crafts.",
            noindex: true
        }
    });

    function cleanText(value, fallback = "") {
        return String(value || fallback || "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function truncate(value, max = 155) {
        const text = cleanText(value);
        if (text.length <= max) return text;
        return `${text.slice(0, max - 1).trim()}…`;
    }

    function absoluteUrl(pathOrUrl = "/") {
        const value = String(pathOrUrl || "/").trim();
        if (/^https?:\/\//i.test(value)) return value;
        const path = value.startsWith("/") ? value : `/${value}`;
        return `${SITE_URL}${path}`;
    }

    function currentPath() {
        const pathname = window.location.pathname || "/";
        if (pathname === "/index.html") return "/";
        return pathname || "/";
    }

    function currentCanonicalUrl(path) {
        const targetPath = path || currentPath();
        return absoluteUrl(targetPath === "/index.html" ? "/" : targetPath);
    }

    function ensureMeta(selector, attributes) {
        let element = document.head.querySelector(selector);
        if (!element) {
            element = document.createElement("meta");
            document.head.appendChild(element);
        }
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    }

    function ensureLink(rel, href) {
        let element = document.head.querySelector(`link[rel="${rel}"]`);
        if (!element) {
            element = document.createElement("link");
            element.rel = rel;
            document.head.appendChild(element);
        }
        element.href = href;
        return element;
    }

    function setRobots(noindex) {
        const content = noindex
            ? "noindex, nofollow, noarchive"
            : "index, follow";
        ensureMeta('meta[name="robots"]', {
            name: "robots",
            content
        });
    }

    function setOpenGraph({ title, description, url, image, type = "website" }) {
        ensureMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
        ensureMeta('meta[property="og:locale"]', { property: "og:locale", content: LOCALE.replace("-", "_") });
        ensureMeta('meta[property="og:type"]', { property: "og:type", content: type });
        ensureMeta('meta[property="og:title"]', { property: "og:title", content: title });
        ensureMeta('meta[property="og:description"]', { property: "og:description", content: description });
        ensureMeta('meta[property="og:url"]', { property: "og:url", content: url });
        ensureMeta('meta[property="og:image"]', { property: "og:image", content: image || DEFAULT_IMAGE });
        ensureMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: title });

        ensureMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
        ensureMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
        ensureMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
        ensureMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image || DEFAULT_IMAGE });
    }

    function setSchema(id, data) {
        if (!data) return;
        let element = document.getElementById(id);
        if (!element) {
            element = document.createElement("script");
            element.type = "application/ld+json";
            element.id = id;
            document.head.appendChild(element);
        }
        element.textContent = JSON.stringify(data);
    }

    function organizationSchema() {
        return {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: BRAND_NAME,
            url: SITE_URL,
            logo: DEFAULT_IMAGE,
            sameAs: [
                window.CONFIG?.social?.instagram,
                window.CONFIG?.social?.tiktok,
                window.CONFIG?.social?.threads
            ].filter(Boolean),
            contactPoint: {
                "@type": "ContactPoint",
                contactType: "sales and customer support",
                telephone: window.CONFIG?.soporteTelefono || "+56 9 5463 3848",
                email: window.CONFIG?.ventasEmail || window.CONFIG?.soporteEmail || "ventas@mommycrafts.cl",
                areaServed: "CL",
                availableLanguage: "Spanish"
            }
        };
    }

    function webSiteSchema() {
        return {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: SITE_URL,
            potentialAction: {
                "@type": "SearchAction",
                target: `${SITE_URL}/catalogo.html?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            }
        };
    }

    function breadcrumbSchema(items) {
        const list = (items || []).filter(Boolean);
        if (!list.length) return null;
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: list.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: item.name,
                item: absoluteUrl(item.path || item.url || "/")
            }))
        };
    }

    function updatePage(config = {}) {
        const title = truncate(config.title || DEFAULT_TITLE, 65);
        const description = truncate(config.description || DEFAULT_DESCRIPTION, 158);
        const url = currentCanonicalUrl(config.path);
        const image = config.image || DEFAULT_IMAGE;
        const type = config.type || "website";

        document.title = title;
        ensureMeta('meta[name="description"]', { name: "description", content: description });
        ensureLink("canonical", url);
        setRobots(Boolean(config.noindex));
        setOpenGraph({ title, description, url, image, type });
        ensureMeta('meta[name="theme-color"]', { name: "theme-color", content: "#f7eef1" });
        ensureMeta('meta[name="format-detection"]', { name: "format-detection", content: "telephone=no" });

        setSchema("seo-organization-schema", organizationSchema());
        if (type === "website") {
            setSchema("seo-website-schema", webSiteSchema());
        }
        if (!config.noBreadcrumb) {
            setSchema("seo-breadcrumb-schema", breadcrumbSchema([
                { name: "Inicio", path: "/" },
                config.path && config.path !== "/" ? { name: title.replace(/\s+\|\s+Mommy Crafts$/i, ""), path: config.path } : null
            ]));
        }
    }

    function getProductUrl(product) {
        const link = window.ProductLinks?.detail?.(product) || "producto.html";
        return absoluteUrl(link.startsWith("/") ? link : `/${link}`);
    }

    function productImage(product) {
        return product?.imagenPrincipal || product?.imagenes?.[0] || DEFAULT_IMAGE;
    }

    function productAvailability(product) {
        const stock = Number(product?.stock ?? product?.inventario ?? 0);
        if (Number.isFinite(stock) && stock <= 0) return "https://schema.org/OutOfStock";
        return "https://schema.org/InStock";
    }

    function updateProduct(product) {
        if (!product) return;

        const productName = cleanText(product.nombre, "Producto personalizado");
        const title = truncate(`${productName} | Mommy Crafts`, 65);
        const description = truncate(
            product.descripcion || `Compra ${productName} en Mommy Crafts. Revisa precio, opciones disponibles, personalización y entrega coordinada.`,
            158
        );
        const url = getProductUrl(product);
        const image = productImage(product);
        const price = Number(product.precio || product.precioBase || 0);
        const sku = cleanText(product.sku || product.id || "");

        document.title = title;
        ensureMeta('meta[name="description"]', { name: "description", content: description });
        ensureLink("canonical", url);
        setRobots(false);
        setOpenGraph({ title, description, url, image, type: "product" });
        ensureMeta('meta[property="product:price:amount"]', { property: "product:price:amount", content: String(price || "") });
        ensureMeta('meta[property="product:price:currency"]', { property: "product:price:currency", content: CURRENCY });

        const schema = {
            "@context": "https://schema.org",
            "@type": "Product",
            name: productName,
            description,
            image: Array.isArray(product.imagenes) && product.imagenes.length ? product.imagenes : [image],
            sku: sku || undefined,
            brand: {
                "@type": "Brand",
                name: cleanText(product.marca, BRAND_NAME)
            },
            category: cleanText(product.categoria || product.categoriaPrincipal || "Productos personalizados"),
            offers: {
                "@type": "Offer",
                url,
                priceCurrency: CURRENCY,
                price: price || undefined,
                availability: productAvailability(product),
                itemCondition: "https://schema.org/NewCondition"
            }
        };

        if (Number(product.valoracionPromedio) > 0 && Number(product.cantidadResenas) > 0) {
            schema.aggregateRating = {
                "@type": "AggregateRating",
                ratingValue: Number(product.valoracionPromedio).toFixed(1),
                reviewCount: Number(product.cantidadResenas)
            };
        }

        setSchema("seo-product-schema", schema);
        setSchema("seo-breadcrumb-schema", breadcrumbSchema([
            { name: "Inicio", path: "/" },
            { name: "Catálogo", path: "/catalogo.html" },
            product.categoria ? { name: product.categoria, path: `/catalogo.html?categoria=${encodeURIComponent(product.categoria)}` } : null,
            { name: productName, url }
        ]));
    }

    function updateContentPage(content = {}) {
        updatePage({
            path: `/${content.slug || currentPath().replace(/^\//, "")}.html`,
            title: content.seoTitle || content.title || DEFAULT_TITLE,
            description: content.seoDescription || content.summary || DEFAULT_DESCRIPTION,
            type: "article"
        });

        if (Array.isArray(content.faqs) && content.faqs.length) {
            setSchema("seo-faq-schema", {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: content.faqs.map((faq) => ({
                    "@type": "Question",
                    name: cleanText(faq.question),
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: cleanText(faq.answer)
                    }
                }))
            });
        }
    }

    function initStaticPage() {
        const page = document.body?.dataset?.page || document.body?.dataset?.contentSlug || "";
        const filename = (window.location.pathname.split("/").pop() || "index.html").replace(/\.html$/i, "");
        const config = PAGE_SEO[page] || PAGE_SEO[filename] || null;

        if (config) updatePage(config);
    }

    window.MommySEO = Object.freeze({
        updatePage,
        updateProduct,
        updateContentPage,
        absoluteUrl
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initStaticPage, { once: true });
    } else {
        initStaticPage();
    }
})();
