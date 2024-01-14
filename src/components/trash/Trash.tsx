import { ReactNode } from "react";
import CustomDialogTrigger from "../global/CustomDialogTrigger";
import TrashRestore from "./TrashRestore";

interface ITrashProps {
  children: ReactNode;
}
const Trash = ({ children }: ITrashProps) => {
  return (
    <CustomDialogTrigger header="Trash" content={<TrashRestore />}>
      {children}
    </CustomDialogTrigger>
  );
};

export default Trash;
