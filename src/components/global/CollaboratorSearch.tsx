"use client";

import { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";
import { User } from "@/lib/supabase/supabase.types";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { getUserFromSearch } from "@/lib/supabase/queries";

interface ICollaboratorSearchProps {
  existingCollaborators: User[] | [];
  getCollaborator: (collaborator: User) => void;
  children: ReactNode;
}
const CollaboratorSearch = ({
  existingCollaborators,
  getCollaborator,
  children,
}: ICollaboratorSearchProps) => {
  const { user } = useSupabaseUser();
  const [searchResults, setSearchResults] = useState<User[] | []>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    if (timerRef) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const response = await getUserFromSearch(e.target.value);
      setSearchResults(response);
    }, 450);
  };

  const addCollaborator = (profile: User) => {
    getCollaborator(profile);
  };

  return (
    <Sheet>
      <SheetTrigger className="w-full">{children}</SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Search Collaborator</SheetTitle>
          <SheetDescription>
            <p className="text-sm text-muted-foreground">
              You can also remove collaborators after adding them from the
              settings tab.
            </p>
          </SheetDescription>
        </SheetHeader>
        <div className="flex justify-center items-center mt-2 gap-2">
          <Search />
          <Input
            name="name"
            className="dark:bg-background"
            placeholder="Email"
            onChange={onChangeHandler}
          />
        </div>
        <ScrollArea className="mt-6 w-full rounded-md">
          {searchResults
            .filter(
              (result) =>
                !existingCollaborators.some(
                  (existing) => existing.id === result.id
                )
            )
            .filter((result) => result.id !== user?.id)
            .map((profile) => (
              <div
                key={profile.id}
                className="p-4 flex justify-between items-center"
              >
                <div className="flex gap-4 items-center">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/avatars/7.png" />
                    <AvatarFallback>CP</AvatarFallback>
                  </Avatar>
                  <div className="text-sm gap-2 overflow-hidden overflow-ellipsis w-[180px] text-muted-foreground">
                    {profile.email}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => addCollaborator(profile)}
                >
                  Add
                </Button>
              </div>
            ))}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default CollaboratorSearch;
