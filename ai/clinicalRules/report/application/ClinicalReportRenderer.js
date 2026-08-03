export class ClinicalReportRenderer {
  toJSON(report) {
    return JSON.stringify(report, null, 2);
  }

  toMarkdown(report) {
    const lines = [
      `# ${report.title}`,
      "",
      `**Relatório:** ${report.reportId}`,
      `**Execução:** ${report.executionId}`,
      `**Revisão humana:** ${
        report.requiresHumanReview
          ? "obrigatória"
          : "não sinalizada"
      }`,
      "",
    ];

    for (const section of report.sections) {
      lines.push(`## ${section.title}`, "");

      if (section.content !== null) {
        lines.push(
          typeof section.content === "string"
            ? section.content
            : "```json\n" +
              JSON.stringify(
                section.content,
                null,
                2,
              ) +
              "\n```",
          "",
        );
      }

      if (section.items.length > 0) {
        for (const item of section.items) {
          lines.push(
            `- ${
              typeof item === "string"
                ? item
                : JSON.stringify(item)
            }`,
          );
        }
        lines.push("");
      }
    }

    lines.push(
      "---",
      report.safetyStatement,
    );

    return lines.join("\n");
  }
}
