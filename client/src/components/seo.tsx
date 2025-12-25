import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
}

const defaultTitle =
  "Shah Faisal Wani | Software Engineer & Full-Stack Developer Portfolio";
const defaultDescription =
  "Software Engineer specializing in React, Node.js, AI integration, and blockchain development. Building scalable web applications with modern technologies. Explore my projects, experience, and get in touch for collaboration opportunities.";
const defaultImage = "https://www.faisalwani.dev/logo.jpg";
const defaultUrl = "https://www.faisalwani.dev";
const defaultKeywords =
  "Software Engineer, Shah Faisal Wani, React Developer, Full-Stack Developer, Web Development, Portfolio, JavaScript, TypeScript, Node.js, SolidJS, Golang, MongoDB, AI Developer, Blockchain Developer, NFT Developer, TailwindCSS, Frontend Developer, Backend Developer";

export const SEO: React.FC<SEOProps> = ({
  title = defaultTitle,
  description = defaultDescription,
  image = defaultImage,
  url = defaultUrl,
  type = "website",
  keywords = defaultKeywords,
}) => {
  const fullTitle =
    title === defaultTitle ? title : `${title} | ${defaultTitle}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <link rel="canonical" href={url} />
    </Helmet>
  );
};
