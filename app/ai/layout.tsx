import type { ReactNode } from "react";
import { SectionLayout } from "@/components/layout/SectionLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <SectionLayout section="ai">{children}</SectionLayout>;
}
