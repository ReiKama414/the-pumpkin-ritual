import * as THREE from 'three'
import polygonClipping from 'polygon-clipping'
import type { Form } from './ritual'

type Point = [number, number]
type Ring = Point[]
export const PETAL_COUNT = 10
const TAU = Math.PI * 2

const reflect = (points: Ring): Ring => points.map(([x, y]): Point => [-x, y]).reverse()
const ellipse = (x: number, y: number, rx: number, ry: number, count = 32): Ring =>
  Array.from({ length: count }, (_, i) => [x + Math.cos(i / count * TAU) * rx, y + Math.sin(i / count * TAU) * ry])

export function faceContours(form: Form, secret = false): Ring[] {
  if (secret) return [ellipse(-.39, .3, .17, .22), ellipse(.39, .3, .17, .22),
    [[-.52, -.2], [0, -.66], [.52, -.2], [.26, -.12], [0, -.31], [-.26, -.12]]]
  const classicEye: Ring = [[-.66, .22], [-.19, .22], [-.40, .57]]
  const smile: Ring = [[-.72, -.12], [-.48, -.26], [-.18, -.31], [-.18, -.20], [.01, -.20], [.04, -.33], [.32, -.29], [.70, -.12], [.54, -.46], [.32, -.59], [.02, -.63], [-.11, -.61], [-.15, -.48], [-.31, -.48], [-.34, -.56], [-.54, -.43]]
  switch (form) {
    case 'Classic': return [classicEye, reflect(classicEye), [[-.09, -.06], [.10, -.06], [.01, .10]], smile]
    case 'Wicked': {
      const eye: Ring = [[-.76, .52], [-.17, .26], [-.25, .11], [-.64, .20]]
      return [eye, reflect(eye), [[0, .07], [-.10, -.10], [.10, -.10]],
        [[-.79, -.13], [-.52, -.28], [-.41, -.18], [-.30, -.36], [-.13, -.23], [0, -.40], [.15, -.23], [.29, -.36], [.43, -.19], [.56, -.28], [.79, -.13], [.58, -.51], [.37, -.45], [.23, -.62], [.06, -.52], [-.10, -.65], [-.27, -.51], [-.44, -.56], [-.62, -.42]]]
    }
    case 'Haunted': return [ellipse(-.38, .33, .19, .29), ellipse(.38, .33, .19, .29), ellipse(0, -.38, .23, .27)]
    case 'Hollow': return [ellipse(-.40, .28, .27, .29), ellipse(.40, .28, .27, .29), [[0, .02], [-.11, -.18], [.11, -.18]],
      [[-.48, -.35], [-.26, -.30], [-.18, -.42], [-.09, -.33], [0, -.45], [.09, -.33], [.18, -.42], [.26, -.30], [.48, -.35], [.40, -.62], [-.40, -.62]]]
    case 'Cursed': {
      const eye: Ring = [[-.78, .36], [-.58, .48], [-.31, .26], [-.17, .28], [-.29, .05], [-.46, .16], [-.55, .10]]
      return [eye, reflect(eye), [[-.07, .02], [.09, -.09], [-.07, -.16]],
        [[-.68, -.15], [-.41, -.31], [-.22, -.21], [-.08, -.39], [.09, -.28], [.23, -.41], [.42, -.25], [.67, -.18], [.48, -.53], [.30, -.46], [.15, -.65], [-.05, -.50], [-.23, -.62], [-.41, -.44], [-.55, -.49]]]
    }
  }
}

// A lobed, slightly asymmetric parametric surface. Every petal shares the same
// boundary function, so reconstruction closes exactly without overlapping shells.
export function pumpkinSurface(theta: number, t: number, inner = false) {
  const profile = Math.pow(Math.max(0, 1 - t * t), .47)
  const ribs = 1 + .078 * Math.cos(PETAL_COUNT * theta + Math.PI)
  const asymmetry = 1 + .023 * Math.sin(3 * theta + .4) + .014 * Math.cos(7 * theta + t * 2)
  const radius = (.035 + 1.43 * profile) * ribs * asymmetry
  const y = 1.27 * t - .14 * Math.sign(t) * Math.pow(Math.abs(t), 9)
    + .032 * Math.sin(theta * 3) * (1 - t * t)
  return new THREE.Vector3(
    Math.sin(theta) * radius * (inner ? .885 : 1),
    y * (inner ? .89 : 1),
    Math.cos(theta) * radius * (inner ? .885 : 1),
  )
}

function surfaceNormal(a: number, b: number, inner: boolean) {
  const da = pumpkinSurface(a + .0001, b, inner).sub(pumpkinSurface(a - .0001, b, inner))
  const db = pumpkinSurface(a, Math.min(.99999, b + .0001), inner).sub(pumpkinSurface(a, Math.max(-.99999, b - .0001), inner))
  const normal = da.cross(db).normalize()
  return inner ? normal.negate() : normal
}

export function createPetal(index: number, form: Form, secret = false) {
  const start = -Math.PI + index * TAU / PETAL_COUNT
  const end = start + TAU / PETAL_COUNT
  const holes = faceContours(form, secret)
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const geometry = new THREE.BufferGeometry()
  const append = (p: THREE.Vector3, n: THREE.Vector3, uv: Point) => {
    positions.push(p.x, p.y, p.z)
    normals.push(n.x, n.y, n.z)
    uvs.push(uv[0], uv[1])
  }
  const close = (ring: Ring): Ring => [...ring, ring[0]]
  const polygons = holes.map(ring => [close(ring)])
  const bounds = holes.map(ring => ({ minX: Math.min(...ring.map(p => p[0])), maxX: Math.max(...ring.map(p => p[0])), minY: Math.min(...ring.map(p => p[1])), maxY: Math.max(...ring.map(p => p[1])) }))
  const rect = (x0: number, x1: number, y0: number, y1: number): Point[][] => [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]]

  const skinStart = positions.length / 3
  // Clip only the grid cells touching a carving. Tessellation keeps the curved
  // surface smooth; polygon edges form physical, open contours instead of alpha.
  const cols = 20, rows = 56
  const cells: polygonClipping.MultiPolygon[] = []
  for (let iy = 0; iy < rows; iy++) for (let ix = 0; ix < cols; ix++) {
    const x0 = start + (end - start) * ix / cols, x1 = start + (end - start) * (ix + 1) / cols
    const y0 = -.9999 + 1.9998 * iy / rows, y1 = -.9999 + 1.9998 * (iy + 1) / rows
    const relevant = polygons.filter((_, i) => bounds[i].maxX > x0 && bounds[i].minX < x1 && bounds[i].maxY > y0 && bounds[i].minY < y1)
    const cell = rect(x0, x1, y0, y1)
    cells.push(relevant.length ? polygonClipping.difference(cell, ...relevant) : [cell])
  }
  const appendSurface = (inner: boolean) => {
    for (const cell of cells) for (const polygon of cell) {
      const rings = polygon.map(ring => ring.slice(0, -1).map(([x, y]) => new THREE.Vector2(x, y)))
      if (!rings[0]?.length) continue
      const flat = rings.flat()
      const triangles = THREE.ShapeUtils.triangulateShape(rings[0], rings.slice(1))
      for (const triangle of triangles) {
        const order = inner ? [...triangle].reverse() : triangle
        for (const n of order) {
          const { x, y } = flat[n]
          append(pumpkinSurface(x, y, inner), surfaceNormal(x, y, inner), [x, y])
        }
      }
    }
  }
  appendSurface(false)
  geometry.addGroup(skinStart, positions.length / 3 - skinStart, 0)
  const fleshStart = positions.length / 3
  appendSurface(true)

  // Build flesh walls around every outer edge and every carved opening.
  const boundary = polygonClipping.difference(rect(start, end, -.9999, .9999), ...polygons)
  for (const polygon of boundary) for (const ring of polygon) for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i], b = ring[i + 1]
    const segments = Math.max(1, Math.ceil(Math.max(Math.abs(a[0] - b[0]) / .025, Math.abs(a[1] - b[1]) / .035)))
    for (let j = 0; j < segments; j++) {
      const uv0: Point = [THREE.MathUtils.lerp(a[0], b[0], j / segments), THREE.MathUtils.lerp(a[1], b[1], j / segments)]
      const uv1: Point = [THREE.MathUtils.lerp(a[0], b[0], (j + 1) / segments), THREE.MathUtils.lerp(a[1], b[1], (j + 1) / segments)]
      const p0 = pumpkinSurface(...uv0), p1 = pumpkinSurface(...uv1)
      const q0 = pumpkinSurface(...uv0, true), q1 = pumpkinSurface(...uv1, true)
      const n = p1.clone().sub(p0).cross(q0.clone().sub(p0)).normalize()
      for (const [p, uv] of [[p0, uv0], [p1, uv1], [q0, uv0], [p1, uv1], [q1, uv1], [q0, uv0]] as [THREE.Vector3, Point][]) append(p, n, uv)
    }
  }
  geometry.addGroup(fleshStart, positions.length / 3 - fleshStart, 1)
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.computeBoundingSphere()
  geometry.userData = { index, form, realCarvings: holes.length, shellThickness: .16 }
  return geometry
}

export function createStem() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.08, 0), new THREE.Vector3(.01, 1.27, -.015),
    new THREE.Vector3(.07, 1.48, -.04), new THREE.Vector3(.19, 1.66, -.07),
    new THREE.Vector3(.24, 1.70, -.09),
  ])
  const geometry = new THREE.TubeGeometry(curve, 28, .105, 9, false)
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const taper = 1 - (y - 1.1) * .8
    const center = curve.getPointAt(Math.min(1, Math.max(0, (y - 1.08) / .62)))
    pos.setXYZ(i, center.x + (pos.getX(i) - center.x) * taper, y, center.z + (pos.getZ(i) - center.z) * taper)
  }
  geometry.computeVertexNormals()
  return geometry
}

export function createLeaf() {
  const shape = new THREE.Shape()
  const points: Ring = [[0, -.65], [.06, -.23], [.37, -.35], [.29, -.10], [.58, .03], [.30, .16], [.38, .40], [.13, .29], [0, .64], [-.12, .30], [-.38, .40], [-.30, .16], [-.58, .03], [-.29, -.10], [-.37, -.35], [-.06, -.23]]
  shape.moveTo(...points[0])
  points.slice(1).forEach(p => shape.lineTo(...p))
  shape.closePath()
  const geometry = new THREE.ShapeGeometry(shape)
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setZ(i, .08 * Math.abs(pos.getX(i)) + .04 * Math.sin(pos.getY(i) * 5))
  geometry.computeVertexNormals()
  return geometry
}
