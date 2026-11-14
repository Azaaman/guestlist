import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Guestlist — Get on the list. Win the season.",
  description:
    "Invite-only parties for adults 30–40. Guests approve guests, couples compete, the best pair wins a trip.",
};

export const viewport: Viewport = { themeColor: "#07051a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
