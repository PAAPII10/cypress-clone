"use client";

import { useEffect, useState } from "react";
import { workspace } from "@/lib/supabase/supabase.types";
import { useAppState } from "@/lib/providers/state-provider";
import SelectedWorkspace from "./SelectedWorkspace";
import CustomDialogTrigger from "../global/CustomDialogTrigger";
import WorkspaceCreator from "../global/WorkspaceCreator";

interface IWorkspaceDropdownProps {
  privateWorkspaces: workspace[];
  sharedWorkspaces: workspace[];
  collaboratingWorkspaces: workspace[];
  defaultValue?: workspace;
}

const WorkspaceDropdown = ({
  privateWorkspaces = [],
  sharedWorkspaces = [],
  collaboratingWorkspaces = [],
  defaultValue,
}: IWorkspaceDropdownProps) => {
  const { dispatch, state } = useAppState();
  const [selectedOption, setSelectedOption] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!state.workspaces.length) {
      dispatch({
        type: "SET_WORKSPACES",
        payload: {
          workspaces: [
            ...privateWorkspaces,
            ...collaboratingWorkspaces,
            ...sharedWorkspaces,
          ].map((workspace) => ({ ...workspace, folders: [] })),
        },
      });
    }
  }, [collaboratingWorkspaces, dispatch, privateWorkspaces, sharedWorkspaces]);

  const handleSelect = (option: workspace) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  useEffect(() => {
    if (defaultValue) {
      const findSelectedWorkspace = state.workspaces.find(
        (workspace) => workspace.id === defaultValue?.id
      );
      if (findSelectedWorkspace) setSelectedOption(findSelectedWorkspace);
    }
  }, [state, defaultValue]);

  return (
    <div className="relative inline-block text-left">
      <div>
        <span onClick={() => setIsOpen((prev) => !prev)}>
          {selectedOption ? (
            <SelectedWorkspace workspace={selectedOption} />
          ) : (
            "Select a workspace"
          )}
        </span>
      </div>
      {isOpen && (
        <div className="origin-top-right absolute w-full rounded-md z-50 shadow-md h-[190px] bg-black/10 backdrop-blur-lg group overflow-scroll border-[1px] border-muted no-scrollbar">
          <div className="rounded-md flex flex-col">
            <div className="!p-2">
              {!!privateWorkspaces.length && (
                <>
                  <p className="text-muted-foreground">Private</p>
                  <hr />
                  {privateWorkspaces.map((option) => (
                    <SelectedWorkspace
                      key={option.id}
                      workspace={option}
                      onClick={handleSelect}
                    />
                  ))}
                </>
              )}
              {!!sharedWorkspaces.length && (
                <>
                  <p className="text-muted-foreground">Shared</p>
                  <hr />
                  {sharedWorkspaces.map((option) => (
                    <SelectedWorkspace
                      key={option.id}
                      workspace={option}
                      onClick={handleSelect}
                    />
                  ))}
                </>
              )}
              {!!collaboratingWorkspaces.length && (
                <>
                  <p className="text-muted-foreground">Collaborating</p>
                  <hr />
                  {collaboratingWorkspaces.map((option) => (
                    <SelectedWorkspace
                      key={option.id}
                      workspace={option}
                      onClick={handleSelect}
                    />
                  ))}
                </>
              )}
            </div>
            <CustomDialogTrigger
              header="Create a workspace"
              content={<WorkspaceCreator />}
              description="Workspaces give you the power to collaborate with others. You can change your workspace privacy settings after creating the workspace too."
            >
              <div
                className="flex 
              transition-all 
              hover:bg-muted 
              justify-center 
              items-center 
              gap-2 
              p-2 
              w-full"
              >
                <article
                  className="text-slate-500 
                rounded-full
                 bg-slate-800 
                 w-4 
                 h-4 
                 flex 
                 items-center 
                 justify-center"
                >
                  +
                </article>
                Create workspace
              </div>
            </CustomDialogTrigger>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDropdown;
