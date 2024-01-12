"use client";

import "quill/dist/quill.snow.css";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { File, Folder, workspace } from "@/lib/supabase/supabase.types";
import { useAppState } from "@/lib/providers/state-provider";
import Quill from "quill";
import { Button } from "../ui/button";
import {
  deleteFile,
  deleteFolder,
  removeFileFromTrash,
  removeFolderFromTrash,
  updateFile,
  updateFolder,
  updateWorkspace,
} from "@/lib/supabase/queries";
import { useToast } from "../ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import EmojiPicker from "../global/emoji-picker";

interface IQuillEditorProps {
  dirDetails: File | Folder | workspace;
  fileId: string;
  dirType: "workspace" | "folder" | "file";
}

const TOOLBAR_OPTIONS = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block"],

  [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }], // superscript/subscript
  [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
  [{ direction: "rtl" }], // text direction

  [{ size: ["small", false, "large", "huge"] }], // custom dropdown
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ font: [] }],
  [{ align: [] }],

  ["clean"], // remove formatting button
];

interface ICollaborators {
  id: string;
  email: string;
  avatar: string;
}

const QuillEditor = ({ dirDetails, fileId, dirType }: IQuillEditorProps) => {
  const router = useRouter();
  const pathName = usePathname();
  const supabase = createClientComponentClient();
  const { state, workspaceId, folderId, dispatch } = useAppState();
  const { toast } = useToast();
  const [quill, setQuill] = useState<Quill | null>(null);
  const [collaborators, setCollaborators] = useState<ICollaborators[]>([]);
  const [saving, setSaving] = useState(false);

  const details = useMemo(() => {
    let selectedDir;
    if (dirType === "file") {
      selectedDir = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === folderId)
        ?.files.find((file) => file.id === fileId);
    }
    if (dirType === "folder") {
      selectedDir = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === fileId);
    }
    if (dirType === "workspace") {
      selectedDir = state.workspaces.find(
        (workspace) => workspace.id === fileId
      );
    }
    if (selectedDir) return selectedDir;

    return {
      title: dirDetails.title,
      iconId: dirDetails.iconId,
      createdAt: dirDetails.createdAt,
      data: dirDetails.data,
      inTrash: dirDetails.inTrash,
      bannerUrl: dirDetails.bannerUrl,
    } as workspace | Folder | File;
  }, [folderId, state, workspaceId]);

  const wrapperRef = useCallback(async (wrapper: HTMLDivElement) => {
    if (typeof window !== "undefined") {
      if (wrapper === null) return;
      wrapper.innerHTML = "";
      const editor = document.createElement("div");
      wrapper.append(editor);
      const ImportedQuill = (await import("quill")).default;
      // WIP cursors
      const q = new ImportedQuill(editor, {
        theme: "snow",
        modules: {
          toolbar: TOOLBAR_OPTIONS,
          // WIP cursors
        },
      });

      setQuill(q);
    }
  }, []);

  const breadCrumbs = useMemo(() => {
    if (!pathName || !state.workspaces || !workspaceId) return;
    const segments = pathName
      .split("/")
      .filter((val) => val !== "dashboard" && val);
    const workspaceDetails = state.workspaces.find(
      (workspace) => workspace.id === workspaceId
    );
    const workspaceBreadCrumb = workspaceDetails
      ? `${workspaceDetails.iconId} ${workspaceDetails.title}`
      : "";

    if (segments.length === 1) {
      return workspaceBreadCrumb;
    }
    const folderSegment = segments[1];
    const folderDetails = workspaceDetails?.folders.find(
      (folder) => folder.id === folderSegment
    );

    const folderBreadCrumb = folderDetails
      ? `/ ${folderDetails.iconId} ${folderDetails.title}`
      : "";
    if (segments.length === 2) {
      return `${workspaceBreadCrumb} ${folderBreadCrumb}`;
    }

    const fileSegments = segments[2];
    const fileDetails = folderDetails?.files.find(
      (file) => file.id === fileSegments
    );

    const fileBreadCrumb = fileDetails
      ? `/ ${fileDetails.iconId} ${fileDetails.title}`
      : "";

    return `${workspaceBreadCrumb} ${folderBreadCrumb} ${fileBreadCrumb}`;
  }, [state, pathName, workspaceId]);

  const restoreFileHandler = async () => {
    if (!workspaceId) return;
    if (dirType === "file") {
      if (!folderId) return;
      const { error } = await removeFileFromTrash(fileId);
      if (!error) {
        dispatch({
          type: "REMOVE_FILE_TO_TRASH",
          payload: { fileId, folderId, workspaceId },
        });
      }
    }

    if (dirType === "folder") {
      const { error } = await removeFolderFromTrash(fileId);
      if (!error) {
        dispatch({
          type: "REMOVE_FOLDER_FROM_TRASH",
          payload: { folderId: fileId, workspaceId },
        });
      }
    }
  };

  const deleteFileHandler = async () => {
    if (!workspaceId) return;
    if (dirType === "file") {
      if (!folderId) return;

      const { error } = await deleteFile(fileId);
      if (!error) {
        dispatch({
          type: "DELETE_FILE",
          payload: { fileId, folderId, workspaceId },
        });
        toast({ title: "Success", description: "Deleted file" });
        router.push(`/dashboard/${workspaceId}/${folderId}`);
      } else {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not delete the file.",
        });
      }
    }

    if (dirType === "folder") {
      const { error } = await deleteFolder(fileId);
      if (!error) {
        dispatch({
          type: "DELETE_FOLDER",
          payload: { folderId: fileId, workspaceId },
        });
        toast({ title: "Success", description: "Deleted folder" });
        router.push(`/dashboard/${workspaceId}`);
      } else {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not delete the folder.",
        });
      }
    }
  };

  const iconOnChange = async (icon: string) => {
    if (!fileId) return;
    if (dirType === "workspace") {
      const { error } = await updateWorkspace({ iconId: icon }, fileId);
      if (!error) {
        dispatch({
          type: "UPDATE_WORKSPACE",
          payload: { workspace: { iconId: icon }, workspaceId: fileId },
        });
        toast({ title: "Success", description: "Icon changed for workspace." });
      }
    }
    if (dirType === "folder" && workspaceId) {
      const { error } = await updateFolder({ iconId: icon }, fileId);
      if (!error) {
        dispatch({
          type: "UPDATE_FOLDER",
          payload: { folder: { iconId: icon }, folderId: fileId, workspaceId },
        });
        toast({ title: "Success", description: "Icon changed for folder." });
      }
    }
    if (dirType === "file" && folderId && workspaceId) {
      const { error } = await updateFile({ iconId: icon }, fileId);
      if (!error) {
        dispatch({
          type: "UPDATE_FILE",
          payload: {
            file: { iconId: icon },
            fileId: fileId,
            folderId,
            workspaceId,
          },
        });
        toast({ title: "Success", description: "Icon changed for workspace." });
      }
    }
  };

  return (
    <>
      <div className="relative">
        {details.inTrash && (
          <article className="py-2 z-40 bg-[#EB5757] flex md:flex-row flex-col justify-center items-center gap-4 flex-wrap">
            <div className="flex flex-col md:flex-row gap-2 justify-center items-center">
              <span className="text-white">
                This {dirType} is in the trash.
              </span>
              <Button
                size="sm"
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-[#EB5757]"
                onClick={restoreFileHandler}
              >
                Restore
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-[#EB5757]"
                onClick={deleteFileHandler}
              >
                Delete
              </Button>
            </div>
            <span className="text-sm text-white">{details.inTrash}</span>
          </article>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between justify-center sm:items-center sm:p-2 p-8">
          <div>{breadCrumbs}</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-10">
              {collaborators.map((collaborator) => (
                <TooltipProvider key={collaborator.id}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="-ml-3 bg-background border-2 flex items-center justify-center border-white h-8 w-8 rounded-full">
                        <AvatarImage
                          className="rounded-full"
                          src={collaborator.avatar}
                        />
                        <AvatarFallback>CY</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      {collaborator.email.substring(0, 2).toUpperCase()}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            {saving ? (
              <Badge
                variant="secondary"
                className="bg-orange-600 top-4 text-white right-4 z-50"
              >
                Saving...
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-emerald-600 top-4 text-white right-4 z-50"
              >
                Saved
              </Badge>
            )}
          </div>
        </div>
      </div>
      {details?.bannerUrl && (
        <div className="relative w-full h-[200px]">
          <Image
            src={
              supabase.storage
                .from("file-banners")
                .getPublicUrl(details?.bannerUrl).data.publicUrl
            }
            fill
            className="w-full md:h-8 h-20 object-cover"
            alt="Banner Image"
          />
        </div>
      )}
      <div className="flex justify-center items-center flex-col mt-2 relative">
        <div className="w-full self-center max-w-[800px] flex flex-col px-7 lg:my-8">
          <div className="text-[80px]">
            <EmojiPicker getValue={iconOnChange}>
              <div className="w-[100px] cursor-pointer transition-colors h-[100px] flex items-center justify-center hover:bg-muted rounded-xl">
                {details.iconId}
              </div>
            </EmojiPicker>
          </div>
        </div>
        <div id="container" ref={wrapperRef} className="max-w-[800px]"></div>
      </div>
    </>
  );
};

export default QuillEditor;
