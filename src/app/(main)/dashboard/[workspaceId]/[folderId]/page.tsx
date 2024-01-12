export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getFolderDetails } from "@/lib/supabase/queries";
import QuillEditor from "@/components/quill-editor.tsx/QuillEditor";

interface IFolderPageProps {
  params: {
    folderId: string;
  };
}

const FolderPage = async ({ params }: IFolderPageProps) => {
  const { folderId } = params;
  const { data, error } = await getFolderDetails(folderId);

  if (error || !data?.length) redirect("/dashboard");

  return (
    <div className="relative">
      <QuillEditor
        dirType="folder"
        fileId={folderId}
        dirDetails={data[0] || {}}
      />
    </div>
  );
};

export default FolderPage;
