export const GUIDELINE_NAVIGATOR_VERSION =
  "CGL-000004-S2-v1.0.0";

export class GuidelineNavigator {
  constructor({
    maximumDepth = 100,
  } = {}) {
    this.maximumDepth =
      Number(maximumDepth);
  }

  getNode(guideline, nodeId) {
    return (
      guideline.nodes.find(
        (node) => node.nodeId === nodeId,
      ) || null
    );
  }

  assertTransition({
    visitedNodeIds = [],
    nextNodeId,
  } = {}) {
    if (
      visitedNodeIds.length >=
      this.maximumDepth
    ) {
      throw new Error(
        "Guideline maximum execution depth exceeded.",
      );
    }

    if (
      visitedNodeIds.includes(nextNodeId)
    ) {
      throw new Error(
        `Guideline cycle detected at node: ${nextNodeId}`,
      );
    }

    return true;
  }
}
