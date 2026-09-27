import { prisma } from "@/lib/db/prisma";
import { getOwnedRecord } from "./queries";

async function runTraceTest() {
    // Set up: two separate users, each owning one record.
    const userA = await prisma.user.create({
        data: { email: `trace-a-${Date.now()}@test.com`, passwordHash: "not-a-real-hash-just-for-testing" },
    });
    const userB = await prisma.user.create({
        data: { email: `trace-b-${Date.now()}@test.com`, passwordHash: "not-a-real-hash-just-for-testing" },
    });

    const recordOwnedByA = await prisma.record.create({
        data: {
            userId: userA.id,
            title: "Test Record Owned By A",
            notes: "trace test data",
            status: "OPEN",
        },
    });

    console.log("=== Trace 1: Normal (correct owner requests their own record) ===");
    const trace1 = await getOwnedRecord(userA.id, recordOwnedByA.publicId);
    console.log(trace1);
    console.log("Hand-traced prediction: the real record is returned\n");

    console.log("=== Trace 2: Edge case (different user requests A's record) ===");
    const trace2 = await getOwnedRecord(userB.id, recordOwnedByA.publicId);
    console.log(trace2);
    console.log("Hand-traced prediction: null\n");

    console.log("=== Trace 3: Invalid (correct user, but a made-up record ID) ===");
    const trace3 = await getOwnedRecord(userA.id, "this-record-id-does-not-exist");
    console.log(trace3);
    console.log("Hand-traced prediction: null\n");

    // Clean up: remove the temporary test data.
    await prisma.record.delete({ where: { id: recordOwnedByA.id } });
    await prisma.user.delete({ where: { id: userA.id } });
    await prisma.user.delete({ where: { id: userB.id } });
    console.log("Cleaned up temporary test data.");
}

runTraceTest()
    .catch(console.error)
    .finally(() => prisma.$disconnect());