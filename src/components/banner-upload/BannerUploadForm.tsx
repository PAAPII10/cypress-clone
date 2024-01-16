"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import {
  appFoldersType,
  appWorkspacesType,
  useAppState,
} from "@/lib/providers/state-provider";
import { File, Folder, workspace } from "@/lib/supabase/supabase.types";
import { UploadBannerFromSchema } from "@/lib/types";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Loader from "../global/Loader";
import { useToast } from "../ui/use-toast";
import {
  updateFile,
  updateFolder,
  updateWorkspace,
} from "@/lib/supabase/queries";

interface IBannerUploadFormProps {
  dirType: "workspace" | "file" | "folder";
  id: string;
}
const BannerUploadForm = ({ dirType, id }: IBannerUploadFormProps) => {
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const { state, workspaceId, folderId, dispatch } = useAppState();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting: isUploading, errors },
  } = useForm<z.infer<typeof UploadBannerFromSchema>>({
    mode: "onChange",
    defaultValues: {
      banner: "",
    },
  });

  const onSubmitHandler: SubmitHandler<
    z.infer<typeof UploadBannerFromSchema>
  > = async (values) => {
    const file = values?.banner?.[0];
    if (!file || !id) return;
    try {
      let filePath = null;
      const uploadBanner = async () => {
        // await supabase.storage.from('file-banners').remove(`${banner}`)
        const { data, error } = await supabase.storage
          .from("file-banners")
          .upload(`banner-${id}`, file, { cacheControl: "5", upsert: true });
        if (error) {
          toast({
            title: "Error",
            description: "Something went Wrong!",
            variant: "destructive",
          });
        }
        filePath = data?.path;
      };

      if (dirType === "workspace") {
        if (!workspaceId) return;
        await uploadBanner();
        const { error } = await updateWorkspace(
          { bannerUrl: filePath },
          workspaceId
        );
        if (error) {
          toast({
            title: "Error",
            description: "Something went Wrong!",
            variant: "destructive",
          });
          return;
        }
        dispatch({
          type: "UPDATE_WORKSPACE",
          payload: {
            workspace: { bannerUrl: filePath },
            workspaceId,
          },
        });
        toast({
          title: "Success",
          description: "Banner Uploaded.",
        });
      }
      if (dirType === "folder") {
        if (!workspaceId) return;
        await uploadBanner();
        const { error } = await updateFolder({ bannerUrl: filePath }, id);
        if (error) {
          toast({
            title: "Error",
            description: "Something went Wrong!",
            variant: "destructive",
          });
          return;
        }
        dispatch({
          type: "UPDATE_FOLDER",
          payload: {
            folder: { bannerUrl: filePath },
            workspaceId,
            folderId: id,
          },
        });
        toast({
          title: "Success",
          description: "Banner Uploaded.",
        });
      }
      if (dirType === "file") {
        if (!workspaceId || !folderId) return;
        await uploadBanner();
        const { error } = await updateFile({ bannerUrl: filePath }, id);
        if (error) {
          toast({
            title: "Error",
            description: "Something went Wrong!",
            variant: "destructive",
          });
          return;
        }
        dispatch({
          type: "UPDATE_FILE",
          payload: {
            file: { bannerUrl: filePath },
            workspaceId,
            folderId,
            fileId: id,
          },
        });
        toast({
          title: "Success",
          description: "Banner Uploaded.",
        });
      }
    } catch (error) {}
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitHandler)}
      className="flex flex-col gap-4"
    >
      <Label htmlFor="bannerImage" className="text-sm text-muted-foreground">
        Banner Image
      </Label>
      <Input
        id="bannerImage"
        type="file"
        accept="image/*"
        disabled={isUploading}
        {...register("banner", { required: "Banner Image is required." })}
      />
      <small className="text-red-600">
        {errors.banner?.message?.toString()}
      </small>
      <Button type="submit" disabled={isUploading}>
        {!isUploading ? "Upload Banner" : <Loader />}
      </Button>
    </form>
  );
};

export default BannerUploadForm;
