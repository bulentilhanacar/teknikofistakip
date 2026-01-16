
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/provider';
import { collection, doc, getDoc, setDoc, query, getDocs } from 'firebase/firestore';

type UserAppStatus = 'loading' | 'pending' | 'approved' | 'admin' | 'error';

interface ProjectContextType {
    projects: Project[] | null;
    selectedProject: Project | null;
    loading: boolean;
    user: ReturnType<typeof useUser>['user'];
    isAdmin: boolean;
    userAppStatus: UserAppStatus;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user, loading: userLoading } = useUser();
    
    const [projects, setProjects] = useState<Project[] | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userAppStatus, setUserAppStatus] = useState<UserAppStatus>('loading');
    
    // loading is true if firebase auth is loading OR if a user is logged in but their app status hasn't been determined yet.
    const loading = userLoading || (!!user && userAppStatus === 'loading');

    useEffect(() => {
        if (userLoading) {
            return; // Wait for Firebase Auth to finish loading
        }
        if (!user || !firestore) {
            // No user is logged in. Reset all states. The UI will show the Login screen.
            setUserAppStatus('loading'); // Reset status
            setIsAdmin(false);
            setProjects(null);
            setSelectedProject(null);
            return;
        }

        const isDesignatedAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

        const setupUserAndProjects = async () => {
            let finalStatus: UserAppStatus = 'error';
            let finalIsAdmin = false;

            try {
                const userRef = doc(firestore, 'users', user.uid);
                
                if (isDesignatedAdmin) {
                    finalIsAdmin = true;
                    finalStatus = 'admin';
                    // Ensure the user document in Firestore reflects admin status.
                    await setDoc(userRef, {
                        email: user.email,
                        role: 'admin',
                        status: 'approved'
                    }, { merge: true });
                } else {
                    // This is a regular user.
                    finalIsAdmin = false;
                    const userDoc = await getDoc(userRef);
                    if (!userDoc.exists()) {
                        // New user, create a 'pending' record.
                        await setDoc(userRef, {
                            email: user.email,
                            role: 'user',
                            status: 'pending'
                        });
                        finalStatus = 'pending';
                    } else {
                        // Existing user, read their status from the document.
                        const userData = userDoc.data();
                        finalStatus = userData.status === 'approved' ? 'approved' : 'pending';
                    }
                }
                
                // Set the status and admin state once determined
                setIsAdmin(finalIsAdmin);
                setUserAppStatus(finalStatus);

                // If the user is approved or admin, load the shared project.
                if (finalStatus === 'approved' || finalStatus === 'admin') {
                     const projectCollection = collection(firestore, "projects");
                     const projectQuery = query(projectCollection);
                     const querySnapshot = await getDocs(projectQuery);
                     if (querySnapshot.empty) {
                         // If no project exists, create the default shared one.
                         const newProjectRef = doc(projectCollection);
                         await setDoc(newProjectRef, { name: "Ortak Proje" });
                         const newProject = { id: newProjectRef.id, name: "Ortak Proje" };
                         setProjects([newProject]);
                         setSelectedProject(newProject);
                     } else {
                         // Otherwise, load the existing shared project.
                         const projectDoc = querySnapshot.docs[0];
                         const projectData = { ...projectDoc.data(), id: projectDoc.id } as Project;
                         setProjects([projectData]);
                         setSelectedProject(projectData);
                     }
                } else {
                    // If user is pending, they don't see any projects.
                    setProjects(null);
                    setSelectedProject(null);
                }

            } catch (error) {
                console.error("Error during user and project setup:", error);
                toast({ title: "Kurulum Hatası", description: "Kullanıcı veya proje verileri ayarlanırken bir sorun oluştu.", variant: "destructive" });
                setUserAppStatus('error');
            }
        };

        setupUserAndProjects();

    }, [user, userLoading, firestore, toast]);

    const value: ProjectContextType = {
        projects,
        selectedProject,
        loading,
        user,
        isAdmin,
        userAppStatus
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = (): ProjectContextType => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
