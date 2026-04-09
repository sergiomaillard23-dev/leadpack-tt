import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : WhatsApp First Contact
// Nodes   : 5  |  Connections: 4
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ReceivePackCrack                   webhook
// SplitLeadList                      splitInBatches
// FormatWAMessage                    set
// SendWhatsApp                       httpRequest
// LogResult                          set
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ReceivePackCrack
//    → SplitLeadList
//      → FormatWAMessage
//        → SendWhatsApp
//          → LogResult
// </workflow-map>

// Input schema expected from POST /api/packs/crack:
// {
//   "source": "LeadPack_PackCrack",
//   "timestamp": "ISO-8601",
//   "payload": {
//     "agent_name": "string",
//     "agent_phone": "string",
//     "leads": [{ "first_name": "string", "phone": "string", "parish": "string" }]
//   }
// }
//
// Message template:
//   "Hi {{lead.first_name}}, my name is {{agent.name}} from [Agency Name].
//    I noticed you were looking into life insurance options in {{lead.parish}}.
//    I have a couple of minutes today — would you be open to a quick chat?"
//
// Credentials: WHATSAPP_TOKEN env variable — never hardcode.

@workflow({
    id: 'whatsapp-first-contact-001',
    name: 'WhatsApp First Contact',
    active: false,
    settings: { executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner', availableInMCP: false },
})
export class WhatsAppFirstContactWorkflow {

    @node({
        name: 'Receive Pack Crack',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [250, 300],
    })
    ReceivePackCrack = {
        httpMethod: 'POST',
        path: 'leadpack-whatsapp-first-contact',
        responseMode: 'lastNode',
    };

    @node({
        name: 'Split Lead List',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [500, 300],
    })
    SplitLeadList = {
        batchSize: 1,
        options: {},
    };

    @node({
        name: 'Format WA Message',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [750, 300],
    })
    FormatWAMessage = {
        mode: 'manual',
        fields: {
            values: [
                {
                    name: 'phone',
                    // Strip dashes from 1-868-XXX-XXXX → 18681234567 for WhatsApp API
                    value: '={{ $json.body.payload.leads[$itemIndex].phone.replace(/-/g, "") }}',
                },
                {
                    name: 'message',
                    value: [
                        '=Hi {{ $json.body.payload.leads[$itemIndex].first_name }},',
                        'my name is {{ $json.body.payload.agent_name }} from [Agency Name].',
                        'I noticed you were looking into life insurance options recently.',
                        'I have a couple of minutes today — would you be open to a quick chat?',
                    ].join(' '),
                },
            ],
        },
    };

    @node({
        name: 'Send WhatsApp',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.2,
        position: [1000, 300],
        // Credential provisioned via: npx n8nac credential set WHATSAPP_TOKEN
    })
    SendWhatsApp = {
        method: 'POST',
        url: '=https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendHeaders: true,
        headerParameters: {
            parameters: [
                { name: 'Authorization', value: '=Bearer {{ $env.WHATSAPP_TOKEN }}' },
                { name: 'Content-Type', value: 'application/json' },
            ],
        },
        sendBody: true,
        bodyParameters: {
            parameters: [
                {
                    name: 'JSON',
                    value: '={{ JSON.stringify({ messaging_product: "whatsapp", to: $json.phone, type: "text", text: { body: $json.message } }) }}',
                },
            ],
        },
    };

    @node({
        name: 'Log Result',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1250, 300],
    })
    LogResult = {
        mode: 'manual',
        fields: {
            values: [
                { name: 'status',    value: '={{ $json.messages ? "sent" : "failed" }}' },
                { name: 'to',        value: '={{ $json.contacts?.[0]?.wa_id ?? "unknown" }}' },
                { name: 'timestamp', value: '={{ new Date().toISOString() }}' },
            ],
        },
    };

    @links()
    defineRouting() {
        this.ReceivePackCrack.out(0).to(this.SplitLeadList.in(0));
        this.SplitLeadList.out(0).to(this.FormatWAMessage.in(0));
        this.FormatWAMessage.out(0).to(this.SendWhatsApp.in(0));
        this.SendWhatsApp.out(0).to(this.LogResult.in(0));
    }
}
