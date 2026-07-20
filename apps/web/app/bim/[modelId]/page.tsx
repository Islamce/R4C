import { BimViewer } from "../../../components/BimViewer";

export default async function BimModelPage({
  params,
}: {
  params: Promise<{ modelId: string }>;
}) {
  const { modelId } = await params;
  return <BimViewer modelId={modelId} />;
}
