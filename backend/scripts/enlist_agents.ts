#!/usr/bin/env tsx
import { initializeMOI, readLogic, writeLogic, IDENTITY_LOGIC_ID, INTERACTION_LOGIC_ID } from '../src/lib/moi-client.js';

async function main() {
    console.log('========================================');
    console.log('Enlist Agents on InteractionLogic');
    console.log('========================================\n');

    if (!IDENTITY_LOGIC_ID || !INTERACTION_LOGIC_ID) {
        console.error('❌ IDs not set');
        process.exit(1);
    }

    await initializeMOI();

    console.log('📋 Fetching registered agents from IdentityLogic...');
    try {
        const idsResult = await readLogic(null, IDENTITY_LOGIC_ID, 'GetAllAgentIds', 'identity') as any;
        const agentIds: string[] = idsResult?.output?.ids ?? idsResult?.ids ?? [];
        console.log(`Found ${agentIds.length} agents: ${agentIds.join(', ')}\n`);

        if (agentIds.length === 0) {
            console.log('⚠️  No agents to enlist.');
            return;
        }

        console.log('📝 Enlisting agents on InteractionLogic...\n');
        for (const id of agentIds) {
            try {
                process.stdout.write(`  Enlisting ${id}... `);
                await writeLogic(INTERACTION_LOGIC_ID, "Enlist", "interaction", id);
                console.log(`✅`);
            } catch (e: any) {
                // If already enlisted, it might revert or error. Check message.
                const msg = e.message || String(e);
                if (msg.includes('already')) {
                    console.log(`⚠️  (Already enlisted)`);
                } else {
                    console.log(`❌ ${msg}`);
                }
            }
        }
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

main();
