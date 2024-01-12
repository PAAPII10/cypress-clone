import { ReactNode } from "react";

interface ILayout {
  children: ReactNode;
  params: any;
}

const layout = ({ children, params }: ILayout) => {
  return <main className="flex over-hidden h-screen">{children}</main>;
};

export default layout;
