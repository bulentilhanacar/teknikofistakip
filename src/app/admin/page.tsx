"use client";

import { useState, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { useProject } from '@/context/project-context';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, getDocs, query, where, writeBatch, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Project } from '@/context/types';

interface AppUser {
    id: string;
    email: string;
    role: 'admin' | 'user';
}

const NewUserForm = ({ onUserAdded }: { onUserAdded: () => void }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'user'>('user');
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleAddUser = async () => {
        if (!email || !firestore) {
            toast({ title: "Hata", description: "E-posta adresi boş olamaz.", variant: "destructive" });
            return;
        }
        try {
            // Check if user already exists in users_by_email
            const userByEmailQuery = query(collection(firestore, 'users_by_email'), where('email', '==', email));
            const userByEmailSnapshot = await getDocs(userByEmailQuery);
            if (!userByEmailSnapshot.empty) {
                toast({ title: "Hata", description: "Bu e-posta adresine sahip bir kullanıcı zaten mevcut.", variant: "destructive" });
                return;
            }
             // Since we don't have the UID yet, we add them to an allowlist collection.
            // A Cloud Function or a post-login check would be needed to create the real user record in 'users' collection with their UID.
            // For now, we'll just add to users_by_email.
            await addDoc(collection(firestore, 'users_by_email'), { email, role });
            // Note: This only adds user to an allowlist. The user record in 'users' will be created on first login.
            toast({ title: "Kullanıcı İzin Listesine Eklendi", description: `${email} sisteme ${role} rolüyle giriş yapabilir.` });
            setEmail('');
            setRole('user');
            onUserAdded();
        } catch (error) {
            console.error("Error adding user:", error);
            toast({ title: "Hata", description: "Kullanıcı eklenemedi.", variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Yeni Kullanıcı Ekle</CardTitle>
                <CardDescription>Sisteme erişim izni olan yeni bir kullanıcı tanımlayın.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4 items-end">
                <div className="flex-1">
                    <Label htmlFor="email">E-posta Adresi</Label>
                    <Input id="email" type="email" placeholder="kullanici@ornek.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="w-[150px]">
                    <Label htmlFor="role">Rol</Label>
                    <Select value={role} onValueChange={(value: 'admin' | 'user') => setRole(value)}>
                        <SelectTrigger id="role">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="user">Kullanıcı</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleAddUser}>
                    <PlusCircle className="mr-2" />
                    Kullanıcı Ekle
                </Button>
            </CardContent>
        </Card>
    );
};

const UserList = ({ users, onUserDeleted }: { users: AppUser[], onUserDeleted: () => void }) => {
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleDeleteUser = async (user: AppUser) => {
        if (!firestore) return;
        try {
            const batch = writeBatch(firestore);

            // Delete from 'users' collection
            const userRef = doc(firestore, 'users', user.id);
            batch.delete(userRef);

            // Find and delete from 'users_by_email' collection
            const emailQuery = query(collection(firestore, 'users_by_email'), where('email', '==', user.email));
            const emailQuerySnapshot = await getDocs(emailQuery);
            if (!emailQuerySnapshot.empty) {
                const emailDocRef = emailQuerySnapshot.docs[0].ref;
                batch.delete(emailDocRef);
            }
            
            await batch.commit();

            toast({ title: "Kullanıcı Silindi" });
            onUserDeleted();
        } catch (error) {
            console.error("Error deleting user:", error);
            toast({ title: "Hata", description: "Kullanıcı silinemedi.", variant: "destructive" });
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tanımlı Kullanıcılar</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>E-posta Adresi</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.email}</TableCell>
                                <TableCell>{user.role === 'admin' ? 'Admin' : 'Kullanıcı'}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {user.email} kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteUser(user)}>Evet, Sil</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

const AllProjectsList = ({ projects }: { projects: Project[] | null }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Sistemdeki Tüm Projeler</CardTitle>
                <CardDescription>Tüm kullanıcılar tarafından oluşturulan projelerin listesi.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Proje Adı</TableHead>
                            <TableHead>Proje Sahibi (ID)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projects && projects.length > 0 ? projects.map(project => (
                            <TableRow key={project.id}>
                                <TableCell className="font-medium">{project.name}</TableCell>
                                <TableCell className="font-mono text-xs">{project.ownerId}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center">
                                    Sistemde henüz proje oluşturulmamış.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default function AdminPage() {
    const { projects: allProjects, user, isAdmin } = useProject();
    const firestore = useFirestore();
    
    // We now query all users since this is an admin page.
    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);

    const { data: users } = useCollection<AppUser>(usersQuery);

    const [refreshKey, setRefreshKey] = useState(0);
    const handleUserChange = () => setRefreshKey(k => k + 1);

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">Erişim Reddedildi</CardTitle>
                        <CardDescription>
                            Bu sayfayı görüntülemek için admin yetkilerine sahip olmalısınız.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="grid gap-6">
            <h1 className="text-3xl font-bold font-headline">Admin Paneli</h1>
            
            <div className="grid gap-6">
                <NewUserForm onUserAdded={handleUserChange} />
                {users && <UserList users={users} onUserDeleted={handleUserChange} />}
                 <AllProjectsList projects={allProjects} />
            </div>
        </div>
    );
}
