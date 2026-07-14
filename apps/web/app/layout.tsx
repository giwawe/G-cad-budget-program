import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "整装预算报价系统",
  description: "支持 DXF/DWG 方案解析的整装预算报价工作台",
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
