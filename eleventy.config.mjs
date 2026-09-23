export default function configureEleventy(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  for (const file of ["CNAME", "robots.txt", "sitemap.xml", "site-manifest.json", "llms.txt", "404.html"]) {
    eleventyConfig.addPassthroughCopy(file);
  }

  return {
    dir: { input: ".", output: "_site" },
    templateFormats: ["html"],
    htmlTemplateEngine: false,
    dataTemplateEngine: false
  };
}
