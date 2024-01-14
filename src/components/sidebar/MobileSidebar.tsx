"use client";

import { ReactNode, useState } from "react";
import { Menu } from "lucide-react";
import CypressPageIcon from "../icons/cypressPageIcon";
import { cn } from "@/lib/utils";

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
  const [selectedNav, setSelectedNav] = useState("");
  return (
    <>
      {selectedNav === "sidebar" && <>{children}</>}
      <nav className="bg-black/10 backdrop-blur-lg sm:hidden fixed z-50 bottom-0 right-0 left-0">
        <ul className="flex justify-between items-center p-4">
          {nativeNavigation.map((item) => (
            <li
              key={item.id}
              className="flex items-center flex-col justify-center"
              onClick={() => {
                setSelectedNav(item.id);
              }}
            >
              <item.customIcon />
              <small
                className={cn("", {
                  "text-muted-foreground": selectedNav !== item.id,
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
