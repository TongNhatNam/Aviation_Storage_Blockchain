import { navigateHash, normalizeHashPath } from "./hashPath.js";

export function HashLink({ to, children, className, style }) {
  const href = (() => {
    const normalized = normalizeHashPath(to);
    return normalized === "/" ? "#/" : `#${normalized}`;
  })();

  return (
    <a
      className={className}
      style={style}
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigateHash(to);
      }}
    >
      {children}
    </a>
  );
}
