export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getFileDetails } from "@/lib/supabase/queries";
import QuillEditor from "@/components/quill-editor.tsx/QuillEditor";

interface IFilePageProps {
  params: {
    fileId: string;
  };
}

const FilePage = async ({ params }: IFilePageProps) => {
  const { fileId } = params;
  const { data, error } = await getFileDetails(fileId);

  if (error || !data?.length) redirect("/dashboard");

  return (
    <div className="relative">
      <QuillEditor dirType="file" fileId={fileId} dirDetails={data[0] || {}} />
    </div>
  );
};

export default FilePage;
