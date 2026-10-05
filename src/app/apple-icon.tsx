import { renderAppIcon } from "@/components/pwa/app-icon";

// iOS home screen icon. iOS ignores the manifest icons and rounds the corners
// itself, so this one is a full square like a maskable icon.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderAppIcon({ size: 180, maskable: true });
}
