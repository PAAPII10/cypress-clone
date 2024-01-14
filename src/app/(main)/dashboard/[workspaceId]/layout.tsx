import MobileSidebar from "@/components/sidebar/MobileSidebar";
import Sidebar from "@/components/sidebar/sidebar";
import { ReactNode } from "react";

interface ILayout {
  children: ReactNode;
  params: any;
}

const layout = ({ children, params }: ILayout) => {
  return (
    <main className="flex overflow-hidden h-screen w-screen">
      {/* @ts-expect-error Server Component */}
      <Sidebar params={params} />
      <MobileSidebar>
        {/* @ts-expect-error Server Component */}
        <Sidebar params={params} className="w-screen inline-block sm:hidden" />
      </MobileSidebar>

      <div className="dark:border-Neutrals-12/70 border-l-[1px] w-full relative overflow-scroll no-scrollbar">
        {children}
      </div>
    </main>
  );
};

export default layout;
