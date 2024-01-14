import Link from "next/link";
import { twMerge } from "tailwind-merge";
import CypressHomeIcon from "../icons/cypressHomeIcon";
import CypressSettingsIcon from "../icons/cypressSettingsIcon";
import CypressTrashIcon from "../icons/cypressTrashIcon";
import Settings from "../settings/Settings";
import Trash from "../trash/Trash";

interface INativeNavigationProps {
  myWorkspaceId: string;
  className?: string;
}
const NativeNavigation = ({
  myWorkspaceId,
  className,
}: INativeNavigationProps) => {
  return (
    <nav className={twMerge("my-2", className)}>
      <ul className="flex flex-col gap-2">
        <li>
          <Link
            className="group/native flex text-Neutrals/neutrals-7 transition-all gap-2"
            href={`/dashboard/${myWorkspaceId}`}
          >
            <CypressHomeIcon />
            <span>My Workspace</span>
          </Link>
        </li>
        <Settings>
          <li className="group/native flex text-Neutrals/neutrals-7 transition-all gap-2 cursor-pointer">
            <CypressSettingsIcon />
            <span>Settings</span>
          </li>
        </Settings>
        <Trash>
          <li className="cursor-pointer group/native flex text-Neutrals/neutrals-7 transition-all gap-2">
            <CypressTrashIcon />
            <span>Trash</span>
          </li>
        </Trash>
      </ul>
    </nav>
  );
};

export default NativeNavigation;
