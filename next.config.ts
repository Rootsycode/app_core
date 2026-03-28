import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En dev, React Strict Mode monta/desmonta/remonta los client components y vuelve a ejecutar los
  // useEffect: cada server action disparada ahí corre dos veces (doble pegada + logs duplicados).
  // En producción el build no aplica ese doble montaje; si querés de nuevo la ayuda de Strict Mode
  // en local, poné `true` y usá deduplicación por request donde haga falta.
  reactStrictMode: false,
  // Necesario al consumir rootsy-feparts desde file:../ o workspaces (código ya transpilado en dist,
  // pero Next sigue recomendando explicitar paquetes internos del monorepo).
  transpilePackages: ["rootsy-feparts"],
};

export default nextConfig;
