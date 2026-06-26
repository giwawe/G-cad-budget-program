import { UploadWorkbench } from "@/components/upload-workbench";
import { DEFAULT_PROJECT_FILE_NAME, defaultProjectRows, defaultProjectSummary } from "@/lib/default-project";

export default function Home() {
  return <UploadWorkbench initialFileName={DEFAULT_PROJECT_FILE_NAME} initialRows={defaultProjectRows} initialSummary={defaultProjectSummary} />;
}
