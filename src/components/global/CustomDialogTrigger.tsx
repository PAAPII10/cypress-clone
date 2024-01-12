import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import clsx from "clsx";

interface ICustomDialogTriggerProps {
  header?: string;
  content?: ReactNode;
  children: ReactNode;
  description?: string;
  className?: string;
}

const CustomDialogTrigger = ({
  header,
  content,
  children,
  description,
  className,
}: ICustomDialogTriggerProps) => {
  return (
    <Dialog>
      <DialogTrigger className={clsx("", className)}>{children}</DialogTrigger>
      <DialogContent className="h-screen block sm:h-[440px] overflow-scroll w-full no-scrollbar">
        <DialogHeader>
          <DialogTitle>{header}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default CustomDialogTrigger;
