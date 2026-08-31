/** 画布模块根节点标记，用于外层 ModuleOperation 定位与点击委托 */
export const RESUME_MODULE_ID_ATTR = 'data-resume-module-id';
/** 模块标题区标记，用于分页时避免 header 被页缝腰斩 */
export const RESUME_MODULE_HEADER_ATTR = 'data-resume-module-header';
/** 样式 7 右侧内容容器，矢量导出时截装饰图 */
export const RESUME_H7_PANEL_ATTR = 'data-resume-h7-panel';
/** 标题装饰字（如 header12 水印序号），截图保留、不采为矢量字 */
export const RESUME_HEADER_MARK_ATTR = 'data-resume-header-mark';
/** info1 字段布局标记：导出时避免把 flex 行盒误当成字段文本宽度 */
export const RESUME_INFO1_ATTR = 'data-resume-info1';
/** info1 每一行的布局盒标记，用于 DOCX 按行定位和设置对齐方式 */
export const RESUME_INFO1_ROW_ATTR = 'data-resume-info1-row';
/** 经历/教育等左右分栏行头，snap 导出前用于精准摊平 flex */
export const RESUME_ITEM_ROW_ATTR = 'data-resume-item-row';
