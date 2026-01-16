"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Project } from './types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/provider';
import { collection, doc, getDoc, setDoc, query, getDocs } from 'firebase/firestore';

type UserAppStatus = 'loading' | 'pending' | 'approved' | 'admin';

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
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (userLoading) {
            setUserAppStatus('loading');
            return;
        }
        if (!user || !firestore) {
            setIsAdmin(false);
            setUserAppStatus('loading'); // No user, so no status
            setDataLoading(false);
            return;
        }

        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        const isDesignatedAdmin = user.email === adminEmail;
        
        const userRef = doc(firestore, 'users', user.uid);

        const setupUserAndStatus = async () => {
            try {
                const userDoc = await getDoc(userRef);

                if (!userDoc.exists()) {
                    // This is a new user registration request
                    await setDoc(userRef, { 
                        email: user.email, 
                        role: isDesignatedAdmin ? 'admin' : 'user',
                        status: 'pending'
                    });
                    setIsAdmin(isDesignatedAdmin);
                    setUserAppStatus('pending');
                } else {
                    // User exists, check their status and role
                    const userData = userDoc.data();
                    const userRole = userData.role;
                    const userStatus = userData.status;
                    
                    const effectiveRole = isDesignatedAdmin ? 'admin' : userRole;
                    
                    // Ensure designated admin always has admin role in DB
                    if (isDesignatedAdmin && userRole !== 'admin') {
                        await setDoc(userRef, { role: 'admin' }, { merge: true });
                    }
                    
                    setIsAdmin(effectiveRole === 'admin');

                    if (effectiveRole === 'admin') {
                        setUserAppStatus('admin');
                    } else {
                        setUserAppStatus(userStatus as 'pending' | 'approved');
                    }
                }
            } catch (error) {
                console.error("Error setting up user and status:", error);
                toast({ title: "Hata", description: "Kullanıcı durumu ayarlanırken bir sorun oluştu.", variant: "destructive" });
                setUserAppStatus('loading'); // Revert to loading on error
            }
        };

        setupUserAndStatus();

    }, [user, userLoading, firestore, toast]);

    const projectsQuery = useMemoFirebase(() => {
        if (!firestore || userAppStatus === 'pending' || userAppStatus === 'loading') {
            return null;
        }
        // Admin and approved users see all projects
        return query(collection(firestore, "projects"));
    }, [firestore, userAppStatus]);
    
    const { data: projects, isLoading: projectsLoading } = useCollection<Project>(projectsQuery);

    // Effect to set loading state
    useEffect(() => {
        setDataLoading(userLoading || (user != null && projectsLoading));
    }, [userLoading, projectsLoading, user]);

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
                            toast({ title: "Ortak Proje Oluşturuldu." });
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
    }, [projects, projectsLoading, userAppStatus, firestore, toast]);

    const selectedProject = projects?.find(p => p.id === selectedProjectId) || null;
    
    const value: ProjectContextType = {
        projects,
        selectedProject,
        loading: dataLoading || userAppStatus === 'loading',
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
