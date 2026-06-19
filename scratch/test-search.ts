import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { ResourceModel } from "../backend/src/models/resource.model";
import { MaintenanceTicketModel } from "../backend/src/models/maintenanceTicket.model";

// Load environment variables
dotenv.config();
dotenv.config({ path: path.join(__dirname, "../backend/src/.env"), override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const MOCK_USERS = [
    { id: 'mock-admin',       name: 'System Admin',      email: 'admin@demo.lk',       role: 'admin',       department: 'Faculty of Computing' },
    { id: 'mock-student',     name: 'John Student',      email: 'student@demo.lk',     role: 'student',     department: 'Faculty of Computing' },
    { id: 'mock-lecturer',    name: 'Dr. Smith',         email: 'lecturer@demo.lk',    role: 'lecturer',    department: 'Faculty of Applied Sciences' },
    { id: 'mock-maintenance', name: 'Mike Technician',    email: 'maintenance@demo.lk', role: 'maintenance', department: 'Faculty of Engineering' },
    { id: 'mock-student-2',   name: 'Jane Doe',          email: 'jane@demo.lk',        role: 'student',     department: 'Faculty of Applied Sciences' },
];

async function runTests() {
    console.log("🔍 URMS Search API Integration & Fallback Tests\n");

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ SUPABASE_URL or keys are missing in env");
        process.exit(1);
    }

    console.log(`📡 Connecting to Supabase URL: ${supabaseUrl}`);
    const client = createClient(supabaseUrl, supabaseKey);

    const testQueries = ["Physics", "Computing", "Admin", "AC", "Mike", "Lecture"];

    for (const q of testQueries) {
        console.log(`\n=======================================\n🔎 Testing Search Query: "${q}"\n=======================================`);
        
        // 1. Resources search
        console.log("\n--- Resources Search ---");
        try {
            const { data, error } = await client
                .from("resources")
                .select("*")
                .textSearch("fts", q, { type: "websearch", config: "english" })
                .limit(5);

            if (error) throw error;
            console.log(`✅ FTS index result (${data?.length} matches):`);
            console.log(data?.map(r => `• [${r.type}] ${r.name} - Location: ${r.location}`));
        } catch (err: any) {
            console.log(`⚠️ FTS index query failed: "${err.message}". Trying fallback...`);
            const allResources = await ResourceModel.findAll(client);
            const keywords = q.toLowerCase().split(/\s+/).filter(Boolean);
            const fallbackResults = allResources.filter((r: any) => {
                const combined = `${r.name} ${r.type} ${r.location} ${r.department || ""} ${Array.isArray(r.equipment) ? r.equipment.join(" ") : ""}`.toLowerCase();
                return keywords.every(kw => combined.includes(kw));
            });
            console.log(`ℹ️ Fallback result (${fallbackResults.length} matches):`);
            console.log(fallbackResults.map((r: any) => `• [${r.type}] ${r.name} - Location: ${r.location}`));
        }

        // 2. Maintenance Tickets search
        console.log("\n--- Maintenance Tickets Search ---");
        try {
            const { data, error } = await client
                .from("maintenance_tickets")
                .select(`
                    *,
                    resources:resource_id (
                        name
                    )
                `)
                .textSearch("fts", q, { type: "websearch", config: "english" })
                .limit(5);

            if (error) throw error;
            console.log(`✅ FTS index result (${data?.length} matches):`);
            console.log(data?.map((t: any) => `• Title: ${t.title} - Status: ${t.status} - Resource: ${t.resources?.name}`));
        } catch (err: any) {
            console.log(`⚠️ FTS index query failed: "${err.message}". Trying fallback...`);
            const allTickets = await MaintenanceTicketModel.findAll({}, client);
            const keywords = q.toLowerCase().split(/\s+/).filter(Boolean);
            const fallbackResults = allTickets.filter((t: any) => {
                const combined = `${t.title} ${t.description || ""} ${t.priority} ${t.status} ${t.outcome || ""} ${t.resourceName || ""}`.toLowerCase();
                return keywords.every(kw => combined.includes(kw));
            });
            console.log(`ℹ️ Fallback result (${fallbackResults.length} matches):`);
            console.log(fallbackResults.map((t: any) => `• Title: ${t.title} - Status: ${t.status} - Resource: ${t.resourceName}`));
        }

        // 3. Users search
        console.log("\n--- Users Search ---");
        try {
            const { data, error } = await client
                .from("users")
                .select("*")
                .textSearch("fts", q, { type: "websearch", config: "english" })
                .limit(5);

            if (error) throw error;
            console.log(`✅ FTS index result (${data?.length} matches):`);
            console.log(data?.map((u: any) => `• ${u.name} (${u.email}) - Role: ${u.role}`));
        } catch (err: any) {
            console.log(`⚠️ FTS index query failed: "${err.message}". Trying fallback...`);
            const { data: users, error: userErr } = await client.from("users").select("*");
            const keywords = q.toLowerCase().split(/\s+/).filter(Boolean);
            let userList = users || [];
            if (userErr) {
                console.log("⚠️ Failed to query users table, using mock users list");
                userList = MOCK_USERS;
            }
            const fallbackResults = userList.filter((u: any) => {
                const combined = `${u.name} ${u.email} ${u.role} ${u.department || ""}`.toLowerCase();
                return keywords.every(kw => combined.includes(kw));
            });
            console.log(`ℹ️ Fallback result (${fallbackResults.length} matches):`);
            console.log(fallbackResults.map((u: any) => `• ${u.name} (${u.email}) - Role: ${u.role}`));
        }
    }

    console.log("\n🎉 Verification execution completed successfully.");
}

runTests();
