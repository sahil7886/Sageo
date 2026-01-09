import { Config } from './config.js';
import { ApiError } from './errors.js';

/**
 * Calls a read-only method on a MOI logic contract
 */
export async function readLogic(
  config: Config,
  logicAddress: string,
  methodName: string,
  ...args: unknown[]
): Promise<unknown> {
  try {
    const response = await fetch(config.MOI_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'moi_readLogic',
        params: {
          address: logicAddress,
          method: methodName,
          args: args,
        },
      }),
    });

    if (!response.ok) {
      throw new ApiError(
        500,
        'CHAIN_ERROR',
        `MOI RPC request failed with status ${response.status}`
      );
    }

    const data = (await response.json()) as {
      jsonrpc?: string;
      id?: number;
      error?: { code?: number; message?: string; data?: unknown };
      result?: unknown;
    };

    // Handle JSON-RPC error response
    if (data.error) {
      throw new ApiError(
        500,
        'CHAIN_ERROR',
        `MOI RPC error: ${data.error.message || 'Unknown error'}`
      );
    }

    // Return the result, handling null/undefined
    return data.result ?? null;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Wrap other errors (network errors, JSON parsing, etc.)
    throw new ApiError(
      500,
      'CHAIN_ERROR',
      `Failed to call MOI contract: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

