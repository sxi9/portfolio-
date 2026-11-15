import { createGlobe } from './globe.js';
import { createOnion } from './onion.js';
import { createBoard } from './board.js';
import { createPhone } from './phone.js';
import { createKatana } from './katana.js';
import { createArm } from './arm.js';
import { createCluster } from './cluster.js';
import { createFleet } from './fleet.js';
import { createRack } from './rack.js';
import { createDish } from './dish.js';
import { createChip } from './chip.js';
import { createGpu } from './gpu.js';

// data-figure="<name>" in the markup picks one of these. A figure is only
// built the first time its stage comes near the viewport.
export const FIGURES = {
  globe: createGlobe,
  onion: createOnion,
  board: createBoard,
  phone: createPhone,
  katana: createKatana,
  arm: createArm,
  cluster: createCluster,
  fleet: createFleet,
  rack: createRack,
  dish: createDish,
  chip: createChip,
  gpu: createGpu,
};
