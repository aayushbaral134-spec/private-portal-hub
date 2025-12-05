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

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-center sm:text-left">Private Portal Hub</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</span>
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