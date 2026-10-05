import type { MetadataRoute } from "next";
import { ICON_BACKGROUND } from "@/components/pwa/app-icon";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // A stable identity, so changing start_url later doesn't make browsers
    // treat it as a different app.
    id: "/",
    name: "Meeting Room Reservation",
    short_name: "Meeting Rooms",
    description: "Progressive Web Application for meeting room reservation",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Shown on the splash screen while the app starts; matches the page.
    background_color: "#f8fafc",
    theme_color: ICON_BACKGROUND,
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // Long-press / right-click menu on the installed app's icon.
    shortcuts: [
      {
        name: "New reservation",
        url: "/reservations/new",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Calendar",
        url: "/calendar",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Find a room",
        url: "/rooms/available",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
