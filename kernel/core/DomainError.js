export class DomainError extends Error {
  constructor(
    message,
    {
      code = "DOMAIN_ERROR",
      details = {},
      cause,
    } = {},
  ) {
    super(
      String(message || "Domain error."),
      {
        cause,
      },
    );

    this.name =
      this.constructor.name;

    this.code =
      String(code);

    this.details =
      Object.freeze(
        structuredClone(details),
      );
  }

  toJSON() {
    return Object.freeze({
      name:
        this.name,
      code:
        this.code,
      message:
        this.message,
      details:
        this.details,
    });
  }
}

export class ValidationError extends DomainError {
  constructor(
    message,
    options = {},
  ) {
    super(message, {
      code:
        options.code ??
        "VALIDATION_ERROR",
      ...options,
    });
  }
}

export class BusinessRuleError extends DomainError {
  constructor(
    message,
    options = {},
  ) {
    super(message, {
      code:
        options.code ??
        "BUSINESS_RULE_ERROR",
      ...options,
    });
  }
}

export class InfrastructureError extends DomainError {
  constructor(
    message,
    options = {},
  ) {
    super(message, {
      code:
        options.code ??
        "INFRASTRUCTURE_ERROR",
      ...options,
    });
  }
}
