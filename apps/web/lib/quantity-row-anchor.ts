export function quantityRowAnchorId(spaceName: string): string {
  return `quantity-row-${encodeURIComponent(spaceName)}`;
}

export function quantityRowAnchorHref(spaceName: string): string {
  return `#${quantityRowAnchorId(spaceName)}`;
}
