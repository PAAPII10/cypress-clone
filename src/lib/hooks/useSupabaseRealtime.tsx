import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAppState } from "../providers/state-provider";
import { File, Folder, workspace } from "../supabase/supabase.types";

const useSupabaseRealtime = () => {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const {
    dispatch,
    state,
    workspaceId: selectedWorkspace,
    folderId: selectedFolder,
  } = useAppState();

  useEffect(() => {
    // File
    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "files" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            console.log("🟢 RECEIVED FILE REAL TIME EVENT");
            const {
              folder_id: folderId,
              workspace_id: workspaceId,
              id: fileId,
            } = payload.new;

            if (
              !state.workspaces
                .find((workspace) => workspace.id === workspaceId)
                ?.folders.find((folder) => folder.id === folderId)
                ?.files.find((file) => file.id === fileId)
            ) {
              const newFile: File = {
                id: payload.new.id,
                workspaceId: payload.new.workspace_id,
                folderId: payload.new.folder_id,
                createdAt: payload.new.created_at,
                title: payload.new.title,
                iconId: payload.new.icon_id,
                data: payload.new.data,
                inTrash: payload.new.in_trash,
                bannerUrl: payload.new.banner_url,
              };
              dispatch({
                type: "ADD_FILE",
                payload: {
                  file: newFile,
                  folderId,
                  workspaceId,
                },
              });
            }
          }

          if (payload.eventType === "DELETE") {
            console.log("🟢 DELETED FILE IN REAL TIME");
            let workspaceId = "";
            let folderId = "";
            const fileExist = state.workspaces.some((workspace) => {
              workspace.folders.some((folder) =>
                folder.files.some((file) => {
                  if (file.id === payload.old.id) {
                    workspaceId = workspace.id;
                    folderId = folder.id;
                    return true;
                  }
                })
              );
            });
            if (fileExist && workspaceId && folderId) {
              dispatch({
                type: "DELETE_FILE",
                payload: { fileId: payload.old.id, folderId, workspaceId },
              });
              router.replace(`/dashboard/${workspaceId}`);
            }
          }

          if (payload.eventType === "UPDATE") {
            console.log("🟢 UPDATED FILE REAL TIME EVENT");
            const { folder_id: folderId, workspace_id: workspaceId } =
              payload.new;
            state.workspaces.some((workspace) => {
              workspace.folders.some((folder) =>
                folder.files.some((file) => {
                  if (file.id === payload.new.id) {
                    dispatch({
                      type: "UPDATE_FILE",
                      payload: {
                        fileId: payload.new.id,
                        folderId,
                        workspaceId,
                        file: {
                          title: payload.new.title,
                          iconId: payload.new.icon_id,
                          inTrash: payload.new.in_trash,
                          bannerUrl: payload.new.banner_url,
                        },
                      },
                    });
                    return true;
                  }
                })
              );
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "folders" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            console.log("🟢 RECEIVED FOLDER REAL TIME EVENT");
            const { id: folderId, workspace_id: workspaceId } = payload.new;

            if (
              !state.workspaces
                .find((workspace) => workspace.id === workspaceId)
                ?.folders.find((folder) => folder.id === folderId)
            ) {
              const newFolder: Folder = {
                id: payload.new.id,
                workspaceId: payload.new.workspace_id,
                createdAt: payload.new.created_at,
                title: payload.new.title,
                iconId: payload.new.icon_id,
                data: payload.new.data,
                inTrash: payload.new.in_trash,
                bannerUrl: payload.new.banner_url,
              };
              dispatch({
                type: "ADD_FOLDER",
                payload: {
                  folder: { ...newFolder, files: [] },
                  workspaceId,
                },
              });
            }
          }

          if (payload.eventType === "DELETE") {
            console.log("🟢 DELETED FOLDER IN REAL TIME");
            let workspaceId = "";
            const folderExist = state.workspaces.some((workspace) => {
              workspace.folders.some((folder) => {
                if (folder.id === payload.old.id) {
                  workspaceId = workspace.id;
                  return true;
                }
              });
            });
            if (folderExist && workspaceId) {
              dispatch({
                type: "DELETE_FOLDER",
                payload: { folderId: payload.old.id, workspaceId },
              });
              router.replace(`/dashboard/${workspaceId}`);
            }
          }

          if (payload.eventType === "UPDATE") {
            console.log("🟢 UPDATED FOLDER REAL TIME EVENT");
            const { workspace_id: workspaceId } = payload.new;
            state.workspaces.some((workspace) => {
              workspace.folders.some((folder) => {
                if (folder.id === payload.new.id) {
                  dispatch({
                    type: "UPDATE_FOLDER",
                    payload: {
                      folderId: payload.new.id,
                      workspaceId,
                      folder: {
                        title: payload.new.title,
                        iconId: payload.new.icon_id,
                        inTrash: payload.new.in_trash,
                        bannerUrl: payload.new.banner_url,
                      },
                    },
                  });
                  return true;
                }
              });
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspaces" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            console.log("🟢 RECEIVED WORKSPACE REAL TIME EVENT");
            const { id: workspaceId } = payload.new;

            if (
              !state.workspaces.find(
                (workspace) => workspace.id === workspaceId
              )
            ) {
              console.log(payload.new);
              const newWorkspace: workspace = {
                id: payload.new.id,
                createdAt: payload.new.created_at,
                title: payload.new.title,
                iconId: payload.new.icon_id,
                data: payload.new.data,
                inTrash: payload.new.in_trash,
                bannerUrl: payload.new.banner_url,
                workspaceOwner: payload.new.workspace_owner,
                logo: payload.new.logo,
              };

              dispatch({
                type: "ADD_WORKSPACE",
                payload: { ...newWorkspace, folders: [] },
              });
            }
          }

          if (payload.eventType === "DELETE") {
            console.log("🟢 DELETED WORKSPACE IN REAL TIME");
            const workspaceExist = state.workspaces.some((workspace) => {
              if (workspace.id === payload.old.id) {
                return true;
              }
            });
            if (workspaceExist) {
              dispatch({
                type: "DELETE_WORKSPACE",
                payload: payload.old.id,
              });
              router.replace("/dashboard");
            }
          }

          if (payload.eventType === "UPDATE") {
            console.log("🟢 UPDATED WORKSPACE REAL TIME EVENT");
            state.workspaces.some((workspace) => {
              if (workspace.id === payload.new.id) {
                dispatch({
                  type: "UPDATE_WORKSPACE",
                  payload: {
                    workspaceId: payload.new.id,
                    workspace: {
                      title: payload.new.title,
                      iconId: payload.new.icon_id,
                      inTrash: payload.new.in_trash,
                      bannerUrl: payload.new.banner_url,
                      logo: payload.new.logo,
                    },
                  },
                });
                return true;
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, state, selectedWorkspace]);

  return null;
};

export default useSupabaseRealtime;
