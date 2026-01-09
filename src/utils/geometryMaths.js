/**
 * Calculates vertices for different room shapes
 * Returns an array of [x, z] coordinates
 */
export const getRoomVertices = (shape, dims) => {
  const { l1, w1, l2, w2 } = dims;

  switch (shape) {
    case 'RECTANGLE':
      return [
        [0, 0], [l1, 0], [l1, w1], [0, w1]
      ];

    case 'L_SHAPE':
      // Basic L-shape logic
      return [
        [0, 0], 
        [l1, 0], 
        [l1, w1], 
        [l1 - l2, w1], 
        [l1 - l2, w1 + w2], 
        [0, w1 + w2]
      ];

    case 'T_SHAPE':
      // Basic T-shape logic
      const indent = (l1 - l2) / 2;
      return [
        [0, 0], [l1, 0], [l1, w1], 
        [l1 - indent, w1], [l1 - indent, w1 + w2], 
        [indent, w1 + w2], [indent, w1], [0, w1]
      ];

    default:
      return [[0,0], [l1,0], [l1,w1], [0,w1]];
  }
};