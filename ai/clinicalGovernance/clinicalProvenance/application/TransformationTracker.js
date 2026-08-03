import {
  createTransformation,
} from "../domain/Transformation.js";

export const TRANSFORMATION_TRACKER_VERSION =
  "CGL-000002-S2-v1.0.0";

export class TransformationTracker {
  constructor({
    clock = () => new Date(),
  } = {}) {
    this.clock = clock;
  }

  start({
    transformationId,
    name,
    engineId,
    engineVersion,
    inputNodeIds = [],
    parameters = {},
    metadata = {},
  } = {}) {
    return createTransformation({
      transformationId,
      name,
      engineId,
      engineVersion,
      inputNodeIds,
      outputNodeIds: [],
      startedAt: this.clock().toISOString(),
      parameters,
      metadata,
    });
  }

  complete(
    transformation,
    {
      outputNodeIds = [],
      metadata = {},
    } = {},
  ) {
    return createTransformation({
      transformationId:
        transformation.transformationId,
      name: transformation.name,
      engineId: transformation.engineId,
      engineVersion:
        transformation.engineVersion,
      inputNodeIds:
        transformation.inputNodeIds,
      outputNodeIds,
      startedAt:
        transformation.startedAt,
      completedAt:
        this.clock().toISOString(),
      parameters:
        transformation.parameters,
      metadata: {
        ...transformation.metadata,
        ...metadata,
      },
    });
  }
}
