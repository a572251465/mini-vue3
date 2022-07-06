export function isRef(r: any) {
  return !!(r && r.__v_isRef === true)
}
