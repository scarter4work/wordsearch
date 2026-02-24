export interface DirectionVector {
  name: string
  dRow: number
  dCol: number
}

const BASE_DIRECTIONS: Record<string, DirectionVector> = {
  up: { name: 'up', dRow: -1, dCol: 0 },
  down: { name: 'down', dRow: 1, dCol: 0 },
  upwardHorizontal: { name: 'upwardHorizontal', dRow: -1, dCol: 1 },
  downwardHorizontal: { name: 'downwardHorizontal', dRow: 1, dCol: 1 }
}

const REVERSE_DIRECTIONS: Record<string, DirectionVector> = {
  up: { name: 'up-reverse', dRow: 1, dCol: 0 },
  down: { name: 'down-reverse', dRow: -1, dCol: 0 },
  upwardHorizontal: { name: 'upwardHorizontal-reverse', dRow: 1, dCol: -1 },
  downwardHorizontal: { name: 'downwardHorizontal-reverse', dRow: -1, dCol: -1 }
}

export function getEnabledDirections(config: {
  up: boolean
  down: boolean
  upwardHorizontal: boolean
  downwardHorizontal: boolean
  reverse: boolean
}): DirectionVector[] {
  const dirs: DirectionVector[] = []

  // Always include horizontal-right (standard word search direction)
  dirs.push({ name: 'horizontal', dRow: 0, dCol: 1 })

  if (config.up) dirs.push(BASE_DIRECTIONS.up)
  if (config.down) dirs.push(BASE_DIRECTIONS.down)
  if (config.upwardHorizontal) dirs.push(BASE_DIRECTIONS.upwardHorizontal)
  if (config.downwardHorizontal) dirs.push(BASE_DIRECTIONS.downwardHorizontal)

  if (config.reverse) {
    dirs.push({ name: 'horizontal-reverse', dRow: 0, dCol: -1 })
    if (config.up) dirs.push(REVERSE_DIRECTIONS.up)
    if (config.down) dirs.push(REVERSE_DIRECTIONS.down)
    if (config.upwardHorizontal) dirs.push(REVERSE_DIRECTIONS.upwardHorizontal)
    if (config.downwardHorizontal) dirs.push(REVERSE_DIRECTIONS.downwardHorizontal)
  }

  return dirs
}
