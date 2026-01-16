
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { useUser } from '@/firebase/provider';
import { collection, doc, getDoc, setDoc, query, updateDoc } from 'firebase/firestore';

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
    
    const loading = userLoading || userAppStatus === 'loading';

    useEffect(() => {
        if (userLoading) {
            setUserAppStatus('loading');
            return;
        }
        if (!user || !firestore) {
            setUserAppStatus('loading');
            setIsAdmin(false);
            return;
        }

        const userRef = doc(firestore, 'users', user.uid);
        const isDesignatedAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

        const setupUserAndStatus = async () => {
            try {
                if (isDesignatedAdmin) {
                    // This is the admin. Ensure their record is correct.
                    await setDoc(userRef, {
                        email: user.email,
                        role: 'admin',
                        status: 'approved'
                    }, { merge: true }); // Use merge to create or update.
                    
                    setIsAdmin(true);
                    setUserAppStatus('admin');

                } else {
                    // This is a regular user.
                    const userDoc = await getDoc(userRef);
                    if (!userDoc.exists()) {
                        // New user, create pending record.
                        await setDoc(userRef, {
                            email: user.email,
                            role: 'user',
                            status: 'pending'
                        });
                        setIsAdmin(false);
                        setUserAppStatus('pending');
                    } else {
                        // Existing user, read their status.
                        const userData = userDoc.data();
                        setIsAdmin(false); // Regular users are never admins
                        if (userData.status === 'approved') {
                            setUserAppStatus('approved');
                        } else {
                            setUserAppStatus('pending');
                        }
                    }
                }
            } catch (error) {
                console.error("Error setting up user status:", error);
                toast({ title: "Hata", description: "Kullanıcı rolü ayarlanırken bir sorun oluştu.", variant: "destructive" });
                setUserAppStatus('error');
            }
        };

        setupUserAndStatus();

    }, [user, userLoading, firestore, toast]);


    // For this app model, all approved users share one project.
    useEffect(() => {
        if (!firestore || (userAppStatus !== 'approved' && userAppStatus !== 'admin')) {
            setProjects(null);
            setSelectedProject(null);
            return;
        }
        
        const projectCollection = collection(firestore, "projects");

        // There should only be one project in this shared workspace model.
        // Let's ensure it exists.
        const ensureSharedProject = async () => {
            const projectQuery = query(projectCollection);
            const querySnapshot = await getDocs(projectQuery);
            if (querySnapshot.empty) {
                // If no project exists, the admin should be able to create one.
                // For now, let's just log this. In a real app, you might prompt the admin.
                console.log("No shared project found.");
                const newProjectRef = doc(projectCollection);
                await setDoc(newProjectRef, {
                    name: "Ortak Proje",
                    id: newProjectRef.id
                });
                const newProject = { id: newProjectRef.id, name: "Ortak Proje"};
                setProjects([newProject]);
                setSelectedProject(newProject);
                
            } else {
                // Set the single shared project.
                const projectDoc = querySnapshot.docs[0];
                const projectData = { ...projectDoc.data(), id: projectDoc.id } as Project;
                setProjects([projectData]);
                setSelectedProject(projectData);
            }
        };

        ensureSharedProject();

    }, [firestore, userAppStatus]);

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
