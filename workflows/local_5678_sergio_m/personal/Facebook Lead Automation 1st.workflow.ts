import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Facebook Lead Automation 1st
// Nodes   : 4  |  Connections: 3
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            webhook
// AppendRowInSheet                   googleSheets               [creds]
// SendAMessage                       gmail                      [creds]
// NotifyMe                           gmail                      [creds]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → AppendRowInSheet
//      → SendAMessage
//        → NotifyMe
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
        binaryMode: 'separate',
        callerPolicy: 'workflowsFromSameOwner',
        availableInMCP: false,
    },
})
export class FacebookLeadAutomation1stWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '2a6caae0-54f6-4a22-8216-ded010dafc0f',
        webhookId: '3e23c956-8837-405b-bd29-6a209c6578f8',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [-176, -16],
    })
    Webhook = {
        httpMethod: 'POST',
        path: 'facebook-lead',
        options: {},
    };

    @node({
        id: 'ea078f0a-f8ce-42e4-89eb-6daff42db646',
        name: 'Append row in sheet',
        type: 'n8n-nodes-base.googleSheets',
        version: 4.7,
        position: [80, 80],
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
                'name ': '={{ $json.body.payload.name }}',
                'email address': '={{ $json.body.payload.email }}',
                'phone number ': '={{ $json.body.payload.phone }}',
            },
            matchingColumns: [],
            schema: [
                {
                    id: 'name ',
                    displayName: 'name ',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                },
                {
                    id: 'email address',
                    displayName: 'email address',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                },
                {
                    id: 'phone number ',
                    displayName: 'phone number ',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                },
            ],
            attemptToConvertTypes: false,
            convertFieldsToString: false,
        },
        options: {},
    };

    @node({
        id: 'e25597f8-e2ed-4dcc-a4db-8d634b59b2ea',
        webhookId: '032811f4-797d-4a1c-8bcd-7381beb1a211',
        name: 'Send a message',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [256, -112],
        credentials: { gmailOAuth2: { id: 'dX9sbBrKDXEbS5bV', name: 'Gmail account' } },
    })
    SendAMessage = {
        sendTo: "={{ $('Webhook').item.json.body.payload.email }}",
        subject: 'Consultation Confirmed.',
        message: `=<p>Hi there,</p>

<p>Thanks for your interest Christian Click the link below to book your free 30-minute consultation:</p>

<p><a href="https://calendly.com/volatusfinancial33/30min">Book Your Consultation</a></p>

<p>Talk soon,<br>Volatus Financial</p>`,
        options: {
            appendAttribution: false,
        },
    };

    @node({
        id: 'e162962a-8106-43d5-b6c4-b53b0b28f9a4',
        webhookId: 'a6116b8f-9456-4c7f-ae55-e34b54e796d3',
        name: 'Notify Me',
        type: 'n8n-nodes-base.gmail',
        version: 2.2,
        position: [496, 32],
        credentials: { gmailOAuth2: { id: 'dX9sbBrKDXEbS5bV', name: 'Gmail account' } },
    })
    NotifyMe = {
        sendTo: 'volatusfinancial33@gmail.com',
        subject: "=New Facebook Lead: {{ $('Webhook').item.json.body.payload.name }}",
        message: `=<p>A new lead has submitted via Facebook Ad.</p>
<p><strong>Name:</strong> {{ $('Webhook').item.json.body.payload.name }}<br>
<strong>Email:</strong> {{ $('Webhook').item.json.body.payload.email }}<br>
<strong>Phone:</strong> {{ $('Webhook').item.json.body.payload.phone }}</p>`,
        options: {
            appendAttribution: false,
        },
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.AppendRowInSheet.in(0));
        this.AppendRowInSheet.out(0).to(this.SendAMessage.in(0));
        this.SendAMessage.out(0).to(this.NotifyMe.in(0));
    }
}
