import "./globals.css";

export const metadata = {
  title: "Transcriptor AI | Minutas Ejecutivas",
  description: "Transcripción inteligente y generación de minutas ejecutivas para empresas.",
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
