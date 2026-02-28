/**
 * Temporary test script — does NOT modify any production code.
 *
 * Usage:
 *   1. Make sure the dev server is running: npm run dev
 *   2. Set GROUP_ID below to a real group ID from your database
 *   3. Run: npx tsx scripts/testSettlement.ts
 */

const BASE_URL = "http://localhost:3000";

// ✏️  Replace with a real group ID from your database
const GROUP_ID = process.env.TEST_GROUP_ID ?? "REPLACE_WITH_REAL_GROUP_ID";

async function testSettlement() {
    const url = `${BASE_URL}/api/groups/${GROUP_ID}/settlements`;

    console.log(`\n→ GET ${url}\n`);

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
        console.error("❌ Error response:", res.status, data);
        process.exit(1);
    }

    console.log("✅ Settlement response:\n");
    console.log(JSON.stringify(data, null, 2));
}

testSettlement().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
