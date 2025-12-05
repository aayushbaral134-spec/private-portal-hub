import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LinkManager from '@/components/LinkManager';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Private Portal Hub</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <Button onClick={handleLogout} variant="outline">Logout</Button>
        </div>
      </header>
      <main>
        <Tabs defaultValue="links" className="w-full">
          <TabsList>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="documents" disabled>Documents</TabsTrigger>
            <TabsTrigger value="memos" disabled>Memos</TabsTrigger>
          </TabsList>
          <TabsContent value="links">
            <LinkManager />
          </TabsContent>
          <TabsContent value="documents">
            {/* Documents feature will be added here */}
          </TabsContent>
          <TabsContent value="memos">
            {/* Memos feature will be added here */}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;