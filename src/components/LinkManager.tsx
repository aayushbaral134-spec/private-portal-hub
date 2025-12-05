import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash2, Edit, PlusCircle, ExternalLink } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { showSuccess, showError } from '@/utils/toast';
import { Skeleton } from './ui/skeleton';

const linkSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  url: z.string().url({ message: "Please enter a valid URL" }),
});

type LinkFormData = z.infer<typeof linkSchema>;
type Link = {
  id: string;
  title: string;
  url: string;
  created_at: string;
};

const fetchLinks = async (userId: string) => {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Link[];
};

const LinkManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);

  const { data: links, isLoading } = useQuery<Link[]>({
    queryKey: ['links', user?.id],
    queryFn: () => fetchLinks(user!.id),
    enabled: !!user,
  });

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
  });

  const addLinkMutation = useMutation({
    mutationFn: async (newLink: LinkFormData) => {
      const { error } = await supabase.from('links').insert([{ ...newLink, user_id: user!.id }]);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      showSuccess("Link added successfully!");
      setIsDialogOpen(false);
      reset();
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const updateLinkMutation = useMutation({
    mutationFn: async (updatedLink: LinkFormData) => {
      const { error } = await supabase.from('links').update(updatedLink).eq('id', selectedLink!.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      showSuccess("Link updated successfully!");
      setIsDialogOpen(false);
      reset();
      setSelectedLink(null);
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from('links').delete().eq('id', linkId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      showSuccess("Link deleted successfully!");
      setIsAlertOpen(false);
      setSelectedLink(null);
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const openAddDialog = () => {
    reset();
    setSelectedLink(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (link: Link) => {
    setSelectedLink(link);
    setValue('title', link.title);
    setValue('url', link.url);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (link: Link) => {
    setSelectedLink(link);
    setIsAlertOpen(true);
  };

  const onSubmit = (data: LinkFormData) => {
    if (selectedLink) {
      updateLinkMutation.mutate(data);
    } else {
      addLinkMutation.mutate(data);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Links</CardTitle>
          <CardDescription>Manage your important links here.</CardDescription>
        </div>
        <Button onClick={openAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Link
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : links && links.length > 0 ? (
          <ul className="space-y-4">
            {links.map((link) => (
              <li key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline flex items-center">
                    {link.title}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                  <p className="text-sm text-gray-500 break-all">{link.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(link)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(link)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">You haven't saved any links yet.</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedLink ? 'Edit Link' : 'Add New Link'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input id="url" {...register('url')} />
              {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={addLinkMutation.isPending || updateLinkMutation.isPending}>
                {selectedLink ? 'Save Changes' : 'Add Link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteLinkMutation.mutate(selectedLink!.id)} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default LinkManager;