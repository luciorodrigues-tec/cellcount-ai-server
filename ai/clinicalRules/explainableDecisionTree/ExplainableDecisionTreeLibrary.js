import {
  ExplainableDecisionTreeEngine,
} from "./application/ExplainableDecisionTreeEngine.js";

import {
  ExplainableDecisionTreeRepository,
} from "./repository/ExplainableDecisionTreeRepository.js";

export function createExplainableDecisionTreeLibrary({
  policy = {},
  clock,
} = {}) {
  const repository =
    new ExplainableDecisionTreeRepository();

  const engine =
    new ExplainableDecisionTreeEngine({
      policy,
      clock,
    });

  return Object.freeze({
    engine,
    repository,
    buildAndStore(
      input,
      { replace = false } = {},
    ) {
      const result = engine.build(input);
      repository.save(result, { replace });
      return result;
    },
  });
}
