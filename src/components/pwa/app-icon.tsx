import { ImageResponse } from "next/og";

export const ICON_BACKGROUND = "#0f172a";

type AppIconOptions = {
  size: number;
  // Maskable icons fill the whole square and keep the glyph inside the
  // central "safe zone", because the OS crops them into its own shape.
  maskable?: boolean;
};

/**
 * Renders the app icon (a calendar with a check mark) as a PNG. Used for
 * the manifest icons, the favicon and the Apple touch icon, so they all
 * come from one design.
 */
export function renderAppIcon({ size, maskable = false }: AppIconOptions) {
  const glyphSize = Math.round(size * (maskable ? 0.5 : 0.62));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: ICON_BACKGROUND,
          borderRadius: maskable ? 0 : Math.round(size * 0.22),
        }}
      >
        <svg
          width={glyphSize}
          height={glyphSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
          <path d="M8 2.5v4M16 2.5v4M3 10h18" />
          <path d="M8.5 15.5l2.5 2.5 4.5-4.5" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
