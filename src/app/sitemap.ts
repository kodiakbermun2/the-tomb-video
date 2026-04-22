import type { MetadataRoute } from "next";
import { getCollections, getProducts } from "@/lib/shopify";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thetombvideo.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/collections`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cart`,
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
      url: `${BASE_URL}/products/${product.handle}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const collectionRoutes: MetadataRoute.Sitemap = collections.map((collection) => ({
      url: `${BASE_URL}/collections/${collection.handle}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    }));

    return [...staticRoutes, ...collectionRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
