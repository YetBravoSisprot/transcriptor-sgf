import "./globals.css";

export const metadata = {
  title: "Minutas SGF",
  description: "Transcripción inteligente y generación de minutas ejecutivas para empresas.",
  icons: {
    icon: "/favicon.ico",
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
