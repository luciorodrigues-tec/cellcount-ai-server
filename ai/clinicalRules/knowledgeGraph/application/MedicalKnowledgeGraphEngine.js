export const MEDICAL_KNOWLEDGE_GRAPH_ENGINE_VERSION =
  "CRR-000014-v1.0.0";

export class MedicalKnowledgeGraphEngine {
  constructor({
    repository,
    policy,
  } = {}) {
    if (!repository) {
      throw new TypeError(
        "MedicalKnowledgeGraphEngine requires a repository.",
      );
    }

    this.repository = repository;
    this.policy = policy;
  }

  neighbors(
    entityId,
    {
      relationTypes = [],
      minimumConfidence =
        this.policy.defaultMinimumConfidence,
      includeIncoming = true,
      includeOutgoing = true,
    } = {},
  ) {
    const entity =
      this.repository.getEntity(entityId);

    if (!entity) {
      throw new Error(
        `Unknown medical knowledge entity: ${entityId}`,
      );
    }

    const allowedTypes = new Set(
      (Array.isArray(relationTypes)
        ? relationTypes
        : []
      ).map((value) =>
        String(value).trim().toUpperCase(),
      ),
    );

    const relations = [
      ...(includeOutgoing
        ? this.repository.outgoingRelations(
            entityId,
          )
        : []),
      ...(includeIncoming
        ? this.repository.incomingRelations(
            entityId,
          )
        : []),
    ]
      .filter(
        (relation) =>
          relation.confidence >=
          Number(minimumConfidence || 0),
      )
      .filter(
        (relation) =>
          allowedTypes.size === 0 ||
          allowedTypes.has(relation.type),
      );

    const uniqueRelations = [
      ...new Map(
        relations.map((relation) => [
          relation.id,
          relation,
        ]),
      ).values(),
    ];

    const neighbors = uniqueRelations.map(
      (relation) => {
        const neighborId =
          relation.sourceEntityId === entityId
            ? relation.targetEntityId
            : relation.sourceEntityId;

        return Object.freeze({
          entity:
            this.repository.getEntity(
              neighborId,
            ),
          relation,
        });
      },
    );

    return Object.freeze(neighbors);
  }

  traverse(
    startEntityId,
    {
      maximumDepth =
        this.policy.maximumTraversalDepth,
      maximumNodes =
        this.policy.maximumTraversalNodes,
      relationTypes = [],
      minimumConfidence =
        this.policy.defaultMinimumConfidence,
    } = {},
  ) {
    if (!this.repository.getEntity(startEntityId)) {
      throw new Error(
        `Unknown medical knowledge entity: ${startEntityId}`,
      );
    }

    const queue = [
      {
        entityId: startEntityId,
        depth: 0,
        path: [startEntityId],
      },
    ];

    const visited = new Set();
    const nodes = [];
    const edges = [];

    while (
      queue.length > 0 &&
      visited.size < maximumNodes
    ) {
      const current = queue.shift();

      if (visited.has(current.entityId)) {
        continue;
      }

      visited.add(current.entityId);

      nodes.push(
        Object.freeze({
          entity:
            this.repository.getEntity(
              current.entityId,
            ),
          depth: current.depth,
          path: Object.freeze([
            ...current.path,
          ]),
        }),
      );

      if (current.depth >= maximumDepth) {
        continue;
      }

      const neighbors = this.neighbors(
        current.entityId,
        {
          relationTypes,
          minimumConfidence,
        },
      );

      for (const item of neighbors) {
        if (!item.entity) {
          continue;
        }

        edges.push(item.relation);

        if (!visited.has(item.entity.id)) {
          queue.push({
            entityId: item.entity.id,
            depth: current.depth + 1,
            path: [
              ...current.path,
              item.entity.id,
            ],
          });
        }
      }
    }

    return Object.freeze({
      engineVersion:
        MEDICAL_KNOWLEDGE_GRAPH_ENGINE_VERSION,
      startEntityId,
      nodeCount: nodes.length,
      edgeCount: [
        ...new Set(edges.map((edge) => edge.id)),
      ].length,
      nodes: Object.freeze(nodes),
      edges: Object.freeze([
        ...new Map(
          edges.map((edge) => [
            edge.id,
            edge,
          ]),
        ).values(),
      ]),
      truncated:
        visited.size >= maximumNodes,
    });
  }

  shortestPath(
    sourceEntityId,
    targetEntityId,
    options = {},
  ) {
    if (
      !this.repository.getEntity(sourceEntityId) ||
      !this.repository.getEntity(targetEntityId)
    ) {
      throw new Error(
        "Both source and target entities must exist.",
      );
    }

    const queue = [
      {
        entityId: sourceEntityId,
        path: [sourceEntityId],
        relations: [],
      },
    ];
    const visited = new Set();

    while (queue.length > 0) {
      const current = queue.shift();

      if (current.entityId === targetEntityId) {
        return Object.freeze({
          found: true,
          entityPath: Object.freeze(
            current.path,
          ),
          relationPath: Object.freeze(
            current.relations,
          ),
          length:
            current.path.length - 1,
        });
      }

      if (visited.has(current.entityId)) {
        continue;
      }

      visited.add(current.entityId);

      for (
        const item of
        this.neighbors(
          current.entityId,
          options,
        )
      ) {
        if (!item.entity) {
          continue;
        }

        queue.push({
          entityId: item.entity.id,
          path: [
            ...current.path,
            item.entity.id,
          ],
          relations: [
            ...current.relations,
            item.relation,
          ],
        });
      }
    }

    return Object.freeze({
      found: false,
      entityPath: Object.freeze([]),
      relationPath: Object.freeze([]),
      length: null,
    });
  }

  explainEntity(entityId) {
    const entity =
      this.repository.getEntity(entityId);

    if (!entity) {
      throw new Error(
        `Unknown medical knowledge entity: ${entityId}`,
      );
    }

    const outgoing =
      this.repository.outgoingRelations(
        entityId,
      );
    const incoming =
      this.repository.incomingRelations(
        entityId,
      );

    return Object.freeze({
      engineVersion:
        MEDICAL_KNOWLEDGE_GRAPH_ENGINE_VERSION,
      entity,
      outgoingCount: outgoing.length,
      incomingCount: incoming.length,
      outgoing,
      incoming,
      safetyStatement:
        "Knowledge graph relations are structured evidence support and not a definitive diagnosis.",
    });
  }
}
