import "./globals.css";

export const metadata = {
  title: "SGF Transcriptor Pro | Minutas Corporativas",
  description: "Gestión avanzada de reuniones y generación de minutas para Sisprot Global Fiber.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
