"use client";

import { ReactNode } from "react";
import { Menu } from "lucide-react";
import CypressPageIcon from "../icons/cypressPageIcon";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/providers/state-provider";

interface IMobileSidebarProps {
  children: ReactNode;
}

export const nativeNavigation = [
  {
    title: "Sidebar",
    id: "sidebar",
    customIcon: Menu,
  },
  {
    title: "Pages",
    id: "pages",
    customIcon: CypressPageIcon,
  },
] as const;

const MobileSidebar = ({ children }: IMobileSidebarProps) => {
  const { selectedNavForMob, onNavNarChangeForMob } = useAppState();

  return (
    <>
      {selectedNavForMob === "sidebar" && <>{children}</>}
      <nav className="bg-black/10 backdrop-blur-lg sm:hidden fixed z-50 bottom-0 right-0 left-0">
        <ul className="flex justify-between items-center p-4">
          {nativeNavigation.map((item) => (
            <li
              key={item.id}
              className="flex items-center flex-col justify-center"
              onClick={() => {
                onNavNarChangeForMob(item.id);
              }}
            >
              <item.customIcon />
              <small
                className={cn("", {
                  "text-muted-foreground": selectedNavForMob !== item.id,
                })}
              >
                {item.title}
              </small>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default MobileSidebar;
