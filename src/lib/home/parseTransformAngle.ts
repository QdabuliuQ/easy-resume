export function parseTransformAngle(transform: string) {
  const m = transform.match(/rotate\(([-\d.]+)rad\)/);
  return m ? Number(m[1]) : 0;
}

export function parseTransformTranslate(transform: string) {
  const m = transform.match(/translate3d\(([-\d.]+)px,\s*([-.\d]+)px/);
  return { tx: m ? Number(m[1]) : 0, ty: m ? Number(m[2]) : 0 };
}
