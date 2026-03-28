import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necesario al consumir rootsy-feparts desde file:../ o workspaces (código ya transpilado en dist,
  // pero Next sigue recomendando explicitar paquetes internos del monorepo).
  transpilePackages: ["rootsy-feparts"],
};

export default nextConfig;
