// Root layout: navigation, scroll-reveal script, page content, footer.
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Nestly — Make friends at secret house parties in Miami",
  description:
    "House parties in Miami for adults who want new friends. Every guest is verified, and AI introduces you to three people at the door.",
};

export const viewport: Viewport = { themeColor: "#150f4f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Nav />
        <ScrollReveal />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
