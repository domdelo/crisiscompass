import type { Metadata } from "next";
import { RecoveryGuide } from "@/components/RecoveryGuide";

export const metadata: Metadata = {
  title: "Your Recovery Guide | CrisisCompass",
};

export default async function GuidePage(props: PageProps<"/guide">) {
  const { step } = await props.searchParams;
  return <RecoveryGuide initialStep={typeof step === "string" ? step : null} />;
}
