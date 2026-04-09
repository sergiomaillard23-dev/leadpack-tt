import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : CRM Export — Google Sheets
// Nodes   : 3  |  Connections: 2
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ReceiveExportRequest               webhook
// AppendToSheet                      googleSheets
// ConfirmExport                      respondToWebhook
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ReceiveExportRequest
//    → AppendToSheet
//      → ConfirmExport
// </workflow-map>

// Input schema expected from "Export to CRM" button:
// {
//   "source": "LeadPack_CRMExport",
//   "timestamp": "ISO-8601",
//   "payload": {
//     "agent_id": "string",
//     "pack_id": "string",
//     "leads": [{ "first_name": "string", "last_name": "string", "parish": "string", "phone": "string", "ovr": 85 }]
//   }
// }
//
// Credentials: GOOGLE_SHEETS_CREDENTIAL — provision via:
//   npx n8nac credential set GOOGLE_SHEETS_CREDENTIAL
// Sheet ID: set as n8n env variable LEADPACK_EXPORT_SHEET_ID

@workflow({
    id: 'crm-export-google-sheets-001',
    name: 'CRM Export — Google Sheets',
    active: false,
    settings: { executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner', availableInMCP: false },
})
export class CRMExportGoogleSheetsWorkflow {

    @node({
        name: 'Receive Export Request',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [250, 300],
    })
    ReceiveExportRequest = {
        httpMethod: 'POST',
        path: 'leadpack-crm-export',
        responseMode: 'responseNode',
    };

    @node({
        name: 'Append to Sheet',
        type: 'n8n-nodes-base.googleSheets',
        version: 4.5,
        position: [500, 300],
        credentials: {
            // Provision via: npx n8nac credential set GOOGLE_SHEETS_CREDENTIAL
            googleSheetsOAuth2Api: { id: 'GOOGLE_SHEETS_CREDENTIAL', name: 'Google Sheets' },
        },
    })
    AppendToSheet = {
        operation: 'append',
        documentId: { __rl: true, value: '={{ $env.LEADPACK_EXPORT_SHEET_ID }}', mode: 'id' },
        sheetName: { __rl: true, value: 'Leads', mode: 'name' },
        columns: {
            mappingMode: 'autoMapInputData',
            value: {},
            matchingColumns: [],
            schema: [],
        },
        options: { cellFormat: 'USER_ENTERED' },
    };

    @node({
        name: 'Confirm Export',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.1,
        position: [750, 300],
    })
    ConfirmExport = {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify({ success: true, exported: $input.all().length }) }}',
        options: { responseCode: 200 },
    };

    @links()
    defineRouting() {
        this.ReceiveExportRequest.out(0).to(this.AppendToSheet.in(0));
        this.AppendToSheet.out(0).to(this.ConfirmExport.in(0));
    }
}
