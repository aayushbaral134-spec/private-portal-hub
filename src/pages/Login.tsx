import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const Login = () => {
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to access your portal</CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="light"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;