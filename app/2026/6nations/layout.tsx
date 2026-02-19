import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NavBar from "./NavBarRenderer";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "6 Nations fantasy",
  description: "Explore fantasy insights",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div>
      <NavBar />
      <main className="flex min-h-screen flex-col items-center justify-between pt-20 p-4 lg:p-24 bg-gray-100">
        {children}
      </main>
    </div>
  );
}
