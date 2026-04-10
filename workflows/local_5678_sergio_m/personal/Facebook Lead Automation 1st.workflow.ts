import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Facebook Lead Automation 1st
// Nodes   : 7  |  Connections: 8
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// FacebookLeadAdsTrigger             facebookLeadAdsTrigger     [creds]
// TransformForLeadIntake             code
// AppendRowInSheet                   googleSheets               [creds]
// CallLeadIntake                     httpRequest                [onError→out(1)]
// NotifyLeadIntakeError              gmail                      [creds]
// SendAMessage                       gmail                      [creds]
// NotifyMe                           gmail                      [creds]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// FacebookLeadAdsTrigger
//    → TransformForLeadIntake
//      → AppendRowInSheet
//        → CallLeadIntake
//          → SendAMessage
//            → NotifyMe
//         .out(1) → NotifyLeadIntakeError
//
// FACEBOOK SETUP CHECKLIST
// ──────────────────────────────────────────────────────────────────
// 1. Create a Meta App at developers.facebook.com
//    - Add "Facebook Login" + "Leads Access" products
//    - Set the webhook URL to your n8n instance + /webhook/facebook-lead-ads
//    - Subscribe to the "leadgen" webhook field on your Page
//
// 2. In your Facebook Lead Ad form, add these fields with EXACT keys:
//    - full_name       (built-in)
//    - email           (built-in)
//    - phone_number    (built-in)
//    - monthly_salary  (custom — Short Answer, label: "Monthly Salary (TTD $)")
//    - location        (custom — Multiple Choice or Short Answer, label: "Your Parish")
//      Choices: Port of Spain / San Fernando / Chaguanas / Arima /
//               Point Fortin / Sangre Grande / Siparia / Tobago
//
// 3. In n8n, create a "Facebook Lead Ads" credential (OAuth2) and
//    replace the placeholder credential ID below with the real one.
//
// 4. Add two new columns to the Google Sheet (Sheet1):
//    "monthly salary (TTD)" and "location"
// ──────────────────────────────────────────────────────────────────
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'C9qkiVTqFoBHu88o',
    name: 'Facebook Lead Automation 1st',
    active: false,
    settings: {
        executionOrder: 'v1',
        callerPolicy: 'workflowsFromSameOwner',
        availableInMCP: false,
    },
})
export class FacebookLeadAutomation1stWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    /**
     * Native Facebook Lead Ads trigger.
     * n8n handles the Meta webhook handshake and fetches full lead data
     * from the Graph API automatically. Output item shape:
     * {
     *   id: string,           // Meta leadgen ID
     *   form_id: string,
     *   ad_id: string,
     *   page_id: string,
     *   created_time: string,
     *   field_data: Array<{ name: string, values: string[] }>
     * }
     *
     * SETUP: Replace credential ID 'REPLACE_ME' with your real Facebook
     * Lead Ads OAuth2 credential ID from n8n Credentials.
     */
    @node({
        id: '2a6caae0-54f6-4a22-8216-ded010dafc0f',
        name: 'Facebook Lead Ads Trigger',
        type: 'n8n-nodes-base.facebookLeadAdsTrigger',
        version: 1,
        position: [-400, 80],
        credentials: { facebookLeadAdsOAuth2Api: { id: 'REPLACE_ME', name: 'Facebook Lead Ads account' } },
    })
    FacebookLeadAdsTrigger = {};

    /**
     * Parses Facebook's field_data array and produces a single clean item
     * that all downstream nodes reference.
     *
     * Output shape:
     * {
     *   // Flat fields — used by AppendRowInSheet and email nodes
     *   full_name, email, phone, raw_phone,
     *   monthly_salary_ttd, parish,
     *
     *   // Metadata
     *   fb_lead_id, fb_form_id, fb_ad_id,
     *
     *   // processor.py payload — forwarded as-is to Call Lead Intake
     *   source, purchase_type, income_bracket, intent_niche, is_legendary,
     *   fact_find: { full_name, email, phone, raw_phone,
     *                estimated_income_ttd, parish }
     * }
     *
     * Phone normalisation: T&T numbers reach Facebook in several formats
     * (+18685551234, 8685551234, etc.). We normalise to 1-868-XXX-XXXX which
     * is what the DB check constraint requires. raw_phone preserves the original.
     *
     * Income → is_legendary: monthly salary >= TT$25,000 flags the lead as
     * Legendary (visible only to Pro subscribers). This matches the threshold
     * in lib/constants.ts: LEGENDARY_INCOME_THRESHOLD_TTD = 25000.
     */
    @node({
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789abc',
        name: 'Transform for Lead Intake',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [-150, 80],
    })
    TransformForLeadIntake = {
        mode: 'runOnceForEachItem',
        jsCode: `
// Facebook delivers lead fields as an array: [{ name, values: [value] }]
// Build a flat lookup map for easy access.
const fieldData = $json.field_data || [];
const fields = {};
fieldData.forEach(f => {
  fields[f.name] = (f.values && f.values.length > 0) ? f.values[0] : null;
});

// ── Constants (keep in sync with web/lib/constants.ts) ────────────────
const LEGENDARY_THRESHOLD_TTD = 25000;
const VALID_PARISHES = [
  'Port of Spain', 'San Fernando', 'Chaguanas', 'Arima',
  'Point Fortin', 'Sangre Grande', 'Siparia', 'Tobago',
];

// ── Phone normalisation ───────────────────────────────────────────────
// Target format: 1-868-XXX-XXXX (DB check constraint)
// Facebook delivers: +18685551234 | 18685551234 | 8685551234 | 868-555-1234
function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\\D/g, '');

  if (digits.length === 11 && digits.startsWith('1868')) {
    const local = digits.slice(4);
    return \`1-868-\${local.slice(0, 3)}-\${local.slice(3)}\`;
  }
  if (digits.length === 10 && digits.startsWith('868')) {
    const local = digits.slice(3);
    return \`1-868-\${local.slice(0, 3)}-\${local.slice(3)}\`;
  }
  // Cannot normalise — return null; processor.py will reject invalid phones
  // and raw_phone preserves the original for manual follow-up
  return null;
}

// ── Income parsing ────────────────────────────────────────────────────
// Facebook returns user-entered text — strip currency symbols, commas, etc.
function parseIncomeTTD(raw) {
  if (!raw) return null;
  const n = parseInt(String(raw).replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? null : n;
}

// ── Parish normalisation ──────────────────────────────────────────────
// Case-insensitive match against valid T&T parishes.
// Non-matching values are kept as-is (stored in fact_find for review).
function normalizeParish(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  const match = VALID_PARISHES.find(p => p.toLowerCase() === trimmed.toLowerCase());
  return match || trimmed;
}

// Facebook can send first_name + last_name OR full_name depending on form setup.
const fullName = fields.full_name
  || [\`\${fields.first_name || ''}\`, \`\${fields.last_name || ''}\`].join(' ').trim()
  || null;

const phone           = normalizePhone(fields.phone_number);
const income          = parseIncomeTTD(fields.monthly_salary);
const parish          = normalizeParish(fields.location);
const isLegendary     = income !== null && income >= LEGENDARY_THRESHOLD_TTD;
const incomeBracket   = isLegendary ? 'LEGENDARY' : 'STANDARD';

return {
  json: {
    // ── Flat fields (AppendRowInSheet + email nodes) ──────────────
    full_name:           fullName,
    email:               fields.email || null,
    phone:               phone,
    raw_phone:           fields.phone_number || null,
    monthly_salary_ttd:  income,
    parish:              parish,

    // ── Facebook metadata ─────────────────────────────────────────
    fb_lead_id:  $json.id       || null,
    fb_form_id:  $json.form_id  || null,
    fb_ad_id:    $json.ad_id    || null,

    // ── processor.py payload (forwarded to Call Lead Intake) ──────
    source:         'FACEBOOK',
    purchase_type:  'community',   // max_purchases = 3
    income_bracket: incomeBracket,
    intent_niche:   null,
    is_legendary:   isLegendary,
    fact_find: {
      full_name:             fullName,
      email:                 fields.email || null,
      phone:                 phone,          // normalised — used for dedup
      raw_phone:             fields.phone_number || null,
      estimated_income_ttd:  income,         // stored in JSONB, not a column
      parish:                parish,         // stored in JSONB, not a column
    },
  },
};
`,
    };

    /**
     * Appends one row per lead to the Google Sheet.
     * Sheet1 requires these columns (add monthly salary + location if missing):
     *   name | email address | phone number | monthly salary (TTD) | location
     */
    @node({
        id: 'ea078f0a-f8ce-42e4-89eb-6daff42db646',
        name: 'Append row in sheet',
        type: 'n8n-nodes-base.googleSheets',
        version: 4.7,
        position: [100, 80],
        credentials: { googleSheetsOAuth2Api: { id: 'ZmDeKG08JTYM94oF', name: 'Google Sheets account' } },
    })
    AppendRowInSheet = {
        operation: 'append',
        documentId: {
            __rl: true,
            value: '1OJ0xMFPzKcIZLhsLMYrMZCbXJ5seC-HnXThb5gvbSoE',
            mode: 'list',
            cachedResultName: 'facebook ad 1',
            cachedResultUrl:
                'https://docs.google.com/spreadsheets/d/1OJ0xMFPzKcIZLhsLMYrMZCbXJ5seC-HnXThb5gvbSoE/edit?usp=drivesdk',
        },
        sheetName: {
            __rl: true,
            value: 'gid=0',
            mode: 'list',
            cachedResultName: 'Sheet1',
            cachedResultUrl:
                'https://docs.google.com/spreadsheets/d/1OJ0xMFPzKcIZLhsLMYrMZCbXJ5seC-HnXThb5gvbSoE/edit#gid=0',
        },
        columns: {
            mappingMode: 'defineBelow',
            value: {
                'name ':               '={{ $json.full_name }}',
                'email address':       '={{ $json.email }}',
                'phone number ':       '={{ $json.phone || $json.raw_phone }}',
                'monthly salary (TTD)': '={{ $json.monthly_salary_ttd }}',
                'location':            '={{ $json.parish }}',
            },
            matchingColumns: [],
            schema: [
                { id: 'name ',               displayName: 'name ',               required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
                { id: 'email address',        displayName: 'email address',        required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
                { id: 'phone number ',        displayName: 'phone number ',        required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
                { id: 'monthly salary (TTD)', displayName: 'monthly salary (TTD)', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: false },
                { id: 'location',             displayName: 'location',             required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: false },
            ],
            attemptToConvertTypes: false,
            convertFieldsToString: false,
        },
        options: {},
    };

    /**
     * POSTs the processor.py payload to the Lead Intake Pipeline webhook.
     * onError: continueErrorOutput — a DB failure must not block the
     * lead's confirmation email or the agent notification.
     *
     * Note: only the top-level processor payload fields are sent.
     * The Transform node co-locates flat display fields with the nested
     * fact_find, so the entire $json object is the correct payload shape.
     */
    @node({
        id: 'd4e5f6a7-b8c9-0123-def0-234567890bcd',
        name: 'Call Lead Intake',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.2,
        position: [350, 80],
        onError: 'continueErrorOutput',
    })
    CallLeadIntake = {
        method: 'POST',
        url: 'http://localhost:5678/webhook/lead-intake',
        sendBody: true,
        contentType: 'json',
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify($json) }}',
        options: {},
    };

    /**
     * Fires only on CallLeadIntake error output.
     * Sends a diagnostic email with the raw lead details so the lead
     * is not silently lost and can be re-entered manually.
     */
    @node({
        id: 'e5f6a7b8-c9d0-1234-ef01-345678901cde',
        name: 'Notify Lead Intake Error',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [600, 280],
        credentials: { gmailOAuth2: { id: 'dX9sbBrKDXEbS5bV', name: 'Gmail account' } },
    })
    NotifyLeadIntakeError = {
        sendTo: 'volatusfinancial33@gmail.com',
        subject: "=⚠️ Lead Intake DB Failed: {{ $('Transform for Lead Intake').first().json.full_name }}",
        message: `=<p><strong>A Facebook lead was logged to Google Sheets but could not be inserted into the database.</strong></p>
<p>Please re-enter this lead manually or re-run the intake pipeline.</p>
<hr>
<p><strong>Name:</strong> {{ $('Transform for Lead Intake').first().json.full_name }}<br>
<strong>Email:</strong> {{ $('Transform for Lead Intake').first().json.email }}<br>
<strong>Phone:</strong> {{ $('Transform for Lead Intake').first().json.phone || $('Transform for Lead Intake').first().json.raw_phone }}<br>
<strong>Monthly Salary:</strong> TT${{ $('Transform for Lead Intake').first().json.monthly_salary_ttd }}<br>
<strong>Parish:</strong> {{ $('Transform for Lead Intake').first().json.parish }}<br>
<strong>FB Lead ID:</strong> {{ $('Transform for Lead Intake').first().json.fb_lead_id }}</p>
<p><strong>Error:</strong> {{ $json.error?.message || 'Unknown error' }}</p>`,
        options: { appendAttribution: false },
    };

    /**
     * Sends a confirmation email to the lead with a Calendly booking link.
     * References Transform node output explicitly since $json at this point
     * holds the HTTP response from Call Lead Intake.
     */
    @node({
        id: 'e25597f8-e2ed-4dcc-a4db-8d634b59b2ea',
        name: 'Send a message',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [600, -80],
        credentials: { gmailOAuth2: { id: 'dX9sbBrKDXEbS5bV', name: 'Gmail account' } },
    })
    SendAMessage = {
        sendTo: "={{ $('Transform for Lead Intake').first().json.email }}",
        subject: 'Your Consultation Request — Volatus Financial',
        message: `=<p>Good day {{ $('Transform for Lead Intake').first().json.full_name }},</p>

<p>Thank you for your interest in our financial planning services. Click the link below to book your free 30-minute consultation at a time that suits you:</p>

<p><a href="https://calendly.com/volatusfinancial33/30min">Book Your Consultation</a></p>

<p>We look forward to speaking with you.</p>

<p>Best regards,<br>Volatus Financial</p>`,
        options: { appendAttribution: false },
    };

    /**
     * Notifies the agent of the new lead.
     * Includes all 5 captured fields for quick review.
     */
    @node({
        id: 'e162962a-8106-43d5-b6c4-b53b0b28f9a4',
        name: 'Notify Me',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [850, 48],
        credentials: { gmailOAuth2: { id: 'dX9sbBrKDXEbS5bV', name: 'Gmail account' } },
    })
    NotifyMe = {
        sendTo: 'volatusfinancial33@gmail.com',
        subject: "=New Facebook Lead: {{ $('Transform for Lead Intake').first().json.full_name }}{{ $('Transform for Lead Intake').first().json.is_legendary ? ' ★ LEGENDARY' : '' }}",
        message: `=<p>A new lead has been submitted via Facebook Ad and added to the pipeline.</p>
<p>
<strong>Name:</strong> {{ $('Transform for Lead Intake').first().json.full_name }}<br>
<strong>Email:</strong> {{ $('Transform for Lead Intake').first().json.email }}<br>
<strong>Phone:</strong> {{ $('Transform for Lead Intake').first().json.phone || $('Transform for Lead Intake').first().json.raw_phone }}<br>
<strong>Monthly Salary:</strong> TT${{ $('Transform for Lead Intake').first().json.monthly_salary_ttd?.toLocaleString() || 'not provided' }}<br>
<strong>Parish:</strong> {{ $('Transform for Lead Intake').first().json.parish || 'not provided' }}<br>
<strong>Tier:</strong> {{ $('Transform for Lead Intake').first().json.income_bracket }}
</p>`,
        options: { appendAttribution: false },
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.FacebookLeadAdsTrigger.out(0).to(this.TransformForLeadIntake.in(0));
        this.TransformForLeadIntake.out(0).to(this.AppendRowInSheet.in(0));
        this.AppendRowInSheet.out(0).to(this.CallLeadIntake.in(0));
        this.CallLeadIntake.out(0).to(this.SendAMessage.in(0));          // success path
        this.CallLeadIntake.out(1).to(this.NotifyLeadIntakeError.in(0)); // error path
        this.SendAMessage.out(0).to(this.NotifyMe.in(0));
    }
}
