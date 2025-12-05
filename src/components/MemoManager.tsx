import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { showSuccess, showError } from '@/utils/toast';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';

const memoSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  content: z.string().optional(),
});

type MemoFormData = z.infer<typeof memoSchema>;
type Memo = {
  id: string;
  title: string;
  content: string;
  updated_at: string;
};

const MemoManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);

  const { data: memos, isLoading } = useQuery<Memo[]>({
    queryKey: ['memos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<MemoFormData>({
    resolver: zodResolver(memoSchema),
  });

  const addMemoMutation = useMutation({
    mutationFn: async (newMemo: MemoFormData) => {
      const { error } = await supabase.from('memos').insert([{ ...newMemo, user_id: user!.id }]);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      showSuccess("Memo added successfully!");
      setIsDialogOpen(false);
    },
    onError: (error) => showError(error.message),
  });

  const updateMemoMutation = useMutation({
    mutationFn: async (updatedMemo: MemoFormData) => {
      const { error } = await supabase.from('memos').update(updatedMemo).eq('id', selectedMemo!.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      showSuccess("Memo updated successfully!");
      setIsDialogOpen(false);
    },
    onError: (error) => showError(error.message),
  });

  const deleteMemoMutation = useMutation({
    mutationFn: async (memoId: string) => {
      const { error } = await supabase.from('memos').delete().eq('id', memoId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      showSuccess("Memo deleted successfully!");
      setIsAlertOpen(false);
    },
    onError: (error) => showError(error.message),
  });

  const openAddDialog = () => {
    reset();
    setSelectedMemo(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (memo: Memo) => {
    setSelectedMemo(memo);
    setValue('title', memo.title);
    setValue('content', memo.content);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (memo: Memo) => {
    setSelectedMemo(memo);
    setIsAlertOpen(true);
  };

  const onSubmit = (data: MemoFormData) => {
    if (selectedMemo) {
      updateMemoMutation.mutate(data);
    } else {
      addMemoMutation.mutate(data);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Memos</CardTitle>
          <CardDescription>Jot down your personal notes and reminders.</CardDescription>
        </div>
        <Button onClick={openAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Memo
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : memos && memos.length > 0 ? (
          <ul className="space-y-4">
            {memos.map((memo) => (
              <li key={memo.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">{memo.title}</p>
                  <p className="text-sm text-gray-500">Last updated: {format(new Date(memo.updated_at), "PPP p")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(memo)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(memo)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">You haven't created any memos yet.</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedMemo ? 'Edit Memo' : 'Add New Memo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" {...register('content')} rows={10} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={addMemoMutation.isPending || updateMemoMutation.isPending}>
                {selectedMemo ? 'Save Changes' : 'Add Memo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this memo. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMemoMutation.mutate(selectedMemo!.id)} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default MemoManager;