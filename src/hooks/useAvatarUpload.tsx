import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseAvatarUploadOptions {
  userId: string;
  onSuccess?: (url: string) => void;
}

export function useAvatarUpload({ userId, onSuccess }: UseAvatarUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadAvatar = async (file: File) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    // Validate file type against allowed MIME types
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (JPG, PNG, GIF, WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB per security policy)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create unique filename using UUID - never preserve original filename
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

      // Delete old avatar if exists
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from("avatars").remove(filesToDelete);
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      onSuccess?.(publicUrl);

      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated successfully.",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return {
    uploading,
    avatarUrl,
    setAvatarUrl,
    fileInputRef,
    handleFileSelect,
    triggerFileInput,
  };
}
