import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';
import { Skeleton } from './ui/skeleton';
import { Separator } from './ui/separator';
import { useEffect } from 'react';

const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  avatar_url: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal('')),
});

const passwordSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const AccountSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
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

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (profile) {
      profileForm.setValue('first_name', profile.first_name || '');
      profileForm.setValue('last_name', profile.last_name || '');
      profileForm.setValue('avatar_url', profile.avatar_url || '');
    }
  }, [profile, profileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: ProfileFormData) => {
      const { error } = await supabase.from('profiles').update(updatedProfile).eq('id', user!.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      showSuccess("Profile updated successfully!");
    },
    onError: (error) => showError(error.message),
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

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

  if (isLoadingProfile) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Manage your profile and account settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-md">
          <h3 className="text-lg font-semibold">User Profile</h3>
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input id="first_name" {...profileForm.register('first_name')} />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input id="last_name" {...profileForm.register('last_name')} />
          </div>
          <div>
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input id="avatar_url" {...profileForm.register('avatar_url')} />
            {profileForm.formState.errors.avatar_url && <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.avatar_url.message}</p>}
          </div>
          <Button type="submit" disabled={updateProfileMutation.isPending}>
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>

        <Separator />

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