import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import EducationItemsBody from '@/modules/education/educationItemsBody';
import Info1, { type InfoProps } from '@/modules/info/info1';
import JobItemsBody from '@/modules/job/jobItemsBody';
import { makeGlobalStyle } from './fixtures';

const infoMessages = {
  Edit: {
    info1: {
      fields: {
        expectedSalary: '期望薪资',
        phone: '手机号',
      },
    },
    header: { avatarAlt: '{name}的头像' },
  },
};

const infoConfig: InfoProps = {
  id: 'info-1',
  type: 'info1',
  options: {
    name: '张三',
    phone: '13800000000',
    email: '',
    city: '',
    status: '',
    intentCity: '',
    intentPosts: '',
    wechat: '',
    birthday: '',
    gender: '',
    stature: '',
    weight: '',
    ethnic: '',
    origin: '',
    maritalStatus: '',
    politicalStatus: '',
    site: '',
    avatar: '',
    expectedSalary: ['18k', '28k'],
    layout: [['expectedSalary']],
    position: 'left',
    showTitle: true,
  },
};

describe('selectable field ids', () => {
  it('education: split fields and shared tags id', () => {
    render(
      <EducationItemsBody
        moduleId='edu-1'
        selectable
        globalStyle={makeGlobalStyle()}
        items={[
          {
            school: '浙江大学',
            major: '计算机',
            degree: '本科',
            academy: '软件学院',
            tags: ['985', '双一流'],
            startDate: '2018',
            endDate: '2022',
            city: '杭州',
            description: '',
          },
        ]}
      />
    );

    expect(
      document.querySelector('[data-item-id="edu-1_0_school"]')
    ).toBeTruthy();
    expect(
      document.querySelector('[data-item-id="edu-1_0_major"]')
    ).toBeTruthy();
    expect(
      document.querySelector('[data-item-id="edu-1_0_degree"]')
    ).toBeTruthy();
    expect(
      document.querySelector('[data-item-id="edu-1_0_academy"]')
    ).toBeTruthy();
    expect(
      document.querySelector('[data-item-id="edu-1_0_city"]')
    ).toBeTruthy();
    expect(
      document.querySelector('[data-item-id="edu-1_0_date"]')
    ).toBeTruthy();

    const tagsEl = document.querySelector('[data-item-id="edu-1_0_tags"]');
    expect(tagsEl).toBeTruthy();
    expect(tagsEl?.querySelectorAll('span').length).toBe(2);
    expect(document.querySelector('[data-item-id="edu-1_0_tag_0"]')).toBeNull();
  });

  it('info1: expectedSalary uses _0 and _1 ids', async () => {
    render(
      <NextIntlClientProvider locale='zh' messages={infoMessages}>
        <Info1 config={infoConfig} globalStyle={makeGlobalStyle()} />
      </NextIntlClientProvider>
    );

    expect(
      document.querySelector('[data-item-id="info-1_expectedSalary_0"]')
        ?.textContent
    ).toBe('18k');
    expect(
      document.querySelector('[data-item-id="info-1_expectedSalary_1"]')
        ?.textContent
    ).toBe('28k');
    expect(
      document.querySelector('[data-item-id="info-1_expectedSalary"]')
    ).toBeNull();
  });

  it('job: post and department have separate ids', () => {
    render(
      <JobItemsBody
        moduleId='job-1'
        selectable
        globalStyle={makeGlobalStyle()}
        items={[
          {
            company: '字节',
            post: '前端',
            department: '商业化',
            city: '北京',
            startDate: '2022',
            endDate: '至今',
            description: '',
          },
        ]}
      />
    );

    expect(
      document.querySelector('[data-item-id="job-1_0_post"]')?.textContent
    ).toContain('前端');
    expect(
      document.querySelector('[data-item-id="job-1_0_department"]')?.textContent
    ).toContain('商业化');
  });
});
