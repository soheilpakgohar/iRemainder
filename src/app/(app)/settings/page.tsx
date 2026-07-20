import { requireOperator } from "@/lib/auth";
import { getSmsTemplates } from "@/app/actions/settings";
import { SettingsContent } from "./SettingsContent";

export default async function SettingsPage() {
  await requireOperator();
  const initialTemplates = await getSmsTemplates();
  return <SettingsContent initialTemplates={initialTemplates} />;
}
