import type { MetadataRoute } from "next";
import { getCollections, getProducts } from "@/lib/shopify";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thetombvideo.com";
const BASE_URL_NORMALIZED = BASE_URL.replace(/\/+$/, "");

function urlFor(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL_NORMALIZED}${normalizedPath}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: urlFor("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: urlFor("/collections"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: urlFor("/bargain-bin"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: urlFor("/cart"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  try {
    const [products, collections] = await Promise.all([
      getProducts(250),
      getCollections(250),
    ]);

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: urlFor(`/products/${product.handle}`),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const collectionRoutes: MetadataRoute.Sitemap = collections.map((collection) => ({
      url: urlFor(`/collections/${collection.handle}`),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    }));

    return [...staticRoutes, ...collectionRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
