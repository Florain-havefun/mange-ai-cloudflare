import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "满格 AI · 给灵感，充满格",
  description: "ChatGPT Go、Plus、Pro 100 月度订阅协助服务，价格透明，订单可查。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
