import { ReactNode } from "react";
import CustomDialogTrigger from "../global/CustomDialogTrigger";
import SettingsForm from "./SettingsForm";

interface ISettingsProps {
  children: ReactNode;
}
const Settings = ({ children }: ISettingsProps) => {
  return (
    <CustomDialogTrigger header="Settings" content={<SettingsForm />}>
      {children}
    </CustomDialogTrigger>
  );
};

export default Settings;
