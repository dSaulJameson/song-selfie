import postgres from "postgres";

import type { SongRequestInput } from "@/lib/schema";
import { getDatabaseUrl } from "@/lib/env";
import { slugify } from "@/lib/utils";

export type VenueRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerClerkUserId: string;
  contactEmail: string;
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  venueSharePercent: number;
  priceCents: number;
  allowExplicitContent: boolean;
  allowKidsMode: boolean;
  payoutMethod: string | null;
  payoutDetails: Record<string, unknown> | null;
  payoutUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertVenueInput = {
  name: string;
  slug: string;
  description?: string;
  contactEmail: string;
  priceCents: number;
  venueSharePercent: number;
  allowExplicitContent?: boolean;
  allowKidsMode?: boolean;
  ownerClerkUserId?: string;
};

export type SongOrderRecord = {
  id: string;
  venueId: string;
  checkoutSessionId: string | null;
  paymentIntentId: string | null;
  customerEmail: string;
  status: string;
  amountTotal: number | null;
  currency: string | null;
  rawInputs: SongRequestInput;
  generatedPrompt: string | null;
  finetuneGenerationId: string | null;
  finetuneRequest: Record<string, unknown> | null;
  finetuneResponse: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  songUrl: string | null;
  s3Key: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  emailedAt: string | null;
};

let sqlClient: postgres.Sql | null = null;
let databaseReady: Promise<void> | null = null;

function parseJsonField<T>(value: T | string | null | undefined, fallback: T) {
  if (typeof value !== "string") {
    return (value ?? fallback) as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeOrderRecord(record: SongOrderRecord) {
  return {
    ...record,
    rawInputs: parseJsonField<SongRequestInput>(
      record.rawInputs,
      record.rawInputs as SongRequestInput,
    ),
    finetuneRequest: parseJsonField<Record<string, unknown> | null>(
      record.finetuneRequest,
      record.finetuneRequest ?? null,
    ),
    finetuneResponse: parseJsonField<Record<string, unknown> | null>(
      record.finetuneResponse,
      record.finetuneResponse ?? null,
    ),
    metadata: parseJsonField<Record<string, unknown> | null>(
      record.metadata,
      record.metadata ?? null,
    ),
  } satisfies SongOrderRecord;
}

function normalizeOrderRecords(records: SongOrderRecord[]) {
  return records.map(normalizeOrderRecord);
}

function getSql() {
  if (!sqlClient) {
    const databaseUrl = getDatabaseUrl();
    const databaseHost = new URL(databaseUrl).hostname.toLowerCase();
    const useSsl = ![
      "hosthatch-postgres",
      "localhost",
      "127.0.0.1",
      "::1",
    ].includes(databaseHost);

    sqlClient = postgres(databaseUrl, {
      ssl: useSsl ? "require" : false,
      max: 5,
      idle_timeout: 20,
    });
  }

  return sqlClient;
}

export async function checkDatabaseConnection() {
  const sql = getSql();
  const rows = await sql.unsafe<{ ok: number }[]>("select 1 as ok");
  return rows[0]?.ok === 1;
}

function mapVenueColumns() {
  return `
    id,
    name,
    slug,
    description,
    owner_clerk_user_id as "ownerClerkUserId",
    contact_email as "contactEmail",
    stripe_account_id as "stripeAccountId",
    stripe_charges_enabled as "stripeChargesEnabled",
    stripe_payouts_enabled as "stripePayoutsEnabled",
    venue_share_percent as "venueSharePercent",
    price_cents as "priceCents",
    allow_explicit_content as "allowExplicitContent",
    allow_kids_mode as "allowKidsMode",
    payout_method as "payoutMethod",
    payout_details as "payoutDetails",
    payout_updated_at as "payoutUpdatedAt",
    created_at as "createdAt",
    updated_at as "updatedAt"
  `;
}

function mapOrderColumns(tableAlias?: string) {
  const prefix = tableAlias ? `${tableAlias}.` : "";

  return `
    ${prefix}id,
    ${prefix}venue_id as "venueId",
    ${prefix}checkout_session_id as "checkoutSessionId",
    ${prefix}payment_intent_id as "paymentIntentId",
    ${prefix}customer_email as "customerEmail",
    ${prefix}status,
    ${prefix}amount_total as "amountTotal",
    ${prefix}currency,
    ${prefix}raw_inputs as "rawInputs",
    ${prefix}generated_prompt as "generatedPrompt",
    ${prefix}finetune_generation_id as "finetuneGenerationId",
    ${prefix}finetune_request as "finetuneRequest",
    ${prefix}finetune_response as "finetuneResponse",
    ${prefix}metadata,
    ${prefix}song_url as "songUrl",
    ${prefix}s3_key as "s3Key",
    ${prefix}error_message as "errorMessage",
    ${prefix}created_at as "createdAt",
    ${prefix}updated_at as "updatedAt",
    ${prefix}completed_at as "completedAt",
    ${prefix}emailed_at as "emailedAt"
  `;
}

export async function ensureDatabase() {
  if (!databaseReady) {
    const sql = getSql();
    databaseReady = (async () => {
      await sql.unsafe(`
        create table if not exists venues (
          id text primary key,
          name text not null,
          slug text not null unique,
          description text,
          owner_clerk_user_id text not null,
          contact_email text not null,
          stripe_account_id text,
          stripe_charges_enabled boolean not null default false,
          stripe_payouts_enabled boolean not null default false,
          venue_share_percent integer not null default 70 check (venue_share_percent between 0 and 100),
          price_cents integer not null default 2500 check (price_cents >= 0),
          allow_explicit_content boolean not null default true,
          allow_kids_mode boolean not null default false,
          payout_method text,
          payout_details jsonb,
          payout_updated_at timestamptz,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );

        create table if not exists song_orders (
          id text primary key,
          venue_id text not null references venues(id) on delete cascade,
          checkout_session_id text unique,
          payment_intent_id text,
          customer_email text not null,
          status text not null default 'draft',
          amount_total integer,
          currency text,
          raw_inputs jsonb not null,
          generated_prompt text,
          finetune_generation_id text,
          finetune_request jsonb,
          finetune_response jsonb,
          metadata jsonb not null default '{}'::jsonb,
          song_url text,
          s3_key text,
          error_message text,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          completed_at timestamptz,
          emailed_at timestamptz
        );

        create index if not exists song_orders_status_idx on song_orders(status, created_at);
        create index if not exists song_orders_venue_idx on song_orders(venue_id, created_at desc);

        do $$
        begin
          if exists (
            select 1
            from pg_constraint
            where conname = 'venues_price_cents_check'
          ) then
            alter table venues drop constraint venues_price_cents_check;
          end if;
        exception when undefined_table then
          null;
        end $$;

        alter table venues
        add constraint venues_price_cents_check check (price_cents >= 0);

        do $$
        begin
          if exists (
            select 1
            from pg_constraint
            where conname = 'venues_venue_share_percent_check'
          ) then
            alter table venues drop constraint venues_venue_share_percent_check;
          end if;
        exception when undefined_table then
          null;
        end $$;

        alter table venues
        alter column venue_share_percent set default 70;

        alter table venues
        add constraint venues_venue_share_percent_check
        check (venue_share_percent between 0 and 100);

        alter table venues
        add column if not exists allow_explicit_content boolean not null default true;

        alter table venues
        add column if not exists allow_kids_mode boolean not null default true;

        alter table venues
        alter column allow_kids_mode set default false;

        alter table venues
        add column if not exists payout_method text;

        alter table venues
        add column if not exists payout_details jsonb;

        alter table venues
        add column if not exists payout_updated_at timestamptz;
      `);
    })();
  }

  await databaseReady;
}

export async function listVenuesByOwner(ownerClerkUserId: string) {
  await ensureDatabase();
  const sql = getSql();
  return sql.unsafe<VenueRecord[]>(
    `select ${mapVenueColumns()} from venues where owner_clerk_user_id = $1 order by created_at desc`,
    [ownerClerkUserId],
  );
}

export async function listVenuesByContactEmail(contactEmail: string) {
  await ensureDatabase();
  const sql = getSql();
  return sql.unsafe<VenueRecord[]>(
    `
      select ${mapVenueColumns()}
      from venues
      where lower(contact_email) = lower($1)
      order by created_at desc
    `,
    [contactEmail],
  );
}

export async function listAllVenues() {
  await ensureDatabase();
  const sql = getSql();
  return sql.unsafe<VenueRecord[]>(
    `select ${mapVenueColumns()} from venues order by created_at desc`,
  );
}

export async function getVenueById(id: string) {
  await ensureDatabase();
  const sql = getSql();
  const rows = await sql.unsafe<VenueRecord[]>(
    `select ${mapVenueColumns()} from venues where id = $1 limit 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function getVenueBySlug(slug: string) {
  await ensureDatabase();
  const sql = getSql();
  const rows = await sql.unsafe<VenueRecord[]>(
    `select ${mapVenueColumns()} from venues where slug = $1 limit 1`,
    [slug],
  );
  return rows[0] ?? null;
}

export async function renameVenueSlugIfAvailable(params: {
  oldSlug: string;
  newSlug: string;
  name?: string;
}) {
  await ensureDatabase();
  const sql = getSql();
  const normalizedOldSlug = slugify(params.oldSlug);
  const normalizedNewSlug = slugify(params.newSlug);

  if (!normalizedOldSlug || !normalizedNewSlug || normalizedOldSlug === normalizedNewSlug) {
    return null;
  }

  const rows = await sql.unsafe<VenueRecord[]>(
    `
      update venues
      set slug = $2,
          name = case when $3::text is null then name else $3::text end,
          updated_at = now()
      where slug = $1
        and not exists (
          select 1 from venues existing where existing.slug = $2
        )
      returning ${mapVenueColumns()}
    `,
    [normalizedOldSlug, normalizedNewSlug, params.name ?? null],
  );

  return rows[0] ?? null;
}

export async function createVenueRecord(input: UpsertVenueInput) {
  await ensureDatabase();
  const sql = getSql();
  const normalizedSlug = slugify(input.slug || input.name);
  const id = crypto.randomUUID();
  const normalizedEmail = input.contactEmail.trim().toLowerCase();
  const ownerKey =
    input.ownerClerkUserId?.trim() || `email:${normalizedEmail}`;

  const rows = await sql.unsafe<VenueRecord[]>(
    `
      insert into venues (
        id,
        name,
        slug,
        description,
        owner_clerk_user_id,
        contact_email,
        price_cents,
        venue_share_percent,
        allow_explicit_content,
        allow_kids_mode
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      returning ${mapVenueColumns()}
    `,
    [
      id,
      input.name,
      normalizedSlug,
      input.description || null,
      ownerKey,
      normalizedEmail,
      input.priceCents,
      input.venueSharePercent,
      input.allowExplicitContent ?? true,
      input.allowKidsMode ?? false,
    ],
  );

  return rows[0];
}

export async function createSelfServeVenueRecord(input: {
  name: string;
  contactEmail: string;
  description?: string;
  priceCents?: number;
  venueSharePercent?: number;
  allowExplicitContent?: boolean;
  allowKidsMode?: boolean;
}) {
  await ensureDatabase();
  const baseSlug = (slugify(input.name) || "venue").slice(0, 56);
  let slug = baseSlug;

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const existing = await getVenueBySlug(slug);
    if (!existing) {
      break;
    }

    slug = `${baseSlug}-${suffix}`.slice(0, 64);
  }

  return createVenueRecord({
    name: input.name,
    slug,
    description: input.description ?? "Song Selfie venue page",
    contactEmail: input.contactEmail,
    priceCents: input.priceCents ?? 100,
    venueSharePercent: input.venueSharePercent ?? 70,
    allowExplicitContent: input.allowExplicitContent ?? true,
    allowKidsMode: input.allowKidsMode ?? false,
  });
}

export async function upsertVenueRecord(input: UpsertVenueInput) {
  await ensureDatabase();
  const sql = getSql();
  const normalizedSlug = slugify(input.slug || input.name);
  const normalizedEmail = input.contactEmail.trim().toLowerCase();
  const ownerKey =
    input.ownerClerkUserId?.trim() || `email:${normalizedEmail}`;

  const rows = await sql.unsafe<VenueRecord[]>(
    `
      insert into venues (
        id,
        name,
        slug,
        description,
        owner_clerk_user_id,
        contact_email,
        price_cents,
        venue_share_percent,
        allow_explicit_content,
        allow_kids_mode
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      on conflict (slug) do update
      set name = excluded.name,
          description = excluded.description,
          owner_clerk_user_id = excluded.owner_clerk_user_id,
          contact_email = excluded.contact_email,
          price_cents = excluded.price_cents,
          venue_share_percent = excluded.venue_share_percent,
          allow_explicit_content = excluded.allow_explicit_content,
          allow_kids_mode = excluded.allow_kids_mode,
          updated_at = now()
      returning ${mapVenueColumns()}
    `,
    [
      crypto.randomUUID(),
      input.name,
      normalizedSlug,
      input.description || null,
      ownerKey,
      normalizedEmail,
      input.priceCents,
      input.venueSharePercent,
      input.allowExplicitContent ?? true,
      input.allowKidsMode ?? false,
    ],
  );

  return rows[0];
}

export async function updateVenueSharePercent(venueId: string, venueSharePercent: number) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(
    `
      update venues
      set venue_share_percent = $2, updated_at = now()
      where id = $1
    `,
    [venueId, venueSharePercent],
  );
}

export async function updateVenuePrice(venueId: string, priceCents: number) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(
    `
      update venues
      set price_cents = $2, updated_at = now()
      where id = $1
    `,
    [venueId, priceCents],
  );
}

export async function updateVenueContentSettings(params: {
  venueId: string;
  allowExplicitContent: boolean;
  allowKidsMode: boolean;
}) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(
    `
      update venues
      set allow_explicit_content = $2,
          allow_kids_mode = $3,
          updated_at = now()
      where id = $1
    `,
    [params.venueId, params.allowExplicitContent, params.allowKidsMode],
  );
}

export async function updateVenuePayoutDetails(params: {
  venueId: string;
  payoutMethod: "bank-transfer" | "check";
  payoutDetails: Record<string, unknown>;
}) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(
    `
      update venues
      set payout_method = $2,
          payout_details = $3::jsonb,
          payout_updated_at = now(),
          updated_at = now()
      where id = $1
    `,
    [params.venueId, params.payoutMethod, JSON.stringify(params.payoutDetails)],
  );
}

export async function saveVenueStripeAccount(venueId: string, accountId: string) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(
    `
      update venues
      set stripe_account_id = $2, updated_at = now()
      where id = $1
    `,
    [venueId, accountId],
  );
}

export async function updateVenueStripeStatus(params: {
  venueId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(
    `
      update venues
      set stripe_charges_enabled = $2,
          stripe_payouts_enabled = $3,
          updated_at = now()
      where id = $1
    `,
    [params.venueId, params.chargesEnabled, params.payoutsEnabled],
  );
}

export async function createDraftOrder(params: {
  venueId: string;
  customerEmail: string;
  rawInputs: SongRequestInput;
  metadata?: Record<string, unknown>;
}) {
  await ensureDatabase();
  const sql = getSql();
  const id = crypto.randomUUID();
  const rows = await sql.unsafe<SongOrderRecord[]>(
    `
      insert into song_orders (
        id,
        venue_id,
        customer_email,
        status,
        raw_inputs,
        metadata
      )
      values ($1, $2, $3, 'checkout_created', $4::jsonb, $5::jsonb)
      returning ${mapOrderColumns()}
    `,
    [
      id,
      params.venueId,
      params.customerEmail,
      JSON.stringify(params.rawInputs),
      JSON.stringify(params.metadata ?? {}),
    ],
  );
  return normalizeOrderRecord(rows[0]);
}

export async function updateOrderCheckoutSession(orderId: string, checkoutSessionId: string) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(
    `
      update song_orders
      set checkout_session_id = $2,
          updated_at = now()
      where id = $1
    `,
    [orderId, checkoutSessionId],
  );
}

export async function getOrderById(orderId: string) {
  await ensureDatabase();
  const sql = getSql();
  const rows = await sql.unsafe<SongOrderRecord[]>(
    `select ${mapOrderColumns()} from song_orders where id = $1 limit 1`,
    [orderId],
  );
  return rows[0] ? normalizeOrderRecord(rows[0]) : null;
}

export async function getOrderByCheckoutSessionId(checkoutSessionId: string) {
  await ensureDatabase();
  const sql = getSql();
  const rows = await sql.unsafe<SongOrderRecord[]>(
    `select ${mapOrderColumns()} from song_orders where checkout_session_id = $1 limit 1`,
    [checkoutSessionId],
  );
  return rows[0] ? normalizeOrderRecord(rows[0]) : null;
}

export async function markOrderPaidAndQueued(params: {
  orderId: string;
  checkoutSessionId: string;
  paymentIntentId?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  metadata: Record<string, unknown>;
  rawInputs: SongRequestInput;
}) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(
    `
      update song_orders
      set checkout_session_id = $2,
          payment_intent_id = $3,
          amount_total = $4,
          currency = $5,
          metadata = $6::jsonb,
          raw_inputs = $7::jsonb,
          status = 'queued',
          updated_at = now()
      where id = $1
    `,
    [
      params.orderId,
      params.checkoutSessionId,
      params.paymentIntentId ?? null,
      params.amountTotal ?? null,
      params.currency ?? "usd",
      JSON.stringify(params.metadata),
      JSON.stringify(params.rawInputs),
    ],
  );
}

export async function countProcessingOrders() {
  await ensureDatabase();
  const sql = getSql();
  const rows = await sql.unsafe<{ count: string }[]>(
    `select count(*)::text as count from song_orders where status = 'processing'`,
  );
  return Number(rows[0]?.count ?? 0);
}

export async function listStaleProcessingOrders(params?: {
  olderThanMinutes?: number;
  limit?: number;
}) {
  await ensureDatabase();
  const sql = getSql();
  const olderThanMinutes = Math.max(1, params?.olderThanMinutes ?? 5);
  const limit = Math.max(1, params?.limit ?? 20);
  const rows = await sql.unsafe<SongOrderRecord[]>(
    `
      select ${mapOrderColumns()}
      from song_orders
      where status = 'processing'
        and updated_at < now() - make_interval(mins => $1)
      order by updated_at asc
      limit $2
    `,
    [olderThanMinutes, limit],
  );

  return normalizeOrderRecords(rows);
}

export async function listCompletedOrdersMissingEmail(limit = 20) {
  await ensureDatabase();
  const sql = getSql();
  const rows = await sql.unsafe<SongOrderRecord[]>(
    `
      select ${mapOrderColumns()}
      from song_orders
      where status = 'completed'
        and emailed_at is null
        and song_url is not null
      order by completed_at asc nulls last, updated_at asc
      limit $1
    `,
    [Math.max(1, limit)],
  );

  return normalizeOrderRecords(rows);
}

export async function tryAcquireQueueLock(lockId: number) {
  await ensureDatabase();
  const sql = getSql();
  const rows = await sql.unsafe<{ locked: boolean }[]>(
    `select pg_try_advisory_lock($1) as locked`,
    [lockId],
  );
  return rows[0]?.locked ?? false;
}

export async function releaseQueueLock(lockId: number) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(`select pg_advisory_unlock($1)`, [lockId]);
}

export async function claimQueuedOrders(limit: number) {
  await ensureDatabase();
  const sql = getSql();
  const rows = await sql.unsafe<SongOrderRecord[]>(
    `
      with next_jobs as (
        select id
        from song_orders
        where status = 'queued'
        order by created_at asc
        limit $1
        for update skip locked
      )
      update song_orders as so
      set status = 'processing',
          updated_at = now()
      from next_jobs
      where so.id = next_jobs.id
      returning ${mapOrderColumns("so")}
    `,
    [limit],
  );

  return normalizeOrderRecords(rows);
}

export async function requeueProcessingOrderWithoutGeneration(orderId: string) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(
    `
      update song_orders
      set status = 'queued',
          generated_prompt = null,
          finetune_generation_id = null,
          finetune_request = null,
          error_message = null,
          updated_at = now()
      where id = $1
        and status = 'processing'
        and finetune_generation_id is null
    `,
    [orderId],
  );
}

export async function updateOrderGenerationState(params: {
  orderId: string;
  generatedPrompt: string;
  finetuneGenerationId: string;
  finetuneRequest: Record<string, unknown>;
}) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(
    `
      update song_orders
      set generated_prompt = $2,
          finetune_generation_id = $3,
          finetune_request = $4::jsonb,
          updated_at = now()
      where id = $1
    `,
    [
      params.orderId,
      params.generatedPrompt,
      params.finetuneGenerationId,
      JSON.stringify(params.finetuneRequest),
    ],
  );
}

export async function completeOrder(params: {
  orderId: string;
  songUrl: string;
  s3Key: string;
  finetuneResponse: Record<string, unknown>;
}) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(
    `
      update song_orders
      set song_url = $2,
          s3_key = $3,
          finetune_response = $4::jsonb,
          status = 'completed',
          completed_at = now(),
          updated_at = now()
      where id = $1
    `,
    [
      params.orderId,
      params.songUrl,
      params.s3Key,
      JSON.stringify(params.finetuneResponse),
    ],
  );
}

export async function markOrderEmailed(orderId: string) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(
    `
      update song_orders
      set emailed_at = now(),
          updated_at = now()
      where id = $1
    `,
    [orderId],
  );
}

export async function mergeOrderMetadata(
  orderId: string,
  patch: Record<string, unknown>,
) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(
    `
      update song_orders
      set metadata = coalesce(metadata, '{}'::jsonb) || $2::jsonb,
          updated_at = now()
      where id = $1
    `,
    [orderId, JSON.stringify(patch)],
  );
}

export async function failOrder(orderId: string, errorMessage: string) {
  await ensureDatabase();
  const sql = getSql();
  await sql.unsafe(
    `
      update song_orders
      set status = 'failed',
          error_message = $2,
          updated_at = now()
      where id = $1
    `,
    [orderId, errorMessage],
  );
}

export async function listOrdersForVenueIds(venueIds: string[]) {
  await ensureDatabase();
  if (venueIds.length === 0) {
    return [] as SongOrderRecord[];
  }

  const sql = getSql();
  const rows = await sql.unsafe<SongOrderRecord[]>(
    `select ${mapOrderColumns()} from song_orders where venue_id = any($1) order by created_at desc`,
    [venueIds],
  );

  return normalizeOrderRecords(rows);
}

export async function listRecentCompletedOrdersForVenue(venueId: string, limit = 6) {
  await ensureDatabase();
  const sql = getSql();
  const rows = await sql.unsafe<SongOrderRecord[]>(
    `
      select ${mapOrderColumns()}
      from song_orders
      where venue_id = $1 and status = 'completed'
      order by completed_at desc nulls last
      limit $2
    `,
    [venueId, limit],
  );

  return normalizeOrderRecords(rows);
}

export async function listRecentCompletedS3Orders(limit = 10) {
  await ensureDatabase();
  const sql = getSql();
  const rows = await sql.unsafe<SongOrderRecord[]>(
    `
      select ${mapOrderColumns()}
      from song_orders
      where status = 'completed'
        and song_url is not null
        and s3_key is not null
      order by completed_at desc nulls last, updated_at desc
      limit $1
    `,
    [Math.max(1, limit)],
  );

  return normalizeOrderRecords(rows);
}

export async function listAllOrders(limit = 50) {
  await ensureDatabase();
  const sql = getSql();
  const rows = await sql.unsafe<SongOrderRecord[]>(
    `select ${mapOrderColumns()} from song_orders order by created_at desc limit $1`,
    [limit],
  );

  return normalizeOrderRecords(rows);
}
