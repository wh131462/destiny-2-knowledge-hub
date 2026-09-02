export const requiredBuildFields = [
  'id', 'name', 'classId', 'subclassId', 'activityIds', 'goal', 'abilities',
  'exoticArmorId', 'armorSetId', 'weapons', 'armorMods', 'baseStats', 'targetStats',
  'mechanicIds', 'championCoverage', 'rotation', 'limitations', 'alternatives',
  'acquisitionPriority', 'scoring', 'difficulty', 'confidence', 'verifiedAt', 'sourceIds'
]

export function validateShape(entity, fields, entityName = 'entity') {
  const errors = []
  for (const field of fields) {
    if (entity[field] === undefined || entity[field] === null || entity[field] === '') {
      errors.push(`${entityName}.${field} 缺失`)
    }
  }
  return errors
}

export function findDuplicateIds(collection) {
  const seen = new Set()
  const duplicates = new Set()
  for (const item of collection) {
    if (seen.has(item.id)) duplicates.add(item.id)
    seen.add(item.id)
  }
  return [...duplicates]
}
