import { requireOperator } from "@/lib/auth";
import { getSmsTemplate } from "@/app/actions/settings";
import { SettingsContent } from "./SettingsContent";

export default async function SettingsPage() {
  await requireOperator();
  const initialTemplate = await getSmsTemplate();
  return <SettingsContent initialTemplate={initialTemplate} />;
}
