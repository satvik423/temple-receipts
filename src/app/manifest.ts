import type { MetadataRoute } from "next";
import { getOrCreateSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getOrCreateSettings();

  return {
    name: settings.name,
    short_name: settings.name,
    description: `Seva receipt counter for ${settings.name}`,
    start_url: "/",
    display: "standalone",
    background_color: "#b54708",
    theme_color: "#b54708",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
