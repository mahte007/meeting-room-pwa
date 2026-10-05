import { renderAppIcon } from "@/components/pwa/app-icon";

// Favicon. Next adds the <link rel="icon"> tag automatically.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return renderAppIcon({ size: 32 });
}
