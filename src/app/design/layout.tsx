import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${inter.variable} ${inter.className}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "#FFFFFF",
        color: "#0B0B0F",
        fontFamily:
          "var(--font-inter), Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      {children}
    </div>
  );
}
