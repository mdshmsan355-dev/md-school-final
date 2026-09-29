import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrations = fs.readdirSync(path.join(root, "drizzle/migrations")).filter((f) => f.endsWith(".sql")).sort().map((f) => fs.readFileSync(path.join(root, "drizzle/migrations", f), "utf8")).join("\n");

assert.match(migrations, /tenant_row_allowed\(row_school_id uuid\)/);
assert.match(migrations, /row_school_id = public\.current_school_id\(\)/);
assert.match(migrations, /public\.has_role\(auth\.uid\(\), 'admin'\)/);
assert.match(migrations, /Tenant students/);
assert.match(migrations, /Tenant enrollments/);
assert.match(migrations, /Tenant scores/);
assert.match(migrations, /Tenant template settings/);
assert.match(migrations, /REVOKE EXECUTE ON FUNCTION public\.change_username\(text\) FROM PUBLIC, authenticated/);
assert.match(migrations, /guard_open_academic_year/);
assert.match(migrations, /delete_student_safely/);
assert.match(migrations, /issue_result_snapshot/);

const login = fs.readFileSync(path.join(root, "supabase/functions/login-by-username/index.ts"), "utf8");
const change = fs.readFileSync(path.join(root, "supabase/functions/change-username/index.ts"), "utf8");
assert.match(login, /SUPABASE_SECRET_KEY/);
assert.match(login, /auth\/v1\/token\?grant_type=password/);
assert.match(change, /currentPassword/);
assert.match(change, /auth\/v1\/token\?grant_type=password/);

console.log("Md School security static audit: PASS");
console.log("RLS tenant isolation, closed-year guards, username verification and result snapshots are present.");
