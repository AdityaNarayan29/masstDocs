import type { ReactNode } from "react";
import { SectionLayout } from "@/components/layout/SectionLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <SectionLayout section="dsa">{children}</SectionLayout>;
}
