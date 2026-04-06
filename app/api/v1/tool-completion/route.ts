// POST /api/v1/tool-completion
// External webhook endpoint — called by tools hosted on other pages/servers
// when a user finishes a tool flow. Verifies signature and routes to
// ToolIntegrationService.handleToolCompletion()

import { NextRequest, NextResponse } from 'next/server'
import { handleToolWebhook } from '@/lib/services/ToolIntegrationService'
import { errorResponse, successResponse } from '@/lib/api/journey-auth'

export async function POST(request: NextRequest) {
  try {
    // Signature must be in header: X-Tool-Webhook-Secret
    const signature = request.headers.get('x-tool-webhook-secret')

    const payload = await request.json()

    const result = await handleToolWebhook(signature, payload)

    if (!result.success) {
      return NextResponse.json(
        errorResponse('WEBHOOK_ERROR', result.error ?? 'Webhook processing failed'),
        { status: result.error?.includes('signature') ? 401 : 400 }
      )
    }

    return NextResponse.json(
      successResponse({ next_step_key: result.next_step_key }, 'Tool completion processed'),
      { status: 200 }
    )
  } catch (err) {
    console.error('[POST /tool-completion] Unexpected error:', err)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    )
  }
}
