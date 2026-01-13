"use client";

import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';

// Proje ve veri tiplerini tanımlıyoruz
interface Project {
    id: string;
    name: string;
}

interface ProjectContextType {
    projects: Project[];
    selectedProject: Project | null;
    selectProject: (projectId: string | null) => void;
    addProject: (projectName: string) => void;
    updateProjectName: (projectId: string, newName: string) => void;
    deleteProject: (projectId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// LocalStorage'dan verileri okumak ve yazmak için yardımcı fonksiyonlar
const getInitialState = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const defaultProjects: Project[] = [
    { id: "proje-istanbul", name: "İstanbul Ofis Projesi" },
    { id: "proje-ankara", name: "Ankara Konut Projesi" },
];


export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
    const [projects, setProjects] = useState<Project[]>(() => getInitialState('projects', defaultProjects));
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => getInitialState('selectedProjectId', projects[0]?.id || null));
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if(isLoaded) {
            localStorage.setItem('projects', JSON.stringify(projects));
        }
    }, [projects, isLoaded]);

    useEffect(() => {
        if(isLoaded) {
            localStorage.setItem('selectedProjectId', JSON.stringify(selectedProjectId));
        }
    }, [selectedProjectId, isLoaded]);


    const selectProject = (projectId: string | null) => {
        setSelectedProjectId(projectId);
    };

    const addProject = (projectName: string) => {
        const newProject = {
            id: `proje-${projectName.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
            name: projectName,
        };
        setProjects(prev => [...prev, newProject]);
        setSelectedProjectId(newProject.id);
    };
    
    const updateProjectName = (projectId: string, newName: string) => {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: newName } : p));
    };

    const deleteProject = (projectId: string) => {
        setProjects(prev => {
            const newProjects = prev.filter(p => p.id !== projectId);
            if (selectedProjectId === projectId) {
                setSelectedProjectId(newProjects[0]?.id || null);
            }
            return newProjects;
        });
    };

    const selectedProject = useMemo(() => {
        if (!isLoaded) return null;
        return projects.find(p => p.id === selectedProjectId) || null;
    }, [selectedProjectId, projects, isLoaded]);

    const value = {
        projects,
        selectedProject,
        selectProject,
        addProject,
        updateProjectName,
        deleteProject,
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
