"use client";

import "quill/dist/quill.snow.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { File, Folder, workspace } from "@/lib/supabase/supabase.types";
import { useAppState } from "@/lib/providers/state-provider";
import Quill from "quill";
import { Button } from "../ui/button";
import {
  deleteFile,
  deleteFolder,
  getFileDetails,
  getFolderDetails,
  getUserById,
  getWorkspaceDetails,
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
import BannerUpload from "../banner-upload/BannerUpload";
import { XCircleIcon } from "lucide-react";
import { useSocket } from "@/lib/providers/socket-provider";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";

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
  const { socket, isConnected } = useSocket();
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const [quill, setQuill] = useState<Quill | null>(null);
  const [collaborators, setCollaborators] = useState<ICollaborators[]>([]);
  const [deletingBanner, setDeletingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localCursors, setLocalCursors] = useState<any>([]);
  const saveTimeRef = useRef<ReturnType<typeof setTimeout>>();

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
  }, [folderId, state, workspaceId, dirDetails, dirType, fileId]);

  const wrapperRef = useCallback(async (wrapper: HTMLDivElement) => {
    if (typeof window !== "undefined") {
      if (wrapper === null) return;
      wrapper.innerHTML = "";
      const editor = document.createElement("div");
      wrapper.append(editor);
      const ImportedQuill = (await import("quill")).default;
      const QuillCursors = (await import("quill-cursors")).default;
      ImportedQuill.register("modules/cursors", QuillCursors);
      const q = new ImportedQuill(editor, {
        theme: "snow",
        modules: {
          toolbar: TOOLBAR_OPTIONS,
          cursors: {
            transformOnTextChange: true,
          },
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

  // Deleting banner
  const handleDeleteBanner = async () => {
    if (!fileId) return;
    setDeletingBanner(true);
    if (dirType === "workspace") {
      const { error: deletingError } = await supabase.storage
        .from("file-banners")
        .remove([`banner-${fileId}`]);

      const { error } = await updateWorkspace({ bannerUrl: "" }, fileId);
      if (error || deletingError) {
        toast({
          title: "Error",
          description: "Something went Wrong!",
          variant: "destructive",
        });
        setDeletingBanner(false);
        return;
      }
      dispatch({
        type: "UPDATE_WORKSPACE",
        payload: {
          workspace: { bannerUrl: "" },
          workspaceId: fileId,
        },
      });
      toast({
        title: "Success",
        description: "Banner Deleted.",
      });
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      const { error: deletingError } = await supabase.storage
        .from("file-banners")
        .remove([`banner-${fileId}`]);

      const { error } = await updateFolder({ bannerUrl: "" }, fileId);
      if (error || deletingError) {
        toast({
          title: "Error",
          description: "Something went Wrong!",
          variant: "destructive",
        });
        setDeletingBanner(false);
        return;
      }
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          folder: { bannerUrl: "" },
          folderId: fileId,
          workspaceId,
        },
      });
      toast({
        title: "Success",
        description: "Banner Deleted.",
      });
    }
    if (dirType === "file") {
      if (!workspaceId || !folderId) return;
      const { error: deletingError } = await supabase.storage
        .from("file-banners")
        .remove([`banner-${fileId}`]);

      const { error } = await updateFile({ bannerUrl: "" }, fileId);
      if (error || deletingError) {
        toast({
          title: "Error",
          description: "Something went Wrong!",
          variant: "destructive",
        });
        setDeletingBanner(false);
        return;
      }
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          file: { bannerUrl: "" },
          fileId,
          folderId,
          workspaceId,
        },
      });
      toast({
        title: "Success",
        description: "Banner Deleted.",
      });
    }
    setDeletingBanner(false);
  };

  useEffect(() => {
    if (!fileId) return;
    let selectedDir;
    const fetchInformation = async () => {
      if (dirType === "file") {
        const { data: selectedDir, error } = await getFileDetails(fileId);
        if (error || !selectedDir) {
          router.replace("/dashboard");
          return;
        }
        if (!selectedDir[0]) {
          if (!workspaceId) return;
          router.replace(`/dashboard/${workspaceId}`);
          return;
        }
        if (!workspaceId || quill === null) return;

        if (!selectedDir[0]?.data) return;

        quill.setContents(JSON.parse(selectedDir[0].data || ""));
        dispatch({
          type: "UPDATE_FILE",
          payload: {
            file: { data: selectedDir[0].data },
            fileId,
            folderId: selectedDir[0].folderId,
            workspaceId,
          },
        });
      }
      if (dirType === "folder") {
        const { data: selectedDir, error } = await getFolderDetails(fileId);
        if (error || !selectedDir) {
          router.replace("/dashboard");
          return;
        }
        if (!selectedDir[0]) {
          if (!workspaceId) return;
          router.replace(`/dashboard/${workspaceId}`);
          return;
        }
        if (!workspaceId || quill === null) return;

        if (!selectedDir[0]?.data) return;

        quill.setContents(JSON.parse(selectedDir[0].data || ""));
        dispatch({
          type: "UPDATE_FOLDER",
          payload: {
            folder: { data: selectedDir[0].data },
            folderId: fileId,
            workspaceId,
          },
        });
      }

      if (dirType === "workspace") {
        const { data: selectedDir, error } = await getWorkspaceDetails(fileId);
        if (error || !selectedDir) {
          router.replace("/dashboard");
          return;
        }
        if (!selectedDir[0]) {
          router.replace(`/dashboard`);
          return;
        }
        if (!workspaceId || quill === null) return;

        if (!selectedDir[0]?.data) return;

        quill.setContents(JSON.parse(selectedDir[0].data || ""));
        dispatch({
          type: "UPDATE_WORKSPACE",
          payload: {
            workspace: { data: selectedDir[0].data },
            workspaceId: fileId,
          },
        });
      }
    };
    fetchInformation();
  }, [fileId, workspaceId, quill, dirType]);

  // listen cursor change
  useEffect(() => {
    if (quill === null || socket === null || !fileId || !localCursors.length)
      return;
    const socketHandler = (range: any, roomId: string, cursorId: string) => {
      if (roomId === fileId) {
        const cursorToMove = localCursors.find(
          (c: any) => c.cursors()?.[0].id === cursorId
        );
        if (cursorToMove) {
          cursorToMove.moveCursor(cursorId, range);
        }
      }
    };
    socket.on("receive-cursor-move", socketHandler);
    return () => {
      socket.off("receive-cursor-move", socketHandler);
    };
  }, [quill, socket, fileId, localCursors]);

  // rooms
  useEffect(() => {
    if (socket === null || quill === null || !fileId) return;
    socket.emit("create-room", fileId);
  }, [socket, quill, fileId]);

  // send quill changes to all clients
  useEffect(() => {
    if (quill === null || socket === null || !fileId || !user) {
      return;
    }
    //WIP cursor update
    const selectionChangeHandler = (cursorId: any) => {
      return (range: any, oldRange: any, source: any) => {
        if (source === "user" && cursorId) {
          socket.emit("send-cursor-move", range, fileId, cursorId);
        }
      };
    };
    const quillHandler = (delta: any, oldData: any, source: any) => {
      if (source !== "user") return;
      if (saveTimeRef.current) clearTimeout(saveTimeRef.current);
      setSaving(true);
      const contents = quill.getContents();
      const quillLength = quill.getLength();
      saveTimeRef.current = setTimeout(async () => {
        if (contents && quillLength !== 1 && fileId) {
          if (dirType === "workspace") {
            dispatch({
              type: "UPDATE_WORKSPACE",
              payload: {
                workspace: { data: JSON.stringify(contents) },
                workspaceId: fileId,
              },
            });
            await updateWorkspace({ data: JSON.stringify(contents) }, fileId);
          }
          if (dirType === "folder") {
            if (!workspaceId) return;
            dispatch({
              type: "UPDATE_FOLDER",
              payload: {
                folder: { data: JSON.stringify(contents) },
                folderId: fileId,
                workspaceId,
              },
            });
            await updateFolder({ data: JSON.stringify(contents) }, fileId);
          }
          if (dirType === "file") {
            if (!workspaceId || !folderId) return;
            dispatch({
              type: "UPDATE_FILE",
              payload: {
                file: { data: JSON.stringify(contents) },
                workspaceId,
                folderId,
                fileId,
              },
            });
            await updateFile({ data: JSON.stringify(contents) }, fileId);
          }
        }
        setSaving(false);
      }, 850);
      socket.emit("send-changes", delta, fileId);
    };
    quill.on("text-change", quillHandler);
    quill.on("selection-change", selectionChangeHandler(user.id));

    return () => {
      quill.off("text-change", quillHandler);
      quill.off("selection-change", selectionChangeHandler);
      if (saveTimeRef.current) clearTimeout(saveTimeRef.current);
    };
  }, [quill, socket, fileId, user, details, workspaceId, folderId, dispatch]);

  useEffect(() => {
    if (quill === null || socket === null) return;
    const socketHandler = (deltas: any, id: string) => {
      if (id === fileId) {
        quill.updateContents(deltas);
      }
    };
    socket.on("receive-changes", socketHandler);
    return () => {
      socket.off("receive-changes", socketHandler);
    };
  }, [quill, socket, fileId]);

  useEffect(() => {
    if (!fileId || quill === null) return;
    const room = supabase.channel(fileId);
    const subscription = room
      .on("presence", { event: "sync" }, () => {
        const newState = room.presenceState();
        const newCollaborators = Object.values(newState).flat() as any;
        setCollaborators(newCollaborators);
        if (user) {
          const allCursors: any = [];
          newCollaborators.forEach((collaborator: ICollaborators) => {
            if (collaborator.id !== user.id) {
              const userCursor = quill.getModule("cursors");
              userCursor.createCursor(
                collaborator.id,
                collaborator.email.split("@")[0],
                `#${Math.random().toString(16).slice(2, 8)}`
              );
              allCursors.push(userCursor);
            }
          });
          setLocalCursors(allCursors);
        }
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED" || !user) return;
        const response = await getUserById(user.id);
        if (!response) return;
        room.track({
          id: user.id,
          email: user.email?.split("@")[0],
          avatarUrl: response?.avatarUrl
            ? supabase.storage.from("avatars").getPublicUrl(response.avatarUrl)
                .data.publicUrl
            : "",
        });
      });

    return () => {
      supabase.removeChannel(room);
    };
  }, [fileId, quill, supabase, user]);

  return (
    <>
      {isConnected ? "Connected" : "Not connected"}
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
                        <AvatarFallback>
                          {collaborator.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{collaborator.email}</TooltipContent>
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
          <div className="flex gap-2 items-center">
            <BannerUpload
              id={fileId}
              dirType={dirType}
              className="text-sm text-muted-foreground p-2 hover:text-card-foreground transition-all rounded-md"
            >
              {details.bannerUrl ? "Update Banner" : "Add Banner"}
            </BannerUpload>
            {details.bannerUrl && (
              <Button
                onClick={handleDeleteBanner}
                variant="ghost"
                className="gap-2 hover:bg-background flex items-center justify-center mt-2 text-sm text-muted-foreground w-36 p-2 rounded-md"
              >
                <XCircleIcon size={16} />
                <span className="whitespace-nowrap font-normal">
                  Remove Banner
                </span>
              </Button>
            )}
          </div>
          <span className="text-muted-foreground text-3xl font-bold">
            {details.title}
          </span>
          <span className="text-muted-foreground text-sm">
            {dirType.toUpperCase()}
          </span>
        </div>
        <div id="container" ref={wrapperRef} className="max-w-[800px]"></div>
      </div>
    </>
  );
};

export default QuillEditor;
