import { ReactNode } from "react";
import {
  appFoldersType,
  appWorkspacesType,
} from "@/lib/providers/state-provider";
import { File, Folder, workspace } from "@/lib/supabase/supabase.types";
import CustomDialogTrigger from "../global/CustomDialogTrigger";
import BannerUploadForm from "./BannerUploadForm";

interface IBannerUploadProps {
  children: ReactNode;
  className?: string;
  dirType: "workspace" | "file" | "folder";
  id: string;
}
const BannerUpload = ({
  children,
  className,
  dirType,
  id,
}: IBannerUploadProps) => {
  return (
    <CustomDialogTrigger
      header="Upload Banner"
      content={<BannerUploadForm dirType={dirType} id={id}></BannerUploadForm>}
    >
      {children}
    </CustomDialogTrigger>
  );
};

export default BannerUpload;
