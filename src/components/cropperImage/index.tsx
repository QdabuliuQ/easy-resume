import { Modal } from 'antd';
import { forwardRef, memo, useImperativeHandle, useRef, useState } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useMemoizedFn } from 'ahooks';

const scale = 1;

function CropperImage(props: any, ref: any) {
  const cropperRef = useRef<any>(null);
  const [show, setShow] = useState(false);
  const [image, setImage] = useState('');
  const [crop, setCrop] = useState<any>();
  const imgRef = useRef<HTMLImageElement>(null);
  const callbackRef = useRef<(image: string) => void | null>(null);

  useImperativeHandle(ref, () => ({
    showModal,
  }));

  const showModal = useMemoizedFn(
    (image: string, callback: (image: string) => void) => {
      setImage(image);
      setShow(true);
      callbackRef.current = callback;
    }
  );

  const hideModal = useMemoizedFn(() => setShow(false));

  // 图片加载完成后的处理
  const onImageLoad = useMemoizedFn((e) => {
    const { width, height } = e.currentTarget;

    // 默认居中裁剪，宽高比为1:1
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 70,
        },
        5 / 7, // 宽高比
        width,
        height
      ),
      width,
      height
    );

    setCrop(crop);
  });

  // 完成裁剪
  const cropImage = () => {
    if (imgRef.current && crop.width && crop.height) {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      // 计算实际裁剪尺寸（考虑缩放因子）
      const actualCropWidth = crop.width * scaleX * scale;
      const actualCropHeight = crop.height * scaleY * scale;

      canvas.width = actualCropWidth;
      canvas.height = actualCropHeight;

      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(
          imgRef.current,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          actualCropWidth,
          actualCropHeight
        );

        const base64Image = canvas.toDataURL('image/jpeg');
        setShow(false);
        callbackRef.current?.(base64Image);
      }
    }
  };

  return (
    <Modal
      open={show}
      onCancel={hideModal}
      centered
      title='图片裁剪'
      okText='确定'
      cancelText='取消'
      onOk={cropImage}
    >
      <div className='flex justify-center items-center'>
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          circularCrop={false} // 设置为true可以实现圆形裁剪
          aspect={5 / 7} // 宽高比
        >
          <img
            ref={imgRef}
            src={image}
            alt='裁剪图片'
            style={{ maxHeight: '400px' }}
            onLoad={onImageLoad}
          />
        </ReactCrop>
      </div>
    </Modal>
  );
}

export default memo(forwardRef(CropperImage));
