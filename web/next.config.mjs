/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    // Keep the `pg` native Node.js driver out of the Edge/serverless bundle.
    // Without this, Next.js tries to bundle pg (which depends on net, tls, dns)
    // into the Edge Runtime, causing "middleware invocation failed" on Vercel.
    serverComponentsExternalPackages: ['pg'],
  },
}
export default nextConfig
