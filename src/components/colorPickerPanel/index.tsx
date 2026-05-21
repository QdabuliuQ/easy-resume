'use client';
import React, { useContext, useMemo, useState } from 'react';
import classNames from 'classnames';
import useMergedState from 'rc-util/es/hooks/useMergedState';
import ContextIsolator from 'antd/es/_util/ContextIsolator';
import { ConfigContext } from 'antd/es/config-provider/context';
import useCSSVarCls from 'antd/es/config-provider/hooks/useCSSVarCls';
import AntdColorPickerPanel from 'antd/es/color-picker/ColorPickerPanel';
import useModeColor from 'antd/es/color-picker/hooks/useModeColor';
import useStyle from 'antd/es/color-picker/style';
import type { ColorPickerProps } from 'antd/es/color-picker/interface';
import { AggregationColor } from 'antd/es/color-picker/color';
import { generateColor, genAlphaColor, getColorAlpha } from 'antd/es/color-picker/util';
import { hexForColorInput } from '@/lib/resumeColorHex';
type ResumeColorPanelProps = {
  value: string;
  fallback: string;
  presets: readonly string[];
  presetLabel: string;
  onChange: (hex: string) => void;
  onChangeComplete?: (hex: string) => void;
};
export default function ResumeColorPanel({
  value,
  fallback,
  presets,
  presetLabel,
  onChange,
  onChangeComplete,
}: ResumeColorPanelProps) {
  const resolved = hexForColorInput(value, fallback);
  const emit = (css: string) => hexForColorInput(css, fallback);
  const { getPrefixCls, direction } = useContext(ConfigContext);
  const prefixCls = getPrefixCls('color-picker');
  const rootCls = useCSSVarCls(prefixCls);
  const [wrapCSSVar, hashId, cssVarCls] = useStyle(prefixCls, rootCls);
  const [formatValue, setFormatValue] = useMergedState<ColorPickerProps['format']>('hex');
  const [mergedColor, setColor, modeState, setModeState, modeOptions] = useModeColor(
    resolved,
    resolved,
    'single',
  );
  const currentHex = hexForColorInput(mergedColor.toCssString(), fallback);
  const disabledAlpha = true;
  const isAlphaColor = useMemo(() => getColorAlpha(mergedColor) < 100, [mergedColor]);
  const [cachedGradientColor, setCachedGradientColor] = useState<AggregationColor | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [gradientDragging, setGradientDragging] = useState(false);
  const fireComplete = (color: AggregationColor) => {
    if (!onChangeComplete) return;
    let changeColor = generateColor(color);
    if (disabledAlpha && isAlphaColor) changeColor = genAlphaColor(color);
    onChangeComplete(emit(changeColor.toCssString()));
  };
  const onInternalChange = (data: unknown, changeFromPickerDrag?: boolean) => {
    let color = generateColor(data as Parameters<typeof generateColor>[0]);
    if (disabledAlpha && isAlphaColor) color = genAlphaColor(color);
    setColor(color);
    setCachedGradientColor(null);
    onChange(emit(color.toCssString()));
    if (!changeFromPickerDrag) fireComplete(color);
  };
  const onPresetPick = (hex: string) => onInternalChange(generateColor(hex));
  const onInternalModeChange = (newMode: 'single' | 'gradient') => {
    setModeState(newMode);
    if (newMode === 'single' && mergedColor.isGradient()) {
      setActiveIndex(0);
      onInternalChange(new AggregationColor(mergedColor.getColors()[0].color));
      setCachedGradientColor(mergedColor);
    } else if (newMode === 'gradient' && !mergedColor.isGradient()) {
      const baseColor = isAlphaColor ? genAlphaColor(mergedColor) : mergedColor;
      onInternalChange(
        new AggregationColor(
          cachedGradientColor || [
            { percent: 0, color: baseColor },
            { percent: 100, color: baseColor },
          ],
        ),
      );
    }
  };
  return wrapCSSVar(
    <div
      className={classNames(
        prefixCls,
        cssVarCls,
        rootCls,
        hashId,
        'resume-color-panel-root',
        { [`${prefixCls}-rtl`]: direction === 'rtl' },
      )}
    >
      <ContextIsolator form>
        <AntdColorPickerPanel
          prefixCls={prefixCls}
          mode={modeState}
          onModeChange={onInternalModeChange}
          modeOptions={modeOptions}
          value={mergedColor}
          disabledAlpha={disabledAlpha}
          format={formatValue}
          onFormatChange={setFormatValue}
          onChange={onInternalChange}
          onChangeComplete={fireComplete}
          activeIndex={activeIndex}
          onActive={setActiveIndex}
          gradientDragging={gradientDragging}
          onGradientDragging={setGradientDragging}
          panelRender={(_, { components: { Picker } }) => (
            <div className='resume-color-panel-layout'>
              <div className='resume-color-panel-picker'>
                <Picker />
              </div>
              {presets.length ? (
                <div className='resume-color-panel-presets'>
                  <div className='mb-2 text-[11px] text-fg/60'>{presetLabel}</div>
                  <div className='flex flex-col gap-2'>
                    {presets.map((c) => {
                      const hex = hexForColorInput(c, '');
                      const sel = hex === currentHex;
                      return (
                        <button
                          key={c}
                          type='button'
                          aria-label={c}
                          onClick={() => onPresetPick(hex)}
                          className={classNames(
                            'size-7 shrink-0 cursor-pointer rounded-md border-2 transition-transform hover:scale-110',
                            sel ? 'border-fg ring-2 ring-fg/35' : 'border-fg/25',
                          )}
                          style={{ backgroundColor: hex }}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        />
      </ContextIsolator>
    </div>,
  );
}
