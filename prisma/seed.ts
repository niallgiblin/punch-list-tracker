import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.upsert({
    where: { id: "seed-demo-project" },
    create: {
      id: "seed-demo-project",
      name: "Demo build — Seed data",
      address: "123 Example St, Sample City",
      status: "active",
    },
    update: {},
  });

  await prisma.punchItem.deleteMany({ where: { projectId: project.id } });

  await prisma.punchItem.createMany({
    data: [
      {
        projectId: project.id,
        location: "Unit 3 — Kitchen",
        description: "Cabinet alignment off by 1/4 inch near range.",
        status: "open",
        priority: "normal",
        assignedTo: null,
      },
      {
        projectId: project.id,
        location: "Hallway",
        description: "Scuff marks on baseboard, east wall.",
        status: "in_progress",
        priority: "low",
        assignedTo: "Alex M.",
      },
      {
        projectId: project.id,
        location: "Bath 2",
        description: "Caulk bead incomplete around tub.",
        status: "complete",
        priority: "high",
        assignedTo: "Jordan K.",
      },
    ],
  });

  console.log("Seed complete:", project.name);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
