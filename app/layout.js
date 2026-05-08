import "./globals.css";
import { Providers } from './providers';

export const metadata = {
  title: "INDEXIA",
  description: "Catalog anything with voice and style.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
