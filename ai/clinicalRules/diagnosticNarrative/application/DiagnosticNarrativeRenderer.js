export class DiagnosticNarrativeRenderer {
  toJSON(narrative) {
    return JSON.stringify(narrative, null, 2);
  }

  toMarkdown(narrative) {
    const lines = [
      `# ${narrative.title}`,
      "",
    ];

    for (const section of narrative.sections) {
      lines.push(
        `## ${section.title}`,
        "",
        section.content || "",
        "",
      );
    }

    if (narrative.limitations.length > 0) {
      lines.push("## Limitações", "");

      for (const limitation of narrative.limitations) {
        lines.push(`- ${limitation}`);
      }

      lines.push("");
    }

    lines.push(
      "## Conclusão",
      "",
      narrative.conclusion,
      "",
      "---",
      narrative.safetyStatement,
    );

    return lines.join("\n");
  }
}
