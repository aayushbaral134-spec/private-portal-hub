import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';

const passwordSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const AccountSettings = () => {
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;
      showSuccess("Password updated successfully!");
      passwordForm.reset();
    } catch (error: any) {
      showError(error.message || "Failed to update password.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Manage your account settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
          <h3 className="text-lg font-semibold">Change Password</h3>
          <div>
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" {...passwordForm.register('password')} />
            {passwordForm.formState.errors.password && <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.password.message}</p>}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
            {passwordForm.formState.errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
            {passwordForm.formState.isSubmitting ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AccountSettings;