/**
 * 
 * @param fields 
 * @returns {boolean} -> if there is no problem, returns true
 */

export const stringFieldValidator = (fields: string[]): boolean => {
  fields.forEach(f => {
    if (f === "")
      return false
  })
  return true
}


/**
 * 
 * @param fields 
 * @returns {boolean} -> if there is no problem, returns true
 */

export const numberFieldValidator = (fields: string[]): boolean => {
  fields.forEach(f => {
    if (isNaN(Number(f)))
      return false
  })
  return true
}