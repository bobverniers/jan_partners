import type { Metadata } from "next";
import { Geist, Geist_Mono, Raleway } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bridge Hospitality Partners",
  description: "Internal database of hotel managers",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getClaims();
  const email =
    typeof data?.claims?.email === "string" ? data.claims.email : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${raleway.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader email={email} />
        {children}
      </body>
    </html>
  );
}
