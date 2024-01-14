"use server";

import { validate } from "uuid";
import { files, folders, users, workspaces } from "../../../migrations/schema";
import db from "./db";
import { File, Folder, Subscription, User, workspace } from "./supabase.types";
import { and, eq, ilike, notExists } from "drizzle-orm";
import { collaborators } from "./schema";
import { revalidatePath } from "next/cache";

export const getUserSubscriptionStatus = async (userId: string) => {
  try {
    const data = await db.query.subscriptions.findFirst({
      where: (s, { eq }) => eq(s.userId, userId),
    });
    if (data) return { data: data as Subscription, error: null };

    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: `Error` };
  }
};

export const createWorkspace = async (workspace: workspace) => {
  try {
    const response = await db.insert(workspaces).values(workspace);
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const getWorkspaceDetails = async (workspaceId: string) => {
  const isValid = validate(workspaceId);
  if (!isValid)
    return {
      data: [],
      error: "Error",
    };
  try {
    const data = (await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1)) as workspace[];

    return { data, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: `Error` };
  }
};

export const deleteWorkspace = async (workspaceId: string) => {
  const isValid = validate(workspaceId);
  if (!isValid) return { data: null, error: "Error" };
  try {
    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const getPrivateWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const privateWorkspaces = (await db
    .select({
      id: workspaces.id,
      createdAt: workspaces.createdAt,
      workspaceOwner: workspaces.workspaceOwner,
      title: workspaces.title,
      iconId: workspaces.iconId,
      data: workspaces.data,
      inTrash: workspaces.inTrash,
      logo: workspaces.logo,
      bannerUrl: workspaces.bannerUrl,
    })
    .from(workspaces)
    .where(
      and(
        notExists(
          db
            .select()
            .from(collaborators)
            .where(eq(collaborators.workspaceId, workspaces.id))
        ),
        eq(workspaces.workspaceOwner, userId)
      )
    )) as workspace[];
  return privateWorkspaces;
};

export const getCollaboratingWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const collaboratedWorkspaces = (await db
    .select({
      id: workspaces.id,
      createdAt: workspaces.createdAt,
      workspaceOwner: workspaces.workspaceOwner,
      title: workspaces.title,
      iconId: workspaces.iconId,
      data: workspaces.data,
      inTrash: workspaces.inTrash,
      logo: workspaces.logo,
      bannerUrl: workspaces.bannerUrl,
    })
    .from(users)
    .innerJoin(collaborators, eq(users.id, collaborators.userId))
    .innerJoin(workspaces, eq(collaborators.workspaceId, workspaces.id))
    .where(eq(users.id, userId))) as workspace[];

  return collaboratedWorkspaces;
};

export const getSharedWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const sharedWorkspaces = (await db
    .selectDistinct({
      id: workspaces.id,
      createdAt: workspaces.createdAt,
      workspaceOwner: workspaces.workspaceOwner,
      title: workspaces.title,
      iconId: workspaces.iconId,
      data: workspaces.data,
      inTrash: workspaces.inTrash,
      logo: workspaces.logo,
      bannerUrl: workspaces.bannerUrl,
    })
    .from(workspaces)
    .orderBy(workspaces.createdAt)
    .innerJoin(collaborators, eq(workspaces.id, collaborators.workspaceId))
    .where(eq(workspaces.workspaceOwner, userId))) as workspace[];
  return sharedWorkspaces;
};

export const addCollaborators = async (user: User[], workspaceId: string) => {
  const response = user.forEach(async (user: User) => {
    const userExist = await db.query.collaborators.findFirst({
      where: (u, { eq }) =>
        and(eq(u.userId, user.id), eq(u.workspaceId, workspaceId)),
    });
    if (!userExist) {
      await db.insert(collaborators).values({ workspaceId, userId: user.id });
    }
  });
};

export const getCollaborators = async (workspaceId: string) => {
  const isValid = validate(workspaceId);
  if (!isValid) return [];
  const response = await db
    .select()
    .from(collaborators)
    .where(eq(collaborators.workspaceId, workspaceId));
  if (!response.length) return [];
  console.log(response);
  const userInformation: Promise<User | undefined>[] = response.map(
    async (user) => {
      const exists = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, user.userId),
      });
      return exists;
    }
  );
  const resolvedUser = await Promise.all(userInformation);
  return resolvedUser.filter(Boolean) as User[];
};

export const removeCollaborators = async (
  user: User[],
  workspaceId: string
) => {
  const response = user.forEach(async (user: User) => {
    const userExist = await db.query.collaborators.findFirst({
      where: (u, { eq }) =>
        and(eq(u.userId, user.id), eq(u.workspaceId, workspaceId)),
    });
    if (userExist) {
      await db
        .delete(collaborators)
        .where(
          and(
            eq(collaborators.workspaceId, workspaceId),
            eq(collaborators.userId, user.id)
          )
        );
    }
  });
};

export const createFolder = async (folder: Folder) => {
  try {
    await db.insert(folders).values(folder);
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const getFolders = async (workspaceId: string) => {
  const isValid = validate(workspaceId);
  if (!isValid)
    return {
      data: null,
      error: "Error",
    };

  try {
    const results: Folder[] | [] = await db
      .select()
      .from(folders)
      .orderBy(folders.createdAt)
      .where(eq(folders.workspaceId, workspaceId));
    return { data: results, error: null };
  } catch (error) {
    return { data: null, error: "Error" };
  }
};

export const getFolderDetails = async (folderId: string) => {
  const isValid = validate(folderId);
  if (!isValid)
    return {
      data: [],
      error: "Error",
    };
  try {
    const data = (await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1)) as Folder[];

    return { data, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: `Error` };
  }
};

export const updateFolder = async (
  folder: Partial<Folder>,
  folderId: string
) => {
  try {
    await db.update(folders).set(folder).where(eq(folders.id, folderId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const moveFolderToTrash = async (
  folderId: string,
  userEmail: string
) => {
  const isValid = validate(folderId);
  if (!isValid) return { data: null, error: "Error" };
  try {
    await db
      .update(folders)
      .set({ inTrash: `Deleted by ${userEmail}` })
      .where(eq(folders.id, folderId));
    await db
      .update(files)
      .set({ inTrash: `Deleted by ${userEmail}` })
      .where(eq(files.folderId, folderId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const removeFolderFromTrash = async (folderId: string) => {
  const isValid = validate(folderId);
  if (!isValid) return { data: null, error: "Error" };
  try {
    await db
      .update(folders)
      .set({ inTrash: "" })
      .where(eq(folders.id, folderId));
    await db
      .update(files)
      .set({ inTrash: "" })
      .where(eq(files.folderId, folderId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const deleteFolder = async (folderId: string) => {
  const isValid = validate(folderId);
  if (!isValid) return { data: null, error: "Error" };
  try {
    await db.delete(folders).where(eq(folders.id, folderId));
    await db.delete(files).where(eq(files.folderId, folderId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const createFile = async (file: File) => {
  try {
    await db.insert(files).values(file);
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const getFiles = async (folderId: string) => {
  const isValid = validate(folderId);
  if (!isValid) return { data: null, error: "Error" };
  try {
    const results = (await db
      .select()
      .from(files)
      .orderBy(files.createdAt)
      .where(eq(files.folderId, folderId))) as File[] | [];
    return { data: results, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const getFileDetails = async (fileId: string) => {
  const isValid = validate(fileId);
  if (!isValid)
    return {
      data: [],
      error: "Error",
    };
  try {
    const data = (await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1)) as File[];

    return { data, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: `Error` };
  }
};

export const updateFile = async (file: Partial<File>, fileId: string) => {
  try {
    await db.update(files).set(file).where(eq(files.id, fileId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const moveFileToTrash = async (fileId: string, userEmail: string) => {
  const isValid = validate(fileId);
  if (!isValid) return { data: null, error: "Error" };
  try {
    await db
      .update(files)
      .set({ inTrash: `Deleted by ${userEmail}` })
      .where(eq(files.id, fileId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const removeFileFromTrash = async (fileId: string) => {
  const isValid = validate(fileId);
  if (!isValid) return { data: null, error: "Error" };
  try {
    await db.update(files).set({ inTrash: "" }).where(eq(files.id, fileId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const deleteFile = async (fileId: string) => {
  const isValid = validate(fileId);
  if (!isValid) return { data: null, error: "Error" };
  try {
    await db.delete(files).where(eq(files.id, fileId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const updateWorkspace = async (
  workspace: Partial<workspace>,
  workspaceId: string
) => {
  const isValid = validate(workspaceId);
  if (!isValid) return { data: null, error: "Error" };
  try {
    await db
      .update(workspaces)
      .set(workspace)
      .where(eq(workspaces.id, workspaceId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const getUserFromSearch = async (email: string) => {
  if (!email) return [];
  const accounts = db
    .select()
    .from(users)
    .where(ilike(users.email, `${email}%`));
  return accounts;
};

export const getUserById = async (userId: string) => {
  const response = (await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  })) as User;
  return response;
};

export const updateProfile = async (user: Partial<User>, userId: string) => {
  const isValid = validate(userId);
  if (!isValid) return { data: null, error: "Error" };
  if (user?.email) return { data: null, error: "Cannot update email" };
  try {
    await db.update(users).set(user).where(eq(users.id, userId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const getActiveProductWithPrice = async () => {
  try {
    const response = await db.query.products.findMany({
      where: (pro, { eq }) => eq(pro.active, true),
      with: {
        prices: {
          where: (pri, { eq }) => eq(pri.active, true),
        },
      },
    });
    if (response.length) return { data: response, error: null };
    return { data: [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};
