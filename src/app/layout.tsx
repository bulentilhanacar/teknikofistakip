import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "@/components/main-layout";
import { Inter as FontSans, Roboto_Mono as FontMono } from "next/font/google";
import { cn } from "@/lib/utils";
import { ProjectProvider } from "@/context/project-context";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "İnşaat Takip",
  description:
    "Bina inşaatı işinde teknik ofisin ihale, sözleşme, hakediş, kesinti takibi yapabileceği bir uygulama",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={cn(
          "font-sans antialiased",
          fontSans.variable,
          fontMono.variable
        )}>
        <ProjectProvider>
            <MainLayout>{children}</MainLayout>
        </ProjectProvider>
        <Toaster />
      </body>
    </html>
  );
}
