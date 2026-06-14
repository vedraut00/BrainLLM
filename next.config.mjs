/** @type {import('next').NextConfig} */
const nextConfig = {
  // These pull in Node-only deps; keep them out of the bundler so server code
  // (ingest/extract) runs against the real packages.
  serverExternalPackages: ["cheerio", "turndown", "@modelcontextprotocol/sdk"],
};

export default nextConfig;
