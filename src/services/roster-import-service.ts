import * as XLSX from "xlsx";
import { getDb } from "@/lib/db";
import { TeamMemberRepository } from "@/repositories/team-member-repository";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { TeamRepository } from "@/repositories/team-repository";
import type { AppUser } from "@/lib/auth";

// Row-level result returned from parsing/validation.
// 'valid'     — row is ready to import
// 'error'     — row has a validation problem (missing required field, bad format)
// 'duplicate' — email already exists on this team; skipped, shown as info
export type RowStatus = "valid" | "error" | "duplicate";

export interface ValidatedRow {
  rowNumber: number;
  status: RowStatus;
  email: string;
  name: string;
  jerseyNumber: number | null;
  dateOfBirth: string | null;
  phone: string | null;
  playerId: string | null;
  errors: string[];
}

export interface ImportResult {
  imported: number;
  alreadyHadAccount: number;
}

// Normalise column headers from the file: lowercase, trim, replace spaces/dashes with underscores.
function normaliseKey(raw: string): string {
  return raw.toLowerCase().trim().replace(/[\s\-]+/g, "_");
}

// Validate and normalise an ISO or US-formatted date string.
// Accepts: YYYY-MM-DD, MM/DD/YYYY, M/D/YYYY
// Returns ISO YYYY-MM-DD or null if unparseable.
function parseDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // US format MM/DD/YYYY or M/D/YYYY
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const [, m, d, y] = us;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

// Basic email format check.
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Coerce a cell value to a plain string.
// With cellDates: true, xlsx returns Date objects for date-like cells.
// Serialize them as ISO YYYY-MM-DD so parseDate sees the right format.
function cellToString(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

// Parse a file buffer into rows of key→value records.
// Supports .csv (plain text) and .xlsx (Excel).
// cellDates: true tells xlsx to return Date objects instead of Excel serial
// numbers for date-like cells — prevents "36600" from appearing as a DOB.
function parseFile(
  buffer: ArrayBuffer,
  filename: string,
): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // header: 1 → returns array of arrays; we map manually for case-insensitive keys
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  if (raw.length < 2) return [];

  const headers = (raw[0] as unknown[]).map((h) => normaliseKey(cellToString(h)));
  return raw.slice(1).map((row) => {
    const cells = row as unknown[];
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = cellToString(cells[i]);
    });
    return record;
  });
}

export class RosterImportService {
  constructor(
    private readonly members: TeamMemberRepository,
    private readonly teams: TeamRepository,
  ) {}

  // Parse and validate a file. Returns per-row results without writing to DB.
  // Checks for duplicates against the current team roster.
  async parseAndValidate(
    buffer: ArrayBuffer,
    filename: string,
    teamId: string,
    currentUser: AppUser,
  ): Promise<ValidatedRow[]> {
    const team = await this.teams.findById(teamId);
    if (!team) throw new NotFoundError("Team", teamId);
    if (currentUser.role !== "admin" && team.coachId !== currentUser.id) {
      throw new ForbiddenError("importRoster");
    }

    let rawRows: Record<string, string>[];
    try {
      rawRows = parseFile(buffer, filename);
    } catch {
      throw new ValidationError("file", "Could not parse the file. Make sure it is a valid CSV or Excel file.");
    }

    if (rawRows.length === 0) {
      throw new ValidationError("file", "The file is empty or has no data rows.");
    }

    // Build a set of emails already on this team for duplicate detection.
    const existing = await this.members.listByTeam(teamId);
    const existingEmails = new Set(
      existing
        .map((m) => m.email?.toLowerCase())
        .filter(Boolean) as string[],
    );
    // Also check users who joined by account (email is null on the row — look them up differently)
    // We'll treat any email collision with the full roster as a duplicate.

    const results: ValidatedRow[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNumber = i + 2; // +2: 1-based + header row
      const errors: string[] = [];

      // --- Required fields ---
      const rawEmail = (row["email"] ?? "").trim();
      const rawName = (row["name"] ?? row["full_name"] ?? row["player_name"] ?? "").trim();

      if (!rawEmail) {
        errors.push("Email is required");
      } else if (!isValidEmail(rawEmail)) {
        errors.push(`Invalid email format: "${rawEmail}"`);
      }

      if (!rawName) {
        errors.push("Name is required");
      }

      // --- Optional fields ---
      const rawJersey = (row["jersey_number"] ?? row["jersey"] ?? row["number"] ?? "").trim();
      let jerseyNumber: number | null = null;
      if (rawJersey !== "") {
        const parsed = parseInt(rawJersey, 10);
        if (isNaN(parsed) || parsed <= 0) {
          errors.push(`Jersey number must be a positive integer, got "${rawJersey}"`);
        } else {
          jerseyNumber = parsed;
        }
      }

      const rawDob = (row["date_of_birth"] ?? row["dob"] ?? row["birthdate"] ?? "").trim();
      const dateOfBirth = rawDob ? parseDate(rawDob) : null;
      if (rawDob && !dateOfBirth) {
        errors.push(`Could not parse date of birth: "${rawDob}". Use YYYY-MM-DD or MM/DD/YYYY.`);
      }

      const phone = (row["phone"] ?? row["phone_number"] ?? "").trim() || null;
      const playerId = (row["player_id"] ?? row["state_id"] ?? "").trim() || null;

      // --- Duplicate check ---
      const emailKey = rawEmail.toLowerCase();
      if (errors.length === 0 && existingEmails.has(emailKey)) {
        results.push({
          rowNumber,
          status: "duplicate",
          email: rawEmail,
          name: rawName,
          jerseyNumber,
          dateOfBirth,
          phone,
          playerId,
          errors: ["This email is already on the team roster"],
        });
        continue;
      }

      // Track to catch in-file duplicates
      if (errors.length === 0) {
        existingEmails.add(emailKey);
      }

      results.push({
        rowNumber,
        status: errors.length > 0 ? "error" : "valid",
        email: rawEmail,
        name: rawName,
        jerseyNumber,
        dateOfBirth,
        phone,
        playerId,
        errors,
      });
    }

    return results;
  }

  // Commit validated rows to the database.
  // Only inserts rows with status = 'valid'. Checks if the email belongs to an existing account.
  async commitImport(
    validRows: ValidatedRow[],
    teamId: string,
    currentUser: AppUser,
    db: ReturnType<typeof getDb>,
  ): Promise<ImportResult> {
    const team = await this.teams.findById(teamId);
    if (!team) throw new NotFoundError("Team", teamId);
    if (currentUser.role !== "admin" && team.coachId !== currentUser.id) {
      throw new ForbiddenError("importRoster");
    }

    const rows = validRows.filter((r) => r.status === "valid");
    if (rows.length === 0) return { imported: 0, alreadyHadAccount: 0 };

    // For each email, check if an account exists in the Better Auth user table.
    const resolved = await Promise.all(
      rows.map(async (row) => {
        const user = await db.$client
          .prepare("SELECT id FROM user WHERE LOWER(email) = LOWER(?)")
          .bind(row.email)
          .first<{ id: string }>();
        return { ...row, userId: user?.id ?? null };
      }),
    );

    await this.members.bulkInsertImported(
      resolved.map((r) => ({
        teamId,
        email: r.email,
        displayName: r.name,
        jerseyNumber: r.jerseyNumber,
        dateOfBirth: r.dateOfBirth,
        phone: r.phone,
        playerId: r.playerId,
        userId: r.userId,
      })),
    );

    const alreadyHadAccount = resolved.filter((r) => r.userId !== null).length;
    return { imported: resolved.length, alreadyHadAccount };
  }
}

export function makeRosterImportService(): RosterImportService {
  const db = getDb();
  return new RosterImportService(new TeamMemberRepository(db), new TeamRepository(db));
}
