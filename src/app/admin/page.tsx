"use client";

import { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProject } from '@/context/project-context';
import { CheckCircle } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface AppUser {
    id: string;
    email: string;
    role: 'admin' | 'user';
    status: 'pending' | 'approved';
}

const UserList = ({ users, onApproveUser }: { users: AppUser[], onApproveUser: (id: string) => void }) => {
    
    const { pendingUsers, approvedUsers } = useMemo(() => {
        const pending = users.filter(u => u.status === 'pending');
        const approved = users.filter(u => u.status === 'approved');
        return { pendingUsers: pending, approvedUsers: approved };
    }, [users]);
    
    return (
        <div className="grid gap-6 md:grid-cols-1">
            <Card>
                <CardHeader>
                    <CardTitle>Onay Bekleyen Kullanıcılar</CardTitle>
                    <CardDescription>Bu kullanıcılar sisteme erişim talebinde bulundu. Onaylayarak erişimlerini sağlayabilirsiniz.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>E-posta Adresi</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingUsers.length > 0 ? pendingUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" onClick={() => onApproveUser(user.id)}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Onayla
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center">Onay bekleyen kullanıcı bulunmuyor.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Onaylı Kullanıcılar</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>E-posta Adresi</TableHead>
                                <TableHead>Rol</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {approvedUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                          {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};


export default function AdminPage() {
    const { isAdmin } = useProject();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);

    const { data: users, isLoading } = useCollection<AppUser>(usersQuery);

    const handleApproveUser = async (userId: string) => {
        if (!firestore) return;
        try {
            const userRef = doc(firestore, 'users', userId);
            await updateDoc(userRef, { status: 'approved' });
            toast({ title: "Kullanıcı Onaylandı", description: "Kullanıcı artık sisteme erişebilir." });
        } catch (error) {
            console.error("Error approving user:", error);
            toast({ title: "Hata", description: "Kullanıcı onaylanamadı.", variant: "destructive" });
        }
    };


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

    if (isLoading) {
        return <div>Kullanıcılar yükleniyor...</div>
    }

    return (
        <div className="grid gap-6">
            <h1 className="text-3xl font-bold font-headline">Admin Paneli</h1>
            
            <div className="grid gap-6">
                {users && <UserList users={users} onApproveUser={handleApproveUser} />}
            </div>
        </div>
    );
}
