// nuki.nooks Brand-Schriften, lokal aus public/fonts (Chrome hier vertraut dem Proxy-Zertifikat nicht)
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const BRICO = "Bricolage Grotesque";
export const GOCHI = "Gochi Hand";
export const POPPINS = "Poppins";

loadFont({ family: BRICO, url: staticFile("fonts/BricolageGrotesque-200-800-latin.woff2"), weight: "200 800" });
loadFont({ family: GOCHI, url: staticFile("fonts/GochiHand-400-latin.woff2"), weight: "400" });
loadFont({ family: POPPINS, url: staticFile("fonts/Poppins-400-latin.woff2"), weight: "400" });
loadFont({ family: POPPINS, url: staticFile("fonts/Poppins-600-latin.woff2"), weight: "600" });
