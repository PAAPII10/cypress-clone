export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getWorkspaceDetails } from "@/lib/supabase/queries";
import QuillEditor from "@/components/quill-editor.tsx/QuillEditor";

interface IWorkspacePageProps {
  params: {
    workspaceId: string;
  };
}
const WorkspacePage = async ({ params }: IWorkspacePageProps) => {
  const { workspaceId } = params;
  const { data, error } = await getWorkspaceDetails(workspaceId);

  if (error || !data?.length) redirect("/dashboard");

  return (
    <div className="relative">
      <QuillEditor
        dirType="workspace"
        fileId={workspaceId}
        dirDetails={data[0] || {}}
      />
    </div>
  );
};

export default WorkspacePage;
