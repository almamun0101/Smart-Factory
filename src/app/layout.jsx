import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import "./globals.css";
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap"
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap"
});
const metadata = {
  title: "Factory Production Management System",
  description: "Track daily production, machines, workers, and billing on the factory floor."
};
function RootLayout({ children }) {
  return <html lang="en" suppressHydrationWarning>
      <body
    className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} font-body antialiased`}
  >
        <AuthProvider>
          <SettingsProvider>
            {children}
            <Toaster richColors position="top-right" />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>;
}
export {
  RootLayout as default,
  metadata
};
