import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@/app/globals.css";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "WEB RADIO POWER DANCE",
  description: "Web Rádio Power Dance Campo Grande MS",
  icons: { icon: "/image/fav-icon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full w-full overflow-x-hidden">
      <body className="h-full min-h-screen w-full bg-black text-white antialiased overflow-x-hidden relative flex flex-col m-0 p-0">
        {children}
        <Script
          id="pwa-and-security"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
              document.addEventListener('contextmenu', e => e.preventDefault());
              document.addEventListener('keydown', e => {
                if (e.key === 'F12' || e.keyCode === 123) e.preventDefault();
              });
            `,
          }}
        />
      </body>
    </html>
  );
}