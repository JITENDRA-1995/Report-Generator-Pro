import logoUrl from "@assets/PARAGON_LOGO_1776781679624.png";

export function ParagonLogo({ className = "" }: { className?: string }) {
  return <img src={logoUrl} alt="Paragon" className={className} style={{ maxWidth: "100%", maxHeight: 60, objectFit: "contain" }} />;
}
