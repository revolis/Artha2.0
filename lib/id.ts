/**
 * A new record id.
 *
 * Every id column in the database is a uuid, so the old `e_${Date.now()}` style
 * would be rejected outright — and two records created in the same millisecond
 * would have collided anyway. Generated on the client rather than left to the
 * database so an optimistic insert already knows its own id.
 */
export function newId(): string {
  return crypto.randomUUID()
}
