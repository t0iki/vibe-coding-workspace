import type { Position } from '../domain/types'

export function getDistance(pos1: Position, pos2: Position): number {
  const dx = pos1.x - pos2.x
  const dy = pos1.y - pos2.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function normalizeVector(dx: number, dy: number): { x: number; y: number } {
  const length = Math.sqrt(dx * dx + dy * dy)
  if (length === 0) return { x: 0, y: 0 }
  return { x: dx / length, y: dy / length }
}

export function getRandomAngle(): number {
  return Math.random() * Math.PI * 2
}

export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}