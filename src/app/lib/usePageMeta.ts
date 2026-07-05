import { useEffect } from "react";
import favIcon from "../../imports/FAV_IPPOO.png";

interface Meta {
  title: string;
  description?: string;
  image?: string;
}

function setOrCreateMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setCanonical() {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", window.location.href);
}

function setStructuredData(id: string, data: object) {
  let s = document.head.querySelector<HTMLScriptElement>(`script[data-ld="${id}"]`);
  if (!s) {
    s = document.createElement("script");
    s.type = "application/ld+json";
    s.setAttribute("data-ld", id);
    document.head.appendChild(s);
  }
  s.textContent = JSON.stringify(data);
}

export function useOrganizationLD() {
  useEffect(() => {
    setStructuredData("org", {
      "@context": "https://schema.org",
      "@type": "InsuranceAgency",
      name: "IPPOO ASSURANCE",
      legalName: "IPPOO ASSURANCE SA",
      url: typeof window !== "undefined" ? window.location.origin : "",
      logo: favIcon,
      areaServed: "BJ",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Parakou",
        addressRegion: "Borgou",
        addressCountry: "BJ",
      },
      contactPoint: [{
        "@type": "ContactPoint",
        telephone: "+229-01-41-52-10-92",
        email: "contact@ippoo.bj",
        contactType: "customer service",
        availableLanguage: ["fr"],
      }],
      sameAs: [],
    });
  }, []);
}

export function usePageMeta({ title, description, image }: Meta) {
  useEffect(() => {
    const fullTitle = `${title} | IPPOO ASSURANCE`;
    document.title = fullTitle;

    if (description) {
      setOrCreateMeta("name", "description", description);
      setOrCreateMeta("property", "og:description", description);
      setOrCreateMeta("name", "twitter:description", description);
    }
    setOrCreateMeta("property", "og:title", fullTitle);
    setOrCreateMeta("property", "og:type", "website");
    setOrCreateMeta("property", "og:site_name", "IPPOO ASSURANCE");
    setOrCreateMeta("property", "og:url", window.location.href);
    setOrCreateMeta("name", "twitter:title", fullTitle);
    setOrCreateMeta("name", "twitter:card", image ? "summary_large_image" : "summary");

    if (image) {
      setOrCreateMeta("property", "og:image", image);
      setOrCreateMeta("name", "twitter:image", image);
    }

    setOrCreateMeta("name", "robots", "index, follow");
    setOrCreateMeta("name", "author", "IPPOO ASSURANCE SA");
    setOrCreateMeta("http-equiv" as "name", "content-language", "fr-BJ");
    setOrCreateMeta("http-equiv" as "name", "Content-Type", "text/html; charset=UTF-8");
    let charsetEl = document.head.querySelector("meta[charset]");
    if (!charsetEl) {
      charsetEl = document.createElement("meta");
      charsetEl.setAttribute("charset", "UTF-8");
      document.head.insertBefore(charsetEl, document.head.firstChild);
    } else {
      charsetEl.setAttribute("charset", "UTF-8");
    }
    if (document.documentElement.getAttribute("lang") !== "fr") {
      document.documentElement.setAttribute("lang", "fr");
    }
    setOrCreateMeta("name", "theme-color", "#FFFFFF");
    setOrCreateMeta("name", "apple-mobile-web-app-capable", "yes");
    setOrCreateMeta("name", "apple-mobile-web-app-status-bar-style", "default");
    setOrCreateMeta("name", "msapplication-navbutton-color", "#FFFFFF");

    setCanonical();
  }, [title, description, image]);
}
