/**
 * Un artículo solo se muestra si tiene una fotografía propia del artículo.
 * Las fotos genéricas de stock (Unsplash), los marcadores de posición y las URLs vacías
 * o inválidas no cuentan como imagen relacionada con el artículo.
 */
export function hasRelatedImage(url: string | null | undefined): url is string {
  if (!url || typeof url !== 'string') return false;
  const value = url.trim();
  if (!/^https:\/\//i.test(value)) return false;
  if (/unsplash\.com|placeholder|placehold|via\.placeholder|dummyimage|favicon|sprite|\.svg(\?|$)/i.test(value)) return false;
  return true;
}
