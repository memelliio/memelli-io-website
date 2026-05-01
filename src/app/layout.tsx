import { Inter } from "next/font/google";
import { OsBodyClass } from "./_components/OsBodyClass";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

export default function OsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.variable} ${inter.className}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
        fontFamily:
          "var(--font-inter), Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <OsBodyClass />
      {children}
    </div>
  );
}
