import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import g1 from "../../imports/photo_15_2026-05-25_15-34-44.jpg";
import g2 from "../../imports/photo_14_2026-05-25_15-34-44.jpg";
import g3 from "../../imports/photo_10_2026-05-25_15-34-44.jpg";
import g4 from "../../imports/photo_8_2026-05-25_15-34-44.jpg";
import g5 from "../../imports/photo_6_2026-05-25_15-34-44.jpg";
import g6 from "../../imports/photo_5_2026-05-25_15-34-44.jpg";

interface GalleryItem {
  src: string;
  alt: string;
  label: string;
  city: string;
  color: string;
}

const items: GalleryItem[] = [
  { src: g1, alt: "Portrait", label: "", city: "", color: "#FF7A00" },
  { src: g2, alt: "Portrait", label: "", city: "", color: "#FF3B57" },
  { src: g3, alt: "Portrait", label: "", city: "", color: "#2A6BFF" },
  { src: g4, alt: "Portrait", label: "", city: "", color: "#FF4FAE" },
  { src: g5, alt: "Portrait", label: "", city: "", color: "#16B26A" },
  { src: g6, alt: "Portrait", label: "", city: "", color: "#8A4BFF" },
];

const layoutClasses = ["row-span-2", "", "", "row-span-2", "", ""];

interface AfricaGalleryProps {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  variant?: "vibrant" | "soft";
}

export function AfricaGallery({
  title = "L'Afrique qui entreprend",
  subtitle = "Une mosaïque de visages, de métiers et de quartiers que nous accompagnons chaque jour.",
  eyebrow = "NOTRE COMMUNAUTÉ",
  variant = "vibrant",
}: AfricaGalleryProps) {
  const soft = variant === "soft";

  return (
    <section className={`px-4 sm:px-6 lg:px-8 py-12 sm:py-20 ${soft ? "bg-[#FAF7F2]" : "bg-[#FFF8F2]"}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12 max-w-3xl mx-auto">
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white"
            style={{
              background: soft
                ? "linear-gradient(90deg,#B8946A,#A98AA8)"
                : "linear-gradient(90deg,#FF7A00,#FF3B57)",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
            }}
          >
            {eyebrow}
          </span>
          <h2 className="mt-5" style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {title}
          </h2>
          <p className="mt-4 text-[#5a544c]" style={{ fontSize: "1rem", lineHeight: 1.65 }}>
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-[160px] sm:auto-rows-[200px] gap-3 sm:gap-4">
          {items.map((it, i) => (
            <motion.div
              key={it.src}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: (i % 4) * 0.06, duration: 0.5 }}
              className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all ${layoutClasses[i] || ""}`}
            >
              <ImageWithFallback
                src={it.src}
                alt={it.alt}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div
                className="absolute inset-0 opacity-90 group-hover:opacity-60 transition-opacity"
                style={{
                  background: `linear-gradient(180deg, transparent 40%, ${it.color}dd 100%)`,
                }}
                aria-hidden
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
