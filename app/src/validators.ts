// Unified error response format
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string>;
}

// Error response builders
export function createValidationError(message: string, details?: Record<string, string>): ErrorResponse {
  return {
    code: 'VALIDATION_ERROR',
    message,
    details,
  };
}

export function createNotFoundError(message: string): ErrorResponse {
  return {
    code: 'NOT_FOUND',
    message,
  };
}

export function createAuthError(message: string): ErrorResponse {
  return {
    code: 'AUTH_ERROR',
    message,
  };
}

export function createWebhookError(message: string): ErrorResponse {
  return {
    code: 'WEBHOOK_ERROR',
    message,
  };
}

export function validateOrderId(orderId: any): { valid: boolean; error?: ErrorResponse; data?: number } {
  const id = Number(orderId);

  if (Number.isNaN(id)) {
    return {
      valid: false,
      error: createValidationError('order ID must be a valid number'),
    };
  }

  if (!Number.isInteger(id) || id <= 0) {
    return {
      valid: false,
      error: createValidationError('order ID must be a positive integer'),
    };
  }

  return { valid: true, data: id };
}

// Validate POST /api/orders request body
export function validateCreateOrder(body: any): { valid: boolean; error?: ErrorResponse } {
  const { customer_name, item_name, quantity, pickup_slot } = body;

  // 1. Check required fields
  if (!customer_name || !item_name || !quantity || !pickup_slot) {
    return {
      valid: false,
      error: createValidationError('Missing required fields', {
        customer_name: customer_name ? 'ok' : 'required',
        item_name: item_name ? 'ok' : 'required',
        quantity: quantity ? 'ok' : 'required',
        pickup_slot: pickup_slot ? 'ok' : 'required',
      }),
    };
  }

  // 2. Validate customer_name
  if (typeof customer_name !== 'string') {
    return {
      valid: false,
      error: createValidationError('customer_name must be a string'),
    };
  }
  if (customer_name.length < 2 || customer_name.length > 100) {
    return {
      valid: false,
      error: createValidationError('customer_name must be 2-100 characters'),
    };
  }

  // 3. Validate item_name
  if (typeof item_name !== 'string') {
    return {
      valid: false,
      error: createValidationError('item_name must be a string'),
    };
  }
  if (item_name.length < 2 || item_name.length > 100) {
    return {
      valid: false,
      error: createValidationError('item_name must be 2-100 characters'),
    };
  }

  // 4. Validate quantity
  if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
    return {
      valid: false,
      error: createValidationError('quantity must be an integer'),
    };
  }
  if (quantity <= 0 || quantity > 1000) {
    return {
      valid: false,
      error: createValidationError('quantity must be between 1 and 1000'),
    };
  }

  // 5. Validate pickup_slot
  if (typeof pickup_slot !== 'string') {
    return {
      valid: false,
      error: createValidationError('pickup_slot must be a string'),
    };
  }
  if (pickup_slot.length < 3 || pickup_slot.length > 50) {
    return {
      valid: false,
      error: createValidationError('pickup_slot must be 3-50 characters'),
    };
  }

  // 6. Prevent SQL injection
  const dangerousChars = ['--', ';', '/*', '*/'];
  for (const char of dangerousChars) {
    if (customer_name.includes(char) || item_name.includes(char)) {
      return {
        valid: false,
        error: createValidationError('Invalid characters in input'),
      };
    }
  }

  return { valid: true };
}

// Validate PATCH /api/orders/:id/status request
export function validateUpdateOrderStatus(
  orderId: any,
  body: any
): { valid: boolean; error?: ErrorResponse } {
  const { status } = body;
  const allowedStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];

  // 1. Validate order ID
  const idValidation = validateOrderId(orderId);
  if (!idValidation.valid) {
    return idValidation;
  }

  // 2. Check status presence
  if (!status) {
    return {
      valid: false,
      error: createValidationError('status is required'),
    };
  }

  // 3. Check status type
  if (typeof status !== 'string') {
    return {
      valid: false,
      error: createValidationError('status must be a string'),
    };
  }

  // 4. Check status is not empty
  if (status.trim().length === 0) {
    return {
      valid: false,
      error: createValidationError('status cannot be empty'),
    };
  }

  // 5. Check status is in allowed list
  if (!allowedStatuses.includes(status)) {
    return {
      valid: false,
      error: createValidationError(
        `status must be one of: ${allowedStatuses.join(', ')}`
      ),
    };
  }

  return { valid: true };
}

export interface WebhookOrderStatusPayload {
  event_id?: string;
  order_id: number;
  status: string;
  source_system?: string;
}

export function validateOrderStatusWebhook(
  body: any
): { valid: boolean; error?: ErrorResponse; data?: WebhookOrderStatusPayload } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      valid: false,
      error: createValidationError('Webhook body must be an object'),
    };
  }

  const { event_id, order_id, status, source_system } = body;
  const allowedStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];

  if (typeof order_id !== 'number' || !Number.isInteger(order_id) || order_id <= 0) {
    return {
      valid: false,
      error: createValidationError('order_id must be a positive integer'),
    };
  }

  if (typeof status !== 'string' || status.trim().length === 0) {
    return {
      valid: false,
      error: createValidationError('status must be a non-empty string'),
    };
  }

  if (!allowedStatuses.includes(status)) {
    return {
      valid: false,
      error: createValidationError(
        `status must be one of: ${allowedStatuses.join(', ')}`
      ),
    };
  }

  if (event_id !== undefined && typeof event_id !== 'string') {
    return {
      valid: false,
      error: createValidationError('event_id must be a string when provided'),
    };
  }

  if (source_system !== undefined && typeof source_system !== 'string') {
    return {
      valid: false,
      error: createValidationError('source_system must be a string when provided'),
    };
  }

  return {
    valid: true,
    data: {
      event_id,
      order_id,
      status,
      source_system,
    },
  };
}
