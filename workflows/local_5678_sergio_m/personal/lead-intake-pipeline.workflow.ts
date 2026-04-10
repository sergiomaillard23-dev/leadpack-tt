import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Lead Intake Pipeline
// Nodes   : 8  |  Connections: 7
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            webhook
// RunProcessor                       executeCommand             [onError→out(1)]
// CheckThreshold                     if
// RunPackEngine                      executeCommand             [onError→out(1)]
// RespondPacksCreated                respondToWebhook
// RespondLeadQueued                  respondToWebhook
// RespondProcessorError              respondToWebhook
// RespondPackEngineError             respondToWebhook
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → RunProcessor
//      → CheckThreshold
//        → RunPackEngine
//          → RespondPacksCreated
//         .out(1) → RespondPackEngineError
//       .out(1) → RespondLeadQueued
//     .out(1) → RespondProcessorError
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'bLBSBnhVwX9LOk85',
    name: 'Lead Intake Pipeline',
    active: false,
    settings: { executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner', availableInMCP: false },
})
export class LeadIntakePipelineWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '38409a07-13e1-4fc0-83b9-4aa34e8883e5',
        webhookId: 'a7575895-d1a7-4085-9b5e-f26c343ad3fc',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [250, 300],
    })
    Webhook = {
        httpMethod: 'POST',
        path: 'lead-intake',
        responseMode: 'responseNode',
        responseBinaryPropertyName: 'data',
    };

    @node({
        id: '5d85f819-5b0a-4f8a-abf0-aa4859d472b1',
        name: 'Run Processor',
        type: 'n8n-nodes-base.executeCommand',
        version: 1,
        position: [500, 300],
        onError: 'continueErrorOutput',
    })
    RunProcessor = {
        command: "echo '{{ JSON.stringify($json) }}' | python /app/src/processor.py",
        executeOnce: true,
    };

    @node({
        id: '0d335520-4bb6-4c8a-97f3-3af49625e2e3',
        name: 'Check Threshold',
        type: 'n8n-nodes-base.if',
        version: 2.2,
        position: [750, 300],
    })
    CheckThreshold = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'loose',
            },
            conditions: [
                {
                    id: 'pending-gte-20',
                    leftValue: '={{ JSON.parse($json.stdout).pending_count }}',
                    rightValue: 20,
                    operator: {
                        type: 'number',
                        operation: 'gte',
                    },
                },
            ],
            combinator: 'and',
        },
        looseTypeValidation: true,
    };

    @node({
        id: '497a353a-fc96-48b1-b09a-0de2b8431280',
        name: 'Run Pack Engine',
        type: 'n8n-nodes-base.executeCommand',
        version: 1,
        position: [1000, 180],
        onError: 'continueErrorOutput',
    })
    RunPackEngine = {
        command: 'python /app/src/pack_engine.py',
        executeOnce: true,
    };

    @node({
        id: '44d3c34d-e7cb-4edf-9eef-49951ad07c4d',
        name: 'Respond Packs Created',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.5,
        position: [1250, 180],
    })
    RespondPacksCreated = {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify({ success: true, data: JSON.parse($json.stdout) }) }}',
        redirectURL: '',
        inputFieldName: 'data',
    };

    @node({
        id: 'f30f3034-1040-4141-ac16-1ff3e4e3631b',
        name: 'Respond Lead Queued',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.5,
        position: [1000, 420],
    })
    RespondLeadQueued = {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify({ success: true, data: JSON.parse($json.stdout) }) }}',
        redirectURL: '',
        inputFieldName: 'data',
    };

    @node({
        id: 'e110064d-65db-4452-a6b1-c20d4cbb0486',
        name: 'Respond Processor Error',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.5,
        position: [750, 500],
    })
    RespondProcessorError = {
        respondWith: 'json',
        responseBody:
            '={{ JSON.stringify({ success: false, error: $json.error?.message || "Lead processing failed" }) }}',
        redirectURL: '',
        inputFieldName: 'data',
    };

    @node({
        id: '8e081447-6c27-4e51-b759-b2e1027be58d',
        name: 'Respond Pack Engine Error',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.5,
        position: [1250, 420],
    })
    RespondPackEngineError = {
        respondWith: 'json',
        responseBody:
            '={{ JSON.stringify({ success: false, error: $json.error?.message || "Pack generation failed" }) }}',
        redirectURL: '',
        inputFieldName: 'data',
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.RunProcessor.in(0));
        this.RunProcessor.out(0).to(this.CheckThreshold.in(0));
        this.RunProcessor.out(1).to(this.RespondProcessorError.in(0));
        this.CheckThreshold.out(0).to(this.RunPackEngine.in(0));
        this.CheckThreshold.out(1).to(this.RespondLeadQueued.in(0));
        this.RunPackEngine.out(0).to(this.RespondPacksCreated.in(0));
        this.RunPackEngine.out(1).to(this.RespondPackEngineError.in(0));
    }
}
