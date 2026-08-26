let editPrefetchPromise: Promise<void> | null = null;

/** 首页 hover「开始编辑」时预拉编辑页主 chunk */
export function prefetchEditPage(): void {
  if (typeof window === 'undefined') return;
  if (editPrefetchPromise) return;
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(
    navigator.userAgent,
  );
  editPrefetchPromise = (mobile ? import('@/views/edit/mobile') : import('@/views/edit'))
    .then(() => undefined)
    .catch(() => {
      editPrefetchPromise = null;
    });
}
