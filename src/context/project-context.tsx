
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/provider';
import { collection, doc, getDoc, setDoc, query, getDocs, updateDoc } from 'firebase/firestore';

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
    
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userAppStatus, setUserAppStatus] = useState<UserAppStatus>('loading');

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

        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        const isDesignatedAdmin = user.email === adminEmail;
        const userRef = doc(firestore, 'users', user.uid);

        const setupUserAndStatus = async () => {
            try {
                const userDoc = await getDoc(userRef);

                if (!userDoc.exists()) {
                    // New user registration. Admin is approved by default.
                    const newUser = {
                        email: user.email,
                        role: isDesignatedAdmin ? 'admin' : 'user',
                        status: isDesignatedAdmin ? 'approved' : 'pending'
                    };
                    await setDoc(userRef, newUser);
                    
                    setIsAdmin(isDesignatedAdmin);
                    setUserAppStatus(isDesignatedAdmin ? 'admin' : 'pending');
                } else {
                    // Existing user.
                    const userData = userDoc.data();
                    let userRole = userData.role;
                    let userStatus = userData.status;
                    
                    if (isDesignatedAdmin && (userRole !== 'admin' || userStatus !== 'approved')) {
                        await updateDoc(userRef, { role: 'admin', status: 'approved' });
                        userRole = 'admin';
                        userStatus = 'approved';
                    }
                    
                    setIsAdmin(userRole === 'admin');

                    if (userRole === 'admin') {
                        setUserAppStatus('admin');
                    } else if (userStatus === 'approved') {
                        setUserAppStatus('approved');
                    } else {
                        setUserAppStatus('pending');
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

    const projectsQuery = useMemoFirebase(() => {
        if (!firestore || (userAppStatus !== 'approved' && userAppStatus !== 'admin')) {
            return null;
        }
        // Admin and approved users see all projects in the shared workspace
        return query(collection(firestore, "projects"));
    }, [firestore, userAppStatus]);
    
    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

    // Effect to manage the single shared project
    useEffect(() => {
        if (userAppStatus === 'approved' || userAppStatus === 'admin') {
            if (!projectsLoading && projects) {
                if (projects.length === 0) {
                    // No projects exist, create the default one
                    const createDefaultProject = async () => {
                         if (!firestore) return;
                         try {
                            const newProjectRef = doc(collection(firestore, "projects"));
                            await setDoc(newProjectRef, {
                                name: "Ortak Proje",
                            });
                            setSelectedProjectId(newProjectRef.id);
                         } catch (error) {
                             console.error("Error creating default project:", error);
                         }
                    }
                    createDefaultProject();
                } else {
                    // Projects exist, select the first one as the default shared project
                    setSelectedProjectId(projects[0].id);
                }
            }
        }
    }, [projects, projectsLoading, userAppStatus, firestore]);

    const selectedProject = projects?.find(p => p.id === selectedProjectId) || null;
    
    const contextIsLoading = userLoading || (!!user && (projectsLoading || userAppStatus === 'loading'));

    const value: ProjectContextType = {
        projects,
        selectedProject,
        loading: contextIsLoading,
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
