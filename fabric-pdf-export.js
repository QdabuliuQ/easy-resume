/**
 * Fabric.js 导出 PDF 示例
 * 需要引入的库:
 * - fabric.js: https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js
 * - jspdf: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
 */

// 创建一个导出 PDF 的函数
function exportCanvasToPDF(canvas, options = {}) {
  // 默认配置
  const config = {
    fileName: options.fileName || 'fabric-export.pdf',
    format: options.format || 'a4',
    orientation: options.orientation || 'portrait',
    unit: options.unit || 'mm',
    quality: options.quality || 1.0,
    margin: options.margin || 10,
  };

  // 获取 canvas 尺寸
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();

  // 创建 jsPDF 实例
  const pdf = new jspdf.jsPDF({
    orientation: config.orientation,
    unit: config.unit,
    format: config.format,
  });

  // 计算页面尺寸
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // 计算内容区域尺寸（减去边距）
  const contentWidth = pageWidth - config.margin * 2;
  const contentHeight = pageHeight - config.margin * 2;

  // 计算缩放比例（适应页面）
  const scale = Math.min(
    contentWidth / canvasWidth,
    contentHeight / canvasHeight
  );

  // 计算居中位置
  const x = config.margin + (contentWidth - canvasWidth * scale) / 2;
  const y = config.margin + (contentHeight - canvasHeight * scale) / 2;

  // 将 canvas 转换为图像数据
  const imgData = canvas.toDataURL({
    format: 'png',
    quality: config.quality,
  });

  // 添加图像到 PDF
  pdf.addImage(imgData, 'PNG', x, y, canvasWidth * scale, canvasHeight * scale);

  // 保存 PDF
  pdf.save(config.fileName);
}

/**
 * 多页导出函数 - 用于处理多个 canvas 或大型 canvas 分页
 */
function exportMultipleCanvasesToPDF(canvases, options = {}) {
  // 默认配置
  const config = {
    fileName: options.fileName || 'fabric-export.pdf',
    format: options.format || 'a4',
    orientation: options.orientation || 'portrait',
    unit: options.unit || 'mm',
    quality: options.quality || 1.0,
    margin: options.margin || 10,
  };

  // 创建 jsPDF 实例
  const pdf = new jspdf.jsPDF({
    orientation: config.orientation,
    unit: config.unit,
    format: config.format,
  });

  // 计算页面尺寸
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // 计算内容区域尺寸（减去边距）
  const contentWidth = pageWidth - config.margin * 2;
  const contentHeight = pageHeight - config.margin * 2;

  // 处理每个 canvas
  canvases.forEach((canvas, index) => {
    // 如果不是第一页，添加新页
    if (index > 0) {
      pdf.addPage();
    }

    // 获取 canvas 尺寸
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // 计算缩放比例（适应页面）
    const scale = Math.min(
      contentWidth / canvasWidth,
      contentHeight / canvasHeight
    );

    // 计算居中位置
    const x = config.margin + (contentWidth - canvasWidth * scale) / 2;
    const y = config.margin + (contentHeight - canvasHeight * scale) / 2;

    // 将 canvas 转换为图像数据
    const imgData = canvas.toDataURL({
      format: 'png',
      quality: config.quality,
    });

    // 添加图像到 PDF
    pdf.addImage(
      imgData,
      'PNG',
      x,
      y,
      canvasWidth * scale,
      canvasHeight * scale
    );
  });

  // 保存 PDF
  pdf.save(config.fileName);
}

/**
 * 创建可选中文本的 PDF（更高级的方法）
 * 这个方法会尝试提取文本对象并在 PDF 中保留为文本
 */
function exportCanvasWithSelectableText(canvas, options = {}) {
  // 默认配置
  const config = {
    fileName: options.fileName || 'fabric-export.pdf',
    format: options.format || 'a4',
    orientation: options.orientation || 'portrait',
    unit: options.unit || 'mm',
    margin: options.margin || 10,
  };

  // 创建 jsPDF 实例
  const pdf = new jspdf.jsPDF({
    orientation: config.orientation,
    unit: config.unit,
    format: config.format,
  });

  // 计算页面尺寸
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // 计算内容区域尺寸（减去边距）
  const contentWidth = pageWidth - config.margin * 2;
  const contentHeight = pageHeight - config.margin * 2;

  // 获取 canvas 尺寸
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();

  // 计算缩放比例（适应页面）
  const scale = Math.min(
    contentWidth / canvasWidth,
    contentHeight / canvasHeight
  );

  // 计算居中位置
  const baseX = config.margin + (contentWidth - canvasWidth * scale) / 2;
  const baseY = config.margin + (contentHeight - canvasHeight * scale) / 2;

  // 首先绘制非文本对象作为背景
  const backgroundObjects = canvas
    .getObjects()
    .filter((obj) => obj.type !== 'text');

  if (backgroundObjects.length > 0) {
    // 创建临时 canvas 只包含非文本对象
    const tempCanvas = new fabric.Canvas(document.createElement('canvas'), {
      width: canvasWidth,
      height: canvasHeight,
    });

    // 复制背景对象到临时 canvas
    backgroundObjects.forEach((obj) => {
      tempCanvas.add(obj.clone());
    });
    tempCanvas.renderAll();

    // 将背景添加到 PDF
    const bgImgData = tempCanvas.toDataURL({
      format: 'png',
      quality: 1.0,
    });

    pdf.addImage(
      bgImgData,
      'PNG',
      baseX,
      baseY,
      canvasWidth * scale,
      canvasHeight * scale
    );

    // 清理临时 canvas
    tempCanvas.dispose();
  }

  // 然后处理文本对象
  const textObjects = canvas.getObjects().filter((obj) => obj.type === 'text');

  textObjects.forEach((textObj) => {
    // 获取文本属性
    const text = textObj.text;
    const fontSize = textObj.fontSize * scale;
    const fontFamily = textObj.fontFamily || 'Helvetica';
    const fontStyle =
      (textObj.fontWeight === 'bold' ? 'bold' : '') +
      (textObj.fontStyle === 'italic' ? 'italic' : '');

    // 计算位置（考虑缩放和原点）
    const left = baseX + textObj.left * scale;
    const top = baseY + textObj.top * scale;

    // 设置 PDF 文本样式
    pdf.setFont(fontFamily, fontStyle);
    pdf.setFontSize(fontSize);
    pdf.setTextColor(textObj.fill || '#000000');

    // 添加文本到 PDF
    pdf.text(text, left, top + fontSize * 0.3); // 调整垂直位置以匹配 fabric.js
  });

  // 保存 PDF
  pdf.save(config.fileName);
}

// 使用示例
function createExampleCanvas() {
  // 创建 canvas 元素
  const canvasElement = document.createElement('canvas');
  canvasElement.width = 600;
  canvasElement.height = 400;
  document.body.appendChild(canvasElement);

  // 创建 Fabric.js canvas
  const canvas = new fabric.Canvas(canvasElement);

  // 添加一个矩形
  const rect = new fabric.Rect({
    left: 100,
    top: 100,
    width: 100,
    height: 100,
    fill: 'red',
    stroke: 'black',
    strokeWidth: 2,
  });
  canvas.add(rect);

  // 添加一个圆形
  const circle = new fabric.Circle({
    left: 300,
    top: 100,
    radius: 50,
    fill: 'blue',
    stroke: 'black',
    strokeWidth: 2,
  });
  canvas.add(circle);

  // 添加文本
  const text = new fabric.Text('Hello, Fabric.js!', {
    left: 150,
    top: 250,
    fontSize: 24,
    fontFamily: 'Arial',
    fill: 'black',
  });
  canvas.add(text);

  return canvas;
}

// 示例用法
// 假设页面已加载 fabric.js 和 jspdf
document.addEventListener('DOMContentLoaded', function () {
  const canvas = createExampleCanvas();

  // 创建导出按钮
  const exportButton = document.createElement('button');
  exportButton.textContent = '导出为PDF';
  exportButton.style.margin = '20px';
  exportButton.addEventListener('click', function () {
    exportCanvasToPDF(canvas, { fileName: 'fabric-example.pdf' });
  });
  document.body.appendChild(exportButton);

  // 创建导出可选中文本的按钮
  const exportTextButton = document.createElement('button');
  exportTextButton.textContent = '导出带可选中文本的PDF';
  exportTextButton.style.margin = '20px';
  exportTextButton.addEventListener('click', function () {
    exportCanvasWithSelectableText(canvas, {
      fileName: 'fabric-text-example.pdf',
    });
  });
  document.body.appendChild(exportTextButton);
});

// 注意：要在HTML中引入必要的库
/*
<!DOCTYPE html>
<html>
<head>
  <title>Fabric.js PDF Export</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="fabric-pdf-export.js"></script>
</head>
<body>
  <h1>Fabric.js PDF Export Example</h1>
</body>
</html>
*/
