import { Metadata } from 'next';

export type BlogMetaProps = {
  title: string;
  description: string;
  keywords: string[];
  ogImageUrl?: string;
  canonicalUrl?: string;
  publishDate?: string;
  authorName?: string;
};

/**
 * Creates consistent SEO metadata for blog pages
 */
export function createBlogMeta({
  title,
  description,
  keywords,
  ogImageUrl = '/og-image.png',
  canonicalUrl,
  publishDate,
  authorName = 'Digital Receipt Pro Team',
}: BlogMetaProps): Metadata {
  // Base URL for the site
  const baseUrl = 'https://digitalreceiptpro.com';
  
  // Default image if none provided
  const imageUrl = ogImageUrl.startsWith('http') 
    ? ogImageUrl 
    : `${baseUrl}${ogImageUrl}`;

  return {
    title: `${title} | Digital Receipt Pro Blog`,
    description,
    keywords: [...keywords, 'digital receipts', 'receipt management', 'paperless business'],
    authors: [{ name: authorName }],
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: publishDate,
      url: canonicalUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      siteName: 'Digital Receipt Pro',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
    }
  };
}