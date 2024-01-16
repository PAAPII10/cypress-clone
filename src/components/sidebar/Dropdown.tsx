"use client";

import { ChangeEvent, ReactNode, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAppState } from "@/lib/providers/state-provider";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import EmojiPicker from "../global/emoji-picker";
import {
  createFile,
  moveFileToTrash,
  moveFolderToTrash,
  updateFile,
  updateFolder,
} from "@/lib/supabase/queries";
import { useToast } from "@/components/ui/use-toast";
import TooltipComponent from "../global/TooltipComponent";
import { PlusIcon, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { File } from "@/lib/supabase/supabase.types";
import { v4 } from "uuid";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";

interface IDropdownProps {
  title: string;
  id: string;
  listType: "folder" | "file";
  iconId: string;
  children?: ReactNode;
  disabled?: boolean;
}

const Dropdown = ({
  title,
  id,
  listType,
  iconId,
  children,
  disabled,
}: IDropdownProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const { user } = useSupabaseUser();
  const { state, dispatch, workspaceId, folderId, onNavNarChangeForMob } =
    useAppState();
  const [isEditing, setIsEditing] = useState(false);

  // folder title synced with server data and local data
  const folderTitle: string | undefined = useMemo(() => {
    if (listType === "folder") {
      const stateTitle = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders?.find((folder) => folder.id === id)?.title;

      if (title === stateTitle || !stateTitle) return title;

      return stateTitle;
    }
  }, [state, listType, workspaceId, id, title]);

  // file title synced with server data and local data
  const fileTitle: string | undefined = useMemo(() => {
    if (listType === "file") {
      const fileAndFolderId = id.split("folder");
      const stateTitle = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders?.find((folder) => folder.id === fileAndFolderId[0])
        ?.files.find((file) => file.id === fileAndFolderId[1])?.title;

      if (title === stateTitle || !stateTitle) return title;

      return stateTitle;
    }
  }, [id, listType, state, title, workspaceId]);

  // Navigate the user to a different page
  const navigatePage = (accordionId: string, type: string) => {
    onNavNarChangeForMob("pages");
    if (type === "folder") {
      router.push(`/dashboard/${workspaceId}/${accordionId}`);
    }
    if (type === "file") {
      router.push(
        `/dashboard/${workspaceId}/${folderId}/${
          accordionId.split("folder")[1]
        }`
      );
    }
  };
  // add a file

  // double click handler
  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  // blur
  const handleBlur = async () => {
    if (!isEditing) return;
    setIsEditing(false);
    const fId = id.split("folder");
    if (fId?.length === 1) {
      if (!folderTitle) return;
      const { error } = await updateFolder({ title }, fId[0]);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not update the title for this folder.",
        });
      }

      toast({
        title: "Success",
        description: "Folder title changed",
      });
    }

    if (fId.length === 2) {
      if (!fileTitle) return;
      const { error } = await updateFile({ title: fileTitle }, fId[1]);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not update the title for this file.",
        });
      }

      toast({
        title: "Success",
        description: "File title changed",
      });
    }
  };

  // on changes
  const onChangeEmoji = async (selectedEmoji: string) => {
    if (!workspaceId || !folderId) return;
    if (listType === "folder") {
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          workspaceId,
          folderId: id,
          folder: { iconId: selectedEmoji },
        },
      });
      const { error } = await updateFolder({ iconId: selectedEmoji }, id);

      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not update the emoji for this folder.",
        });
      }

      toast({
        title: "Success",
        description: "Updated emoji for the folder",
      });
    }

    if (listType === "file") {
      const fId = id.split("folder");

      if (fId.length === 2) {
        dispatch({
          type: "UPDATE_FILE",
          payload: {
            file: { iconId: selectedEmoji },
            folderId: fId[0],
            workspaceId,
            fileId: fId[1],
          },
        });
        const { error } = await updateFile({ iconId: selectedEmoji }, fId[1]);

        if (error) {
          toast({
            title: "Error",
            variant: "destructive",
            description: "Could not update the emoji for this file.",
          });
        }

        toast({
          title: "Success",
          description: "Updated emoji for the file",
        });
      }
    }
  };

  const folderTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId) return;
    const fId = id.split("folder");
    if (fId.length === 1) {
      const { value } = e.target;

      dispatch({
        type: "UPDATE_FOLDER",
        payload: { workspaceId, folderId: fId[0], folder: { title: value } },
      });
    }
  };
  const fileTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId || !folderId) return;
    const fId = id.split("folder");
    if (fId.length === 2) {
      const { value } = e.target;
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          file: { title: value },
          folderId,
          workspaceId,
          fileId: fId[1],
        },
      });
    }
  };

  // move to trash
  const moveToTrash = async () => {
    if (!user || !workspaceId) return;
    const pathId = id.split("folder");
    if (listType === "folder") {
      const { error } = await moveFolderToTrash(
        pathId[0],
        user?.email || "Random"
      );
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not move the folder to trash.",
        });
        return;
      }
      dispatch({
        type: "MOVE_FOLDER_TO_TRASH",
        payload: {
          workspaceId,
          folderId: pathId[0],
          user: user.email || "Random",
        },
      });
      toast({
        title: "Success",
        description: "Moved folder to trash",
      });
    }
    if (listType === "file") {
      const { error } = await moveFileToTrash(
        pathId[1],
        user?.email || "Random"
      );
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not move the file to trash.",
        });
        return;
      }
      dispatch({
        type: "MOVE_FILE_TO_TRASH",
        payload: {
          workspaceId,
          folderId: pathId[0],
          fileId: pathId[1],
          user: user.email || "Random",
        },
      });
      toast({
        title: "Success",
        description: "Moved file to trash",
      });
    }
  };

  const isFolder = listType === "folder";

  const groupIdentifies = useMemo(
    () =>
      cn(
        "dark:text-white whitespace-nowrap flex justify-between items-center w-full relative",
        {
          "group/folder": isFolder,
          "group/file": !isFolder,
        }
      ),
    [isFolder]
  );

  const listStyles = useMemo(
    () =>
      cn("relative", {
        "border-none text-md": isFolder,
        "border-none ml-6 text-[16px] py-1": !isFolder,
      }),
    [isFolder]
  );

  const hoverStyles = useMemo(
    () =>
      cn(
        "h-full hidden rounded-sm absolute right-0 items-center justify-center",
        {
          "group-hover/file:block": listType === "file",
          "group-hover/folder:block": listType === "folder",
        }
      ),
    [listType]
  );

  const addNewFile = async () => {
    if (!workspaceId) return;
    const newFile: File = {
      folderId: id,
      data: null,
      createdAt: new Date().toISOString(),
      inTrash: null,
      title: "Untitled",
      iconId: "📄",
      id: v4(),
      workspaceId,
      bannerUrl: "",
    };
    dispatch({
      type: "ADD_FILE",
      payload: { file: newFile, folderId: id, workspaceId },
    });
    const { error } = await createFile(newFile);
    if (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: "Could not create a file",
      });
    } else {
      toast({
        title: "Success",
        description: "File created.",
      });
    }
  };

  return (
    <AccordionItem
      value={id}
      className={listStyles}
      onClick={(e) => {
        e.stopPropagation();
        navigatePage(id, listType);
      }}
    >
      <AccordionTrigger
        id={listType}
        className="hover:no-underline p-2 dark:text-primary-foreground text-sm"
        disabled={listType === "file"}
      >
        <div className={groupIdentifies}>
          <div className="flex gap-2 items-center justify-center overflow-hidden">
            <div className="relative">
              <EmojiPicker getValue={onChangeEmoji}>{iconId} </EmojiPicker>
            </div>
            <input
              type="text"
              value={listType === "folder" ? folderTitle : fileTitle}
              className={cn(
                "outline-none overflow-hidden w-[140px] text-Neutrals/neutrals-7",
                {
                  "bg-muted cursor-text": isEditing,
                  "bg-transparent cursor-pointer": !isEditing,
                }
              )}
              readOnly={!isEditing}
              onDoubleClick={handleDoubleClick}
              onBlur={handleBlur}
              onChange={
                listType === "folder" ? folderTitleChange : fileTitleChange
              }
            />
          </div>
          <div className={hoverStyles}>
            <TooltipComponent message="Delete Folder">
              <Trash
                onClick={moveToTrash}
                size={15}
                className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
              />
            </TooltipComponent>
            {listType === "folder" && !isEditing && (
              <TooltipComponent message="Add File">
                <PlusIcon
                  onClick={addNewFile}
                  size={15}
                  className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
                />
              </TooltipComponent>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {state.workspaces
          .find((workspace) => workspace.id === workspaceId)
          ?.folders.find((folder) => folder.id === id)
          ?.files.filter((file) => !file.inTrash)
          .map((file) => {
            const customFileId = `${id}folder${file.id}`;
            return (
              <Dropdown
                key={file.id}
                title={file.title}
                listType="file"
                id={customFileId}
                iconId={file.iconId}
              />
            );
          })}
      </AccordionContent>
    </AccordionItem>
  );
};

export default Dropdown;
