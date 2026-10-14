export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // next-themes sets the HTML class and color-scheme before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
import { Providers } from "@/components/providers";

