import { useState, useRef } from 'react';
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
import { Trash2, Edit, Upload, FileText, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { Skeleton } from './ui/skeleton';
import { v4 as uuidv4 } from 'uuid';

const renameSchema = z.object({
  name: z.string().min(1, { message: "Document name is required" }),
});

type RenameFormData = z.infer<typeof renameSchema>;
type Document = {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const DocumentManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['documents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<RenameFormData>({
    resolver: zodResolver(renameSchema),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const filePath = `${user!.id}/${uuidv4()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw new Error(uploadError.message);

      const { error: insertError } = await supabase.from('documents').insert({
        user_id: user!.id,
        name: file.name,
        storage_path: filePath,
        file_type: file.type,
        file_size: file.size,
      });

      if (insertError) throw new Error(insertError.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      showSuccess("Document uploaded successfully!");
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const renameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const { error } = await supabase.from('documents').update({ name: newName }).eq('id', selectedDoc!.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      showSuccess("Document renamed successfully!");
      setIsRenameOpen(false);
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: Document) => {
      const { error: storageError } = await supabase.storage.from('documents').remove([doc.storage_path]);
      if (storageError) throw new Error(storageError.message);

      const { error: dbError } = await supabase.from('documents').delete().eq('id', doc.id);
      if (dbError) throw new Error(dbError.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      showSuccess("Document deleted successfully!");
      setIsDeleteOpen(false);
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50 MB limit
        showError("File size cannot exceed 50 MB.");
        event.target.value = ''; // Reset file input
        return;
      }
      const toastId = showLoading("Uploading document...");
      uploadMutation.mutate(file, {
        onSuccess: () => dismissToast(toastId),
        onError: () => dismissToast(toastId),
      });
    }
    event.target.value = ''; // Reset file input
  };

  const openRenameDialog = (doc: Document) => {
    setSelectedDoc(doc);
    setValue('name', doc.name);
    setIsRenameOpen(true);
  };

  const openDeleteDialog = (doc: Document) => {
    setSelectedDoc(doc);
    setIsDeleteOpen(true);
  };

  const onRenameSubmit = (data: RenameFormData) => {
    renameMutation.mutate(data.name);
  };

  const handleView = async (doc: Document) => {
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(doc.storage_path, 3600); // Link valid for 1 hour
    if (error) {
      showError("Could not create a viewable link.");
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Documents</CardTitle>
          <CardDescription>Upload and manage your personal files.</CardDescription>
        </div>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" /> Upload File
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : documents && documents.length > 0 ? (
          <ul className="space-y-4">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <FileText className="h-6 w-6 text-gray-500" />
                  <div>
                    <p className="font-semibold">{doc.name}</p>
                    <p className="text-sm text-gray-500">{formatBytes(doc.file_size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleView(doc)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openRenameDialog(doc)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(doc)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">You haven't uploaded any documents yet.</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Document</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onRenameSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Document Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={renameMutation.isPending}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the document. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(selectedDoc!)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default DocumentManager;