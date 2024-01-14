"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAppState } from "@/lib/providers/state-provider";
import { useToast } from "@/components/ui/use-toast";
import { User, workspace } from "@/lib/supabase/supabase.types";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import {
  Briefcase,
  CreditCard,
  ExternalLink,
  Lock,
  LogOut,
  Plus,
  Share,
  User as UserIcon,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  addCollaborators,
  deleteWorkspace,
  getCollaborators,
  getUserById,
  removeCollaborators,
  updateProfile,
  updateWorkspace,
} from "@/lib/supabase/queries";
import { v4 } from "uuid";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CollaboratorSearch from "../global/CollaboratorSearch";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CypressProfileIcon from "../icons/cypressProfileIcon";
import LogoutButton from "../global/LogoutButton";
import Link from "next/link";
import { useSubscriptionModal } from "@/lib/providers/subscription-modal-provider";
import { postData } from "@/lib/utils";

const SettingsForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user, subscription } = useSupabaseUser();
  const { open, setOpen } = useSubscriptionModal();
  const supabase = createClientComponentClient();
  const { state, workspaceId, dispatch } = useAppState();
  const [userData, setUserData] = useState<User>();
  const [permissions, setPermissions] = useState("private");
  const [collaborators, setCollaborators] = useState<User[] | []>([]);
  const [openAlertMessage, setOpenAlertMessage] = useState(false);
  const [workspaceDetails, setWorkspaceDetails] = useState<workspace>();
  const titleTimeRef = useRef<ReturnType<typeof setTimeout>>();
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [uploadingWorkspaceLogo, setUploadingWorkspaceLogo] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    const showingWorkspace = state.workspaces.find(
      (workspace) => workspace.id === workspaceId
    );
    if (showingWorkspace) setWorkspaceDetails(showingWorkspace);
  }, [workspaceId, state]);

  useEffect(() => {
    const getUserDetails = async () => {
      if (!user || uploadingProfilePic) return;
      const userDetails = await getUserById(user?.id);
      if (userDetails) {
        setUserData(userDetails);
      }
    };
    getUserDetails();
  }, [user, uploadingProfilePic]);

  // WIP PAYMENT PORTAL

  // Add Collaborator
  const addCollaborator = async (profile: User) => {
    if (!workspaceId) return;
    if (subscription?.status !== "active" && collaborators.length >= 2) {
      setOpen(true);
      return;
    }

    await addCollaborators([profile], workspaceId);
    setCollaborators([...collaborators, profile]);

    router.refresh();
  };

  // Remove collaborators
  const removeCollaborator = async (profile: User) => {
    if (!workspaceId) return;
    if (collaborators.length === 1) {
      setPermissions("private");
    }
    await removeCollaborators([profile], workspaceId);
    setCollaborators(collaborators.filter((val) => val.id !== profile.id));
  };

  //onChange workspace title
  const workspaceNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId || !e.target?.value) return;

    dispatch({
      type: "UPDATE_WORKSPACE",
      payload: { workspace: { title: e.target.value }, workspaceId },
    });
    if (titleTimeRef.current) clearTimeout(titleTimeRef.current);
    titleTimeRef.current = setTimeout(async () => {
      await updateWorkspace({ title: e.target.value }, workspaceId);
    }, 500);
  };

  // On change

  const onChangeWorkspaceLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const uuid = v4();
    setUploadingWorkspaceLogo(true);
    const { data, error } = await supabase.storage
      .from("workspace-logos")
      .upload(`workspaceLogo.${uuid}`, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (!error) {
      dispatch({
        type: "UPDATE_WORKSPACE",
        payload: { workspace: { logo: data.path }, workspaceId },
      });
      await updateWorkspace({ logo: data.path }, workspaceId);
    }
    setUploadingWorkspaceLogo(false);
  };

  const onChangeProfilePic = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProfilePic(true);
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(`profilePicture.${user.id}`, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (!error) {
      await updateProfile({ avatarUrl: data.path }, user.id);
    }
    setUploadingProfilePic(false);
  };

  // On clicks

  //fetching avatars

  //get workspace details

  // get all collaborators
  useEffect(() => {
    if (!workspaceId) return;
    const fetchCollaborators = async () => {
      const response = await getCollaborators(workspaceId);
      if (response.length) {
        setPermissions("shared");
        setCollaborators(response);
      }
    };
    fetchCollaborators();
  }, [workspaceId]);

  // WIP payment redirect

  // Delete workspace
  const handleDeleteWorkspace = async () => {
    if (!workspaceId) return;
    const { error } = await deleteWorkspace(workspaceId);
    if (!error) {
      dispatch({ type: "DELETE_WORKSPACE", payload: workspaceId });
      toast({ title: "Successfully deleted your workspace" });
      router.replace("/dashboard");
    } else {
      toast({ variant: "destructive", title: "Something went wrong!" });
    }
  };

  const onPermissionChange = (val: string) => {
    if (val === "private") {
      setOpenAlertMessage(true);
    } else {
      setPermissions(val);
    }
  };

  const onClickAlertConfirm = async () => {
    if (!workspaceId) return;
    if (collaborators.length > 0) {
      await removeCollaborators(collaborators, workspaceId);
    }
    setPermissions("private");
    setOpenAlertMessage(false);
  };

  const redirectToCustomerPortal = async () => {
    try {
      setLoadingPortal(true);
      const { url, error } = await postData({ url: "/api/create-portal-link" });
      if (!error) {
        window.location.assign(url);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <div className="flex gap-4 flex-col">
      <p className="flex items-center gap-2 mt-6">
        <Briefcase size={20} />
        Workspace
      </p>
      <Separator />
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="workspaceName"
          className="text-sm text-muted-foreground"
        >
          Name
        </Label>
        <Input
          name="workspaceName"
          value={workspaceDetails ? workspaceDetails?.title : ""}
          placeholder="Workspace Name"
          onChange={workspaceNameChange}
        />
        <Label
          htmlFor="workspaceLogo"
          className="text-sm text-muted-foreground"
        >
          Workspace Logo
        </Label>
        <Input
          name="workspaceLogo"
          type="file"
          accept="image/*"
          placeholder="Workspace Logo"
          disabled={uploadingWorkspaceLogo || subscription?.status !== "active"}
          onChange={onChangeWorkspaceLogo}
        />
        {subscription?.status !== "active" && (
          <small className="text-muted-foreground">
            To customize your workspace, you need to be on a Pro Plan
          </small>
        )}
        <>
          <Label
            htmlFor="permissions"
            className="text-sm text-muted-foreground"
          >
            Permissions
          </Label>
          <Select value={permissions} onValueChange={onPermissionChange}>
            <SelectTrigger className="w-full h-26 -mt-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="private">
                  <div className="p-2 flex gap-4 justify-center items-center">
                    <Lock />
                    <article className="text-left flex flex-col">
                      <span>Private</span>
                      <p>
                        Your workspace is private to you. You can choose to
                        share it later.
                      </p>
                    </article>
                  </div>
                </SelectItem>
                <SelectItem value="shared">
                  <div className="p-2 flex gap-4 justify-center items-center">
                    <Share />
                    <article className="text-left flex flex-col">
                      <span>Shared</span>
                      <p>You can invite collaborators.</p>
                    </article>
                  </div>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {permissions === "shared" && (
            <div>
              <CollaboratorSearch
                existingCollaborators={collaborators}
                getCollaborator={(user) => {
                  addCollaborator(user);
                }}
              >
                <Button type="button" className="text-sm mt-4">
                  <Plus /> Add Collaborators
                </Button>
              </CollaboratorSearch>
              <div className="mt-4">
                <span className="text-sm text-muted-foreground">
                  Collaborators {collaborators.length || ""}
                </span>
                <ScrollArea className="h-[120px] w-full rounded-md border border-muted-foreground/20">
                  {collaborators.length ? (
                    collaborators.map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="flex justify-between items-center p-4"
                      >
                        <div className="flex gap-4 items-center">
                          <Avatar>
                            <AvatarImage src="/avatars/7.png" />
                            <AvatarFallback>PJ</AvatarFallback>
                          </Avatar>
                          <div className="text-sm gap-2 text-muted-foreground overflow-hidden overflow-ellipsis">
                            {collaborator.email}
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            removeCollaborator(collaborator);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">
                        You have no collaborators
                      </span>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
          <Alert variant="destructive">
            <AlertDescription>
              Warning! deleting you workspace will permanently delete all data
              related to this workspace.
            </AlertDescription>
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              className="mt-4 text-sm bg-destructive/40 border-2 border-destructive"
              onClick={handleDeleteWorkspace}
            >
              Delete Workspace
            </Button>
          </Alert>
          <p className="flex items-center gap-2 mt-6">
            <UserIcon size={20} /> Profile
          </p>
          <Separator />
          <div className="flex items-center">
            <Avatar>
              <AvatarImage
                src={
                  userData?.avatarUrl
                    ? supabase.storage
                        .from("avatars")
                        .getPublicUrl(userData?.avatarUrl).data.publicUrl
                    : ""
                }
              />
              <AvatarFallback>
                <CypressProfileIcon />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col ml-6">
              <small className="text-muted-foreground cursor-not-allowed">
                {user ? user.email : ""}
              </small>
              <Label
                htmlFor="profilePicture"
                className="text-sm text-muted-foreground"
              >
                Profile Picture
              </Label>
              <Input
                name="profilePicture"
                type="file"
                accept="image/*"
                placeholder="Profile Picture"
                onChange={onChangeProfilePic}
                disabled={uploadingProfilePic}
              />
            </div>
          </div>
          <LogoutButton>
            <div className="flex items-center">
              <LogOut />
            </div>
          </LogoutButton>
          <p className="flex items-center gap-2 mt-6">
            <CreditCard /> Billing & Plan
          </p>
          <Separator />
          <p className="text-muted-foreground">
            You are currently on a{" "}
            {subscription?.status === "active" ? "Pro" : "Free"} Plan
          </p>
          <Link
            href="/"
            target="_blank"
            className="text-muted-foreground flex flex-row items-center gap-2"
          >
            View Plans <ExternalLink size={16} />
          </Link>
          {subscription?.status === "active" ? (
            <div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={loadingPortal}
                className="text-sm"
                onClick={redirectToCustomerPortal}
              >
                Manage Subscription
              </Button>
            </div>
          ) : (
            <div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="text-sm"
                onClick={() => {
                  setOpen(true);
                }}
              >
                Start Plan
              </Button>
            </div>
          )}
        </>
        <AlertDialog open={openAlertMessage}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDescription>
                Changing a Shared workspace to Private workspace will remove all
                collaborators permanently.
              </AlertDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOpenAlertMessage(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={onClickAlertConfirm}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SettingsForm;
