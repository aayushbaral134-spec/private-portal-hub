import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LinkManager from '@/components/LinkManager';
import DocumentManager from '@/components/DocumentManager';
import MemoManager from '@/components/MemoManager';
import AccountSettings from '@/components/AccountSettings';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getInitials = () => {
    const firstName = profile?.first_name || '';
    const lastName = profile?.last_name || '';
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  const displayName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : user?.email;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-center sm:text-left">Private Portal Hub</h1>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={profile?.avatar_url} alt={displayName} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">{displayName}</span>
          <ThemeToggle />
          <Button onClick={handleLogout} variant="outline">Logout</Button>
        </div>
      </header>
      <main>
        <Tabs defaultValue="links" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="memos">Memos</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          <TabsContent value="links">
            <LinkManager />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentManager />
          </TabsContent>
          <TabsContent value="memos">
            <MemoManager />
          </TabsContent>
          <TabsContent value="account">
            <AccountSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;