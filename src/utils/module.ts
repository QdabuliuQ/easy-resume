export function getRandomId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function computedModulePosition(pages: Array<any>, pageHeight: number) {
  if (pages.length === 0) return [];
  const newPages: Array<Array<any>> = [[]];
  let height = 0;
  for (const item of pages) {
    for (const module of item) {
      if (module.height + module.top + height > pageHeight) {
        newPages.push([module]);
        height = module.height + module.top;
      } else {
        newPages[newPages.length - 1].push(module);
        height += module.height + module.top;
      }
    }
  }
  console.log(newPages);
  return newPages;
}

export function getModuleInfo(
  pages: Array<{ moduleMargin: number; modules: Array<any> }>,
  moduleActive: string
) {
  for (const page of pages) {
    for (const module of page.modules) {
      if (module.id === moduleActive) {
        return module;
      }
    }
  }
  return null;
}
