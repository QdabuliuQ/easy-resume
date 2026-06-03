import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Certificate from '@/modules/certificate';
import Education from '@/modules/education';
import Job from '@/modules/job';
import Other from '@/modules/other';
import Project from '@/modules/project';
import Skill from '@/modules/skill';
import { makeGlobalStyle } from './fixtures';

describe('resume content modules', () => {
  it('renders certificate items with dates', () => {
    render(
      <Certificate
        globalStyle={makeGlobalStyle()}
        config={{
          id: 'certificate-1',
          type: 'certificate',
          options: {
            title: '证书',
            items: [
              { id: 'cert-1', name: 'PMP', date: '2024.06' },
              { id: 'cert-2', name: 'AWS SAA', date: '2025.01' }
            ]
          }
        }}
      />
    );

    expect(screen.getByText('证书')).toBeInTheDocument();
    expect(screen.getByText('PMP')).toBeInTheDocument();
    expect(screen.getByText('AWS SAA')).toBeInTheDocument();
    expect(screen.getByText('2025.01')).toBeInTheDocument();
  });

  it('returns null when certificate config is missing', () => {
    const { container } = render(
      <Certificate config={undefined as never} globalStyle={makeGlobalStyle()} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders education details and falls back to default title', () => {
    render(
      <Education
        globalStyle={makeGlobalStyle()}
        config={{
          id: 'education-1',
          type: 'education',
          options: {
            title: ' ',
            items: [
              {
                id: 'edu-1',
                school: '浙江大学',
                degree: '本科',
                major: '计算机科学',
                startDate: '2018.09',
                endDate: '2022.06',
                city: '浙江/杭州',
                tags: ['985', '双一流'],
                academy: '软件学院',
                description: '<p>GPA 3.8，主修数据结构</p>'
              }
            ]
          }
        }}
      />
    );

    expect(screen.getByText('教育经历')).toBeInTheDocument();
    expect(screen.getByText('浙江大学')).toBeInTheDocument();
    expect(screen.getByText('985')).toBeInTheDocument();
    expect(screen.getByText(/计算机科学 本科 软件学院/)).toBeInTheDocument();
    expect(screen.getByText(/GPA 3.8/)).toBeInTheDocument();
  });

  it('renders education safely when options are missing or malformed', () => {
    const { rerender } = render(
      <Education
        globalStyle={makeGlobalStyle()}
        config={{ id: 'education-empty', type: 'education', options: undefined as never }}
      />
    );

    expect(screen.getByText('教育经历')).toBeInTheDocument();

    rerender(
      <Education
        globalStyle={makeGlobalStyle()}
        config={{
          id: 'education-malformed',
          type: 'education',
          options: { title: '教育', items: undefined as never }
        }}
      />
    );

    expect(screen.getByText('教育')).toBeInTheDocument();
  });

  it('renders job details and skips optional row when empty', () => {
    const { rerender } = render(
      <Job
        globalStyle={makeGlobalStyle()}
        config={{
          id: 'job-1',
          type: 'job',
          options: {
            title: '',
            items: [
              {
                id: 'job-item-1',
                company: '字节跳动',
                post: '前端工程师',
                department: '商业化',
                city: '北京/朝阳',
                startDate: '2022.07',
                endDate: '至今',
                description: '<ul><li>负责简历编辑器性能优化</li></ul>'
              }
            ]
          }
        }}
      />
    );

    expect(screen.getByText('工作经历')).toBeInTheDocument();
    expect(screen.getByText('字节跳动')).toBeInTheDocument();
    expect(screen.getByText(/前端工程师 商业化/)).toBeInTheDocument();
    expect(screen.getByText('负责简历编辑器性能优化')).toBeInTheDocument();

    rerender(
      <Job
        globalStyle={makeGlobalStyle()}
        config={{
          id: 'job-2',
          type: 'job',
          options: {
            title: '工作',
            items: [
              {
                id: 'job-item-2',
                company: '独立开发',
                post: '',
                department: '',
                city: '',
                startDate: '2021.01',
                endDate: '2021.12',
                description: '<p><br></p>'
              }
            ]
          }
        }}
      />
    );

    expect(screen.getByText('独立开发')).toBeInTheDocument();
    expect(screen.queryByText('负责简历编辑器性能优化')).not.toBeInTheDocument();
  });

  it('renders project role and hides empty rich text', () => {
    render(
      <Project
        globalStyle={makeGlobalStyle()}
        config={{
          id: 'project-1',
          type: 'project',
          options: {
            title: '',
            items: [
              {
                id: 'project-item-1',
                name: 'Easy Resume',
                role: '核心开发',
                startDate: '2024.01',
                endDate: '2024.12',
                description: '<p></p>'
              }
            ]
          }
        }}
      />
    );

    expect(screen.getByText('项目经历')).toBeInTheDocument();
    expect(screen.getByText('Easy Resume')).toBeInTheDocument();
    expect(screen.getByText('核心开发')).toBeInTheDocument();
    expect(document.querySelector('.ql-editor')).not.toBeInTheDocument();
  });

  it('returns null for modules that guard missing config', () => {
    const { container, rerender } = render(<Job config={undefined as never} globalStyle={makeGlobalStyle()} />);

    expect(container).toBeEmptyDOMElement();

    rerender(<Project config={undefined as never} globalStyle={makeGlobalStyle()} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<Skill config={undefined as never} globalStyle={makeGlobalStyle()} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<Other config={undefined as never} globalStyle={makeGlobalStyle()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders skill and other rich text only when plain text exists', () => {
    const { rerender } = render(
      <Skill
        globalStyle={makeGlobalStyle()}
        config={{
          id: 'skill-1',
          type: 'skill',
          options: { title: '技能', description: '<p>React、TypeScript、Vitest</p>' }
        }}
      />
    );

    expect(screen.getByText('技能')).toBeInTheDocument();
    expect(screen.getByText(/React/)).toBeInTheDocument();

    rerender(
      <Other
        globalStyle={makeGlobalStyle()}
        config={{
          id: 'other-1',
          type: 'other',
          options: { title: '其他', description: '<p>开源贡献者</p>' }
        }}
      />
    );

    expect(screen.getByText('其他')).toBeInTheDocument();
    expect(screen.getByText('开源贡献者')).toBeInTheDocument();
  });
});
