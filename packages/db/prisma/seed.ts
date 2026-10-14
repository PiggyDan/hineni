/**
 * Seeds only structural, non-fabricated data: reading plans generated from the
 * canon's real book/chapter structure. Editorial content, media and churches are
 * added by people through the admin dashboard.
 *
 * Set SEED_ADMIN_EMAIL to promote an existing (already registered) user to ADMIN.
 */
import { PLAN_TEMPLATES } from "@cp/shared";
import { prisma } from "../src";

async function main() {
  for (const plan of PLAN_TEMPLATES) {
    const data = {
      kind: plan.kind,
      titleEn: plan.title.en,
      titleMn: plan.title.mn,
      descriptionEn: plan.description.en,
      descriptionMn: plan.description.mn,
      dayCount: plan.days.length,
      days: plan.days as unknown as object,
    };
    await prisma.readingPlan.upsert({ where: { slug: plan.slug }, update: data, create: { slug: plan.slug, ...data } });
  }
  console.log(`Seeded ${PLAN_TEMPLATES.length} reading plans.`);

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  if (adminEmail) {
    const user = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!user) console.warn(`SEED_ADMIN_EMAIL ${adminEmail} has not registered yet; register first, then re-run.`);
    else {
      await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
      await prisma.auditLog.create({
        data: { action: "user.role.seed", entityType: "user", entityId: user.id, metadata: { role: "ADMIN" } },
      });
      console.log(`Promoted ${adminEmail} to ADMIN.`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
