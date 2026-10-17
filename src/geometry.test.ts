import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createPetal, faceContours, PETAL_COUNT, pumpkinSurface } from './geometry'
import type { Form } from './ritual'

const names: Form[] = ['Classic', 'Wicked', 'Haunted', 'Hollow', 'Cursed']

describe('procedural carved pumpkin', () => {
  for (const form of names) {
    it(`${form} has ten finite, thick shells and genuinely open eyes`, () => {
      const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
      const geometries = Array.from({ length: PETAL_COUNT }, (_, i) => createPetal(i, form))
      const meshes = geometries.map(geometry => new THREE.Mesh(geometry, [material, material]))
      for (const geometry of geometries) {
        expect(geometry.groups).toHaveLength(2)
        expect(geometry.groups[0].count).toBeGreaterThan(0)
        expect(geometry.groups[1].count).toBeGreaterThan(0)
        expect([...geometry.attributes.position.array].every(Number.isFinite)).toBe(true)
        expect([...geometry.attributes.normal.array].every(Number.isFinite)).toBe(true)
      }
      const cast = (theta: number, t: number) => {
        const p = pumpkinSurface(theta, t)
        const radial = new THREE.Vector3(Math.sin(theta), 0, Math.cos(theta))
        const ray = new THREE.Raycaster(p.clone().addScaledVector(radial, .3), radial.clone().negate(), 0, .65)
        return ray.intersectObjects(meshes)
      }
      for (const eye of faceContours(form).slice(0, 2)) {
        const theta = eye.reduce((sum, p) => sum + p[0], 0) / eye.length
        const t = eye.reduce((sum, p) => sum + p[1], 0) / eye.length
        expect(cast(theta, t), `${form} eye must pass through the shell`).toHaveLength(0)
      }
      const cheek = cast(-1.15, .03)
      expect(cheek.length).toBeGreaterThanOrEqual(2)
      expect(cheek[cheek.length - 1].distance - cheek[0].distance).toBeGreaterThan(.10)
      geometries.forEach(g => g.dispose())
      material.dispose()
    })
  }

  it('all five carving contours differ', () => {
    const contours = names.map(name => JSON.stringify(faceContours(name)))
    expect(new Set(contours).size).toBe(5)
  })

  it('the hidden expression is different from the classic carving', () => {
    expect(faceContours('Classic', true)).not.toEqual(faceContours('Classic'))
  })
})
