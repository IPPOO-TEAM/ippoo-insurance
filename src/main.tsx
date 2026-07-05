// Point d'entrée pour un build Vite standard (hébergement externe : Cloudflare
// Pages, Netlify, Vercel…). Dans l'environnement Figma Make, c'est plutôt
// `__figma__entrypoint__.ts` (généré au runtime, gitignoré) qui est utilisé ;
// ce fichier-ci sert uniquement aux déploiements hors Figma via `vite build`.
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./app/App";

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
