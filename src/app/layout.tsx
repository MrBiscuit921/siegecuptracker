import type {Metadata} from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Rainbow Six Siege Cup Tracker",
  description: "An app to track Rainbow Six Siege cups and tournaments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
