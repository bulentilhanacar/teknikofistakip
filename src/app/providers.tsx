"use client";

import { ProjectProvider } from "@/context/project-context";
import { FirebaseProvider } from "@/firebase/provider";
import { MainLayout } from "@/components/main-layout";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider>
      <ProjectProvider>
        <MainLayout>{children}</MainLayout>
      </ProjectProvider>
    </FirebaseProvider>
  );
}
