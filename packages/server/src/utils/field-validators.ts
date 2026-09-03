/**
 *
 * @param fields
 * @returns {boolean} -> if there is no problem, returns true
 */

export const stringFieldValidator = (fields: string[]): boolean => {
  return fields.every(f => f !== "" && f !== undefined && f !== null);
}


/**
 *
 * @param fields
 * @returns {boolean} -> if there is no problem, returns true
 */

export const numberFieldValidator = (fields: unknown[]): boolean => {
  return fields.every(f => !isNaN(Number(f)));
}
