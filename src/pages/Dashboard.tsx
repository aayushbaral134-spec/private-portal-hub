import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';

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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <Button onClick={handleLogout} variant="outline">Logout</Button>
        </div>
      </header>
      <main>
        <div className="p-8 text-center border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">Welcome to your Private Portal!</h2>
            <p className="text-gray-500 mt-2">We'll add features for links, documents, and memos here in the next steps.</p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;