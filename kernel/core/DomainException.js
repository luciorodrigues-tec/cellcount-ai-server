export class DomainException extends Error {
  constructor(
    message,
    {
      code = "DOMAIN_EXCEPTION",
      context = {},
      cause,
    } = {},
  ) {
    super(
      String(
        message ||
        "Exceptional domain failure.",
      ),
      {
        cause,
      },
    );

    this.name =
      this.constructor.name;

    this.code =
      String(code);

    this.context =
      Object.freeze(
        structuredClone(context),
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
      context:
        this.context,
    });
  }
}
