// ============================================================================
// CELLCOUNT ENTERPRISE
// AI MICROSCOPY IMAGE ENHANCER
// ============================================================================

import sharp from "sharp";

// ============================================================================
// CONFIG
// ============================================================================

const DEFAULT_SIZE = Number(process.env.IMAGE_ENHANCE_SIZE || 1280);

const TILE_SIZE = 1024;

const JPEG_QUALITY = Number(process.env.IMAGE_JPEG_QUALITY || 88);

// ============================================================================
// MAIN ENHANCER
// ============================================================================

export async function enhanceMicroscopyImage(
  fileBuffer,
) {

  try {

    // ======================================================================
    // BASE IMAGE
    // ======================================================================

    let image = sharp(fileBuffer);

    const metadata =
      await image.metadata();

    const originalWidth =
      metadata.width || 0;

    const originalHeight =
      metadata.height || 0;

    // ======================================================================
    // RESIZE
    // ======================================================================

    image = image.resize({

      width: DEFAULT_SIZE,

      height: DEFAULT_SIZE,

      fit: 'inside',

      withoutEnlargement: false,
    });

    // ======================================================================
    // MICROSCOPY ENHANCEMENT
    // ======================================================================

    image = image
      .normalize()
      .modulate({

        brightness: 1.04,

        saturation: 1.08,
      })
      .sharpen({

        sigma: 1.2,

        m1: 1.5,

        m2: 2.5,

        x1: 2,

        y2: 10,

        y3: 20,
      });

    // ======================================================================
    // ENHANCED BUFFER
    // ======================================================================

    const enhancedBuffer =
      await image
        .jpeg({

          quality:
            JPEG_QUALITY,
        })
        .toBuffer();

    // ======================================================================
    // TILE EXTRACTION
    // ======================================================================

    const tiles =
      await generateTiles(
        enhancedBuffer,
      );

    // ======================================================================
    // CENTER CROP
    // ======================================================================

    const centerCrop =
      await generateCenterCrop(
        enhancedBuffer,
      );

    // ======================================================================
    // RETURN
    // ======================================================================

    return {

      success: true,

      metadata: {

        originalWidth,

        originalHeight,
      },

      enhanced: enhancedBuffer,

      centerCrop,

      tiles,
    };

  } catch (error) {

    console.error(
      'Image enhancer error:',
      error,
    );

    return {

      success: false,

      error:
        error.message,
    };
  }
}

// ============================================================================
// CENTER CROP
// ============================================================================

async function generateCenterCrop(
  buffer,
) {

  const image =
    sharp(buffer);

  const metadata =
    await image.metadata();

  const width =
    metadata.width || 0;

  const height =
    metadata.height || 0;

  const cropSize =
    Math.min(
      width,
      height,
      900,
    );

  const left =
    Math.max(
      0,
      Math.floor(
        (width - cropSize) / 2,
      ),
    );

  const top =
    Math.max(
      0,
      Math.floor(
        (height - cropSize) / 2,
      ),
    );

  return await image
    .extract({

      left,

      top,

      width: cropSize,

      height: cropSize,
    })
    .jpeg({

      quality: 96,
    })
    .toBuffer();
}

// ============================================================================
// TILES
// ============================================================================

async function generateTiles(
  buffer,
) {

  const image =
    sharp(buffer);

  const metadata =
    await image.metadata();

  const width =
    metadata.width || 0;

  const height =
    metadata.height || 0;

  const tiles = [];

  const cols =
    Math.ceil(
      width / TILE_SIZE,
    );

  const rows =
    Math.ceil(
      height / TILE_SIZE,
    );

  for (
    let row = 0;
    row < rows;
    row++
  ) {

    for (
      let col = 0;
      col < cols;
      col++
    ) {

      const left =
        col * TILE_SIZE;

      const top =
        row * TILE_SIZE;

      const tileWidth =
        Math.min(
          TILE_SIZE,
          width - left,
        );

      const tileHeight =
        Math.min(
          TILE_SIZE,
          height - top,
        );

      if (
        tileWidth < 200 ||
        tileHeight < 200
      ) {

        continue;
      }

      try {

        const tile =
          await image
            .extract({

              left,

              top,

              width:
                tileWidth,

              height:
                tileHeight,
            })
            .jpeg({

              quality: 94,
            })
            .toBuffer();

        tiles.push({

          row,

          col,

          left,

          top,

          width:
            tileWidth,

          height:
            tileHeight,

          buffer: tile,
        });

      } catch (_) {}
    }
  }

  return tiles;
}

// ============================================================================
// GPT IMAGE PAYLOAD
// ============================================================================

export function buildGPTImagePayload(
  enhancedResult,
  mime = 'image/jpeg',
  options = {},
) {

  const payload = [];

  const maxTiles = Number(
    options.maxTiles ?? process.env.GPT_IMAGE_TILES ?? 0,
  );

  const includeCenterCrop =
    options.includeCenterCrop !== false;

  const imageDetail =
    String(options.detail || process.env.GPT_IMAGE_DETAIL || 'auto').trim();

  // ========================================================================
  // ENHANCED MAIN IMAGE
  // ========================================================================

  payload.push({

    type: 'image_url',

    image_url: {

      url:
        `data:${mime};base64,${enhancedResult.enhanced.toString('base64')}`,

      detail: imageDetail,
    },
  });

  // ========================================================================
  // CENTER CROP
  // ========================================================================

  if (
    includeCenterCrop &&
    enhancedResult.centerCrop
  ) {

    payload.push({

      type: 'image_url',

      image_url: {

        url:
          `data:${mime};base64,${enhancedResult.centerCrop.toString('base64')}`,

        detail: imageDetail,
      },
    });
  }

  // ========================================================================
  // TILES — opcional para evitar timeout em web/produção
  // ========================================================================

  const tiles = Array.isArray(enhancedResult.tiles)
    ? enhancedResult.tiles.slice(0, Math.max(0, maxTiles))
    : [];

  for (const tile of tiles) {
    payload.push({
      type: 'image_url',
      image_url: {
        url:
          `data:${mime};base64,${tile.buffer.toString('base64')}`,
        detail: imageDetail,
      },
    });
  }

  return payload;
}

// ============================================================================
// HEMATOLOGY PRESET
// ============================================================================

export async function processHematologyImages(
  uploadedFiles,
) {

  const processed = [];

  for (const file of uploadedFiles) {

    try {

      const result =
        await enhanceMicroscopyImage(
          file.buffer,
        );

      if (
        result.success
      ) {

        processed.push({

          original: file,

          enhanced: result,
        });
      }

    } catch (error) {

      console.error(
        'Process error:',
        error,
      );
    }
  }

  return processed;
}