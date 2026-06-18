import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAD 算量校验器",
  description: "DXF 空间工程量准确性验证工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

