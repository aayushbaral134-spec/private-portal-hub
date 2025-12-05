import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

const Login = () => {
  const { session } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleSignup = async (data: SignupFormData) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (signUpError) {
      if (signUpError.message.includes('User already registered')) {
        setError("An account with this email already exists.");
      } else if (signUpError.message.includes('Only @gmail.com addresses are allowed')) {
        setError("Only @gmail.com addresses are allowed to sign up.");
      } else {
        setError(signUpError.message);
      }
    } else {
      setMessage("Check your email for the confirmation link.");
      signupForm.reset();
    }

    setLoading(false);
  };

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-transparent">
      <Tabs defaultValue="signin" className="w-full max-w-md p-4 sm:p-0">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin" onClick={() => { setError(null); setMessage(null); }}>Sign In</TabsTrigger>
          <TabsTrigger value="signup" onClick={() => { setError(null); setMessage(null); }}>Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your portal.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="m@example.com" {...loginForm.register('email')} />
                  {loginForm.formState.errors.email && <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" {...loginForm.register('password')} />
                  {loginForm.formState.errors.password && <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create a new account to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {message && (
                  <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="you@gmail.com" {...signupForm.register('email')} />
                  {signupForm.formState.errors.email && <p className="text-sm text-red-500">{signupForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" {...signupForm.register('password')} />
                  {signupForm.formState.errors.password && <p className="text-sm text-red-500">{signupForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Login;