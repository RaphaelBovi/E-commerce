import { useEffect } from "react";

const SITE_NAME = "Sua Loja";
const DEFAULT_DESC = "A melhor loja online com produtos de qualidade, entrega rápida e preços competitivos.";
const DEFAULT_IMAGE = "/og-default.jpg";

function setMeta(selector, attr, value) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    const [attrName, attrVal] = selector.match(/\[([^=]+)=['"]([^'"]+)['"]\]/)?.slice(1) ?? [];
    if (attrName) el.setAttribute(attrName, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function useSEO({ title, description, image, url, noindex = false }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const desc  = description || DEFAULT_DESC;
    const img   = image       || DEFAULT_IMAGE;
    const href  = url         || window.location.href;

    document.title = fullTitle;

    // Standard meta
    setMeta("meta[name='description']",    "content", desc);

    // Open Graph
    setMeta("meta[property='og:title']",       "content", fullTitle);
    setMeta("meta[property='og:description']", "content", desc);
    setMeta("meta[property='og:image']",       "content", img);
    setMeta("meta[property='og:url']",         "content", href);

    // Twitter Card
    setMeta("meta[name='twitter:title']",       "content", fullTitle);
    setMeta("meta[name='twitter:description']", "content", desc);
    setMeta("meta[name='twitter:image']",       "content", img);

    // Robots
    let robotsMeta = document.querySelector("meta[name='robots']");
    if (noindex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement("meta");
        robotsMeta.setAttribute("name", "robots");
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute("content", "noindex, nofollow");
    } else if (robotsMeta) {
      robotsMeta.remove();
    }
  }, [title, description, image, url, noindex]);
}
