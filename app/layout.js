import "./globals.css";

export const metadata = {
  title: "OrganizaMudança",
  description: "Encontre tudo na sua mudança com voz e estilo.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
