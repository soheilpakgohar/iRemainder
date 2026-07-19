import { requireOperator } from "@/lib/auth";
import { NewPlanForm } from "./NewPlanForm";

export default async function NewCustomerPage() {
  await requireOperator();
  return <NewPlanForm />;
}
