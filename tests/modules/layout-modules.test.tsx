import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SectionModuleShell from '@/modules/layout/sectionModuleShell';
import Margin from '@/modules/margin';
import Page from '@/modules/page';
import RoundedTopBanner from '@/modules/page/RoundedTopBanner';
import SideColPanel from '@/modules/page/SideColPanel';
import TopLineBanner from '@/modules/page/TopLineBanner';
import { makeGlobalStyle } from './fixtures';

describe('layout modules', () => {
  it('renders a spacer with the requested height', () => {
    const { container } = render(<Margin height={32} />);

    expect(container.firstElementChild).toHaveStyle({ height: '32px' });
  });

  it('renders section shell with header and module id attributes', () => {
    const { container } = render(
      <SectionModuleShell
        moduleId='skill-1'
        activeModuleId='active-skill'
        moduleType='skill'
        headerConfig={{ title: '技能', sectionOrdinal: 2 }}
        globalStyle={makeGlobalStyle({ headerType: 10 })}
      >
        <span>模块内容</span>
      </SectionModuleShell>
    );

    expect(screen.getByText('技能')).toBeInTheDocument();
    expect(screen.getByText('模块内容')).toBeInTheDocument();
    expect(container.querySelector('#skill-1')).toHaveAttribute('data-resume-module-id', 'active-skill');
  });

  it('renders section shell without header and keeps type 7 body panel', () => {
    render(
      <SectionModuleShell
        moduleId='other-1'
        headerConfig={{ title: '隐藏标题' }}
        globalStyle={makeGlobalStyle({ headerType: 7 })}
        showHeader={false}
      >
        <span>仅内容</span>
      </SectionModuleShell>
    );

    expect(screen.queryByText('隐藏标题')).not.toBeInTheDocument();
    expect(screen.getByText('仅内容')).toBeInTheDocument();
  });

  it('renders top and rounded banners with color and height', () => {
    const { container, rerender } = render(<TopLineBanner color='#f00' height={8} />);

    expect(container.firstElementChild).toHaveStyle({ height: '8px', backgroundColor: '#f00' });

    rerender(<RoundedTopBanner color='#0f0' height={40} />);

    expect(container.firstElementChild).toHaveStyle({ height: '40px' });
    expect(container.firstElementChild?.firstElementChild).toHaveStyle({ backgroundColor: '#0f0' });
  });

  it('renders side column panel with optional content', () => {
    const { container, rerender } = render(
      <SideColPanel color='#123456' padding={16}>
        <span>侧栏</span>
      </SideColPanel>
    );

    expect(screen.getByText('侧栏')).toBeInTheDocument();
    expect(container.querySelector('[data-resume-side-col]')).toHaveStyle({
      backgroundColor: '#123456',
      padding: '16px'
    });

    rerender(<SideColPanel color='#123456' padding={16} />);
    expect(screen.queryByText('侧栏')).not.toBeInTheDocument();
  });

  it('renders page default, line, rounded and side-column layouts', () => {
    const { container, rerender } = render(
      <Page {...makeGlobalStyle()} snapTarget>
        <main>默认页面</main>
      </Page>
    );

    expect(screen.getByText('默认页面')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-resume-export-page', '');

    rerender(
      <Page {...makeGlobalStyle({ layout: 'line' })}>
        <main>线条页面</main>
      </Page>
    );
    expect(screen.getByText('线条页面')).toBeInTheDocument();
    expect(container.querySelector('.pointer-events-none')).toHaveStyle({ backgroundColor: '#1677ff' });

    rerender(
      <Page {...makeGlobalStyle({ layout: 'rounded' })} firstPage>
        <main>弧形首页</main>
      </Page>
    );
    expect(screen.getByText('弧形首页')).toBeInTheDocument();

    rerender(
      <Page {...makeGlobalStyle({ layout: 'leftCol' })} sideSlot={<aside>个人信息</aside>}>
        <main>侧栏页面</main>
      </Page>
    );
    expect(screen.getByText('个人信息')).toBeInTheDocument();
    expect(screen.getByText('侧栏页面')).toBeInTheDocument();
    expect(container.querySelector('[data-resume-side-col]')).toBeInTheDocument();
  });

  it('renders continuous snap pages and right side columns', () => {
    const { container, rerender } = render(
      <Page {...makeGlobalStyle()} snapTarget continuous>
        <main>连续长图</main>
      </Page>
    );

    expect(screen.getByText('连续长图')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveStyle({ height: 'auto', overflow: 'visible' });

    rerender(
      <Page {...makeGlobalStyle({ layout: 'rightCol', padding: 12 })} sideSlot={<aside>右侧栏</aside>}>
        <main>右栏页面</main>
      </Page>
    );

    expect(screen.getByText('右侧栏')).toBeInTheDocument();
    expect(screen.getByText('右栏页面')).toBeInTheDocument();
    expect(container.querySelector('[data-resume-side-col]')).toHaveStyle({ padding: '12px' });
  });
});
