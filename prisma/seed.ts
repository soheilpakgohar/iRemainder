import { PrismaClient } from "@prisma/client";
import { generateInstallments } from "../src/lib/plans";
import { dayjs } from "../src/lib/jalali";

const prisma = new PrismaClient();

/**
 * Seed: create realistic sample customers + plans + installments.
 * Due dates are anchored relative to *today* so the calendar always
 * shows dots near the current date on first run.
 */
async function main() {
  console.log("🌱 Seeding iRemainder…");

  // Wipe (dev convenience — safe because this is a local-only SQLite file).
  await prisma.installment.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.setting.deleteMany();

  // SMS template singleton.
  await prisma.setting.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      smsTemplate:
        "سلام {name} عزیز، قسط شماره {installmentNo} از {totalInstallments} به مبلغ {amount} سررسید شده است. لطفًاً پرداخت فرمایید. با تشکر، فروشگاه.",
    },
  });

  const today = dayjs().startOf("day").hour(12);

  // Helper to create a customer + plan + installments.
  const addPlan = async (
    fullName: string,
    phone: string,
    totalAmount: number,
    count: number,
    startOffsetDays: number, // relative to today
    paidUpTo: number, // pay installments 1..paidUpTo
    intervalDays = 30,
  ) => {
    const customer = await prisma.customer.create({
      data: { fullName, phone },
    });
    const startDate = today.add(startOffsetDays, "day").toDate();
    const installments = generateInstallments({
      totalAmount,
      count,
      startDate,
      intervalDays,
    });
    await prisma.plan.create({
      data: {
        customerId: customer.id,
        totalAmount,
        installmentsCount: count,
        startDate,
        intervalDays,
        installments: {
          create: installments.map((it) => ({
            number: it.number,
            dueDate: it.dueDate,
            amount: it.amount,
            paid: it.number <= paidUpTo,
            paidAt: it.number <= paidUpTo ? new Date() : null,
          })),
        },
      },
    });
    console.log(`  ✓ ${fullName} — ${count} installments, paid 1..${paidUpTo}`);
  };

  // Customer 1: Sara Ahmadi — due TODAY on installment 3/6, all earlier paid.
  await addPlan("سارا احمدی", "09123456789", 3_000_000, 6, -60, 2);

  // Customer 2: Reza Moradi — due 3 days ago (overdue), nothing paid yet.
  await addPlan("رضا مرادی", "09351112233", 2_400_000, 4, -3, 0);

  // Customer 3: Maryam Hosseini — due in 2 days.
  await addPlan("مریم حسینی", "09018889900", 5_000_000, 10, 2, 0);

  // Customer 4: Ali Karimi — due today too (so today's sheet has 2).
  await addPlan("علی کریمی", "09190000001", 1_200_000, 6, 0, 5);

  // Customer 5: Niloofar Abbasi — fully paid plan, no upcoming dots.
  await addPlan("نیلوفر عباسی", "09201234567", 1_800_000, 3, -90, 3);

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
