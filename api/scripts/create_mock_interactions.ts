import { initializeMOI, writeLogic, readLogic, INTERACTION_LOGIC_ID, IDENTITY_LOGIC_ID } from '../src/lib/moi-client';
import util from 'util';

async function main(): Promise<boolean> {
    console.log("Creating mock interactions...");

    if (!INTERACTION_LOGIC_ID || INTERACTION_LOGIC_ID.trim() === '') {
        console.error("❌ INTERACTION_LOGIC_ID is not set in moi-client.ts.");
        console.error("   Please deploy the SageoInteractionLogic contract first.");
        console.error("   You can deploy it using the deployment scripts in the scripts/ directory.");
        return false;
    }

    const { wallet } = await initializeMOI();

    console.log("Wallet type:", typeof wallet);
    console.log("Wallet keys:", Object.keys(wallet));
    console.log("Wallet inspect:", util.inspect(wallet, { depth: 1 }));

    // Robust wallet address retrieval (from create_mock_data.ts)
    // Get address as string - MOI SDK will convert string to Identifier internally
    const addressRaw = (wallet as any).getIdentifier
        ? (wallet as any).getIdentifier()
        : (wallet as any).getAddress
            ? await (wallet as any).getAddress()
            : null;

    if (!addressRaw) {
        console.error("❌ Cannot determine wallet address");
        return false;
    }

    // Convert to string - MOI SDK accepts string addresses and converts to Identifier
    const address = addressRaw.toString ? addressRaw.toString() : String(addressRaw);
    console.log("Using wallet:", address);

    // 0. Get a valid Agent ID from IdentityLogic
    let targetAgentId = "agent_1"; // fallback
    try {
        const idsResult = await readLogic(null, IDENTITY_LOGIC_ID, 'GetAllAgentIds', 'identity') as any;
        const agentIds: string[] = idsResult?.output?.ids ?? idsResult?.ids ?? [];

        if (agentIds.length > 0) {
            targetAgentId = agentIds[0];
            console.log(`Using existing agent: ${targetAgentId}`);
        } else {
            console.warn("⚠️  No agents found in IdentityLogic. Using fallback 'agent_1' (API might fail to resolve address)");
        }
    } catch (e: any) {
        console.error("❌ Failed to get agent IDs:", e.message);
        return false;
    }

    // 1. Enlist as targetAgentId
    console.log(`Enlisting '${targetAgentId}'...`);
    try {
        await writeLogic(INTERACTION_LOGIC_ID, "Enlist", "interaction", targetAgentId);
        console.log("✅ Enlisted!");
    } catch (e: any) {
        console.error(`❌ Failed to enlist: ${e.message}`);
        return false;
    }

    // 2. Log Request (Self-Interaction 1)
    console.log("Logging Request 1...");
    const ts1 = Math.floor(Date.now() / 1000);
    let interactionId1: string;
    try {
        const req1Result = await writeLogic(INTERACTION_LOGIC_ID, "LogRequest", "interaction",
            address, // callee (self) - pass as string, MOI SDK converts to Identifier
            "req_hash_1",
            "greeting",
            ts1,
            "ctx_1", "task_1", "msg_1", "user_1", "sess_1"
        ) as any;

        console.log("LogRequest result structure:", JSON.stringify(req1Result, null, 2));

        // Extract interaction_id from return value
        interactionId1 = req1Result?.interaction_id
            ?? req1Result?.result?.interaction_id
            ?? req1Result?.output?.interaction_id
            ?? req1Result?.ix_operations?.[0]?.data?.interaction_id
            ?? req1Result?.ix_operations?.[0]?.data?.result?.interaction_id;

        if (!interactionId1) {
            console.error("❌ Failed to extract interaction_id. Full result:", req1Result);
            if (req1Result?.outputs && req1Result?._raw) {
                console.error("   Result is still POLO-encoded. Decoding may have failed.");
            }
            return false;
        }
        console.log(`✅ Got interaction_id: ${interactionId1}`);
    } catch (e: any) {
        console.error(`❌ Failed to log request 1: ${e.message}`);
        return false;
    }

    // 3. Log Response 1
    console.log("Logging Response 1...");
    try {
        await writeLogic(INTERACTION_LOGIC_ID, "LogResponse", "interaction",
            interactionId1,
            "resp_hash_1",
            200,
            ts1 + 5
        );
        console.log("✅ Interaction 1 Complete!");
    } catch (e: any) {
        console.error(`❌ Failed to log response 1: ${e.message}`);
        return false;
    }

    // 4. Log Request 2 (Self-Interaction 2 - Failed)
    console.log("Logging Request 2 (Failure case)...");
    let interactionId2: string;
    try {
        const req2Result = await writeLogic(INTERACTION_LOGIC_ID, "LogRequest", "interaction",
            address, // pass as string, MOI SDK converts to Identifier
            "req_hash_2",
            "payment",
            ts1 + 10,
            "ctx_1", "task_2", "msg_2", "user_1", "sess_1"
        ) as any;

        console.log("LogRequest 2 result structure:", JSON.stringify(req2Result, null, 2));

        interactionId2 = req2Result?.interaction_id
            ?? req2Result?.result?.interaction_id
            ?? req2Result?.output?.interaction_id
            ?? req2Result?.ix_operations?.[0]?.data?.interaction_id
            ?? req2Result?.ix_operations?.[0]?.data?.result?.interaction_id;

        if (!interactionId2) {
            console.error("❌ Failed to extract interaction_id. Full result:", req2Result);
            if (req2Result?.outputs && req2Result?._raw) {
                console.error("   Result is still POLO-encoded. Decoding may have failed.");
            }
            return false;
        }
        console.log(`✅ Got interaction_id: ${interactionId2}`);
    } catch (e: any) {
        console.error(`❌ Failed to log request 2: ${e.message}`);
        return false;
    }

    // 5. Log Response 2
    console.log("Logging Response 2...");
    try {
        await writeLogic(INTERACTION_LOGIC_ID, "LogResponse", "interaction",
            interactionId2,
            "resp_hash_2",
            500, // Error
            ts1 + 15
        );
        console.log("✅ Interaction 2 Complete!");
    } catch (e: any) {
        console.error(`❌ Failed to log response 2: ${e.message}`);
        return false;
    }

    return true;
}

main()
    .then((success) => {
        if (success) {
            console.log("\n========================================");
            console.log("✨ Mock interaction creation SUCCESSFUL!");
            console.log("========================================\n");
            process.exit(0);
        } else {
            console.log("\n========================================");
            console.log("❌ Mock interaction creation FAILED");
            console.log("========================================\n");
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error("\n❌ Unexpected error:", error);
        process.exit(1);
    });
