import { useEffect, useState } from "react";

export function normalizeHashPath(hash) {
  const raw = typeof hash === "string" ? hash : "";
  const stripped = raw.startsWith("#") ? raw.slice(1) : raw;
  const withSlash = stripped.startsWith("/") ? stripped : `/${stripped}`;
  const cleaned = withSlash.replace(/\/{2,}/g, "/");
  return cleaned === "/" ? "/" : cleaned.replace(/\/$/, "");
}

export function getHashPath() {
  return normalizeHashPath(window.location.hash || "#/");
}

export function navigateHash(path) {
  const normalized = normalizeHashPath(path.startsWith("#") ? path : `#${path}`);
  window.location.hash = normalized === "/" ? "#/" : `#${normalized}`;
}

export function useHashPath() {
  const [path, setPath] = useState(() => getHashPath());

  useEffect(() => {
    const onChange = () => setPath(getHashPath());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return path;
}

