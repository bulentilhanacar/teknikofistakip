"use client";

import { ProjectProvider } from "@/context/project-context";
import { FirebaseClientProvider } from "@/firebase";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </FirebaseClientProvider>
  );
}
