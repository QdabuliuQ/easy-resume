/** 内置简历模板（完整 config，可直接 setConfig）
 * 字典对齐 constant.ts：status∈在职|离职|在校；gender/ethnic/maritalStatus/politicalStatus 取对应枚举 value；
 * degree 取 degree；教育 tags 仅 schoolType（985|211|双一流|海外QS前100），不在字典内的条目删除；
 * info1 的 city/origin 存「省/市」（见 info1 split('/')）；job/education 的 city 存「省 - 市」（见面板 join(' - ')）。
 */
export type ResumeTemplateItem = {
  id: string;
  title: string;
  config: {
    name: string;
    globalStyle: Record<string, unknown>;
    pages: Array<{ modules: unknown[] }>;
  };
};

export const resumeTemplates: ResumeTemplateItem[] = [
  {
    id: 'fe',
    title: '前端工程师简历模板',
    config: {
      name: '前端工程师简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '陈峰',
                phone: '13512345678',
                email: 'chenfeng@163.com',
                city: '广东/深圳',
                status: '在职',
                intentCity: '深圳、广州、东莞',
                intentPosts: '前端开发工程师,Vue开发',
                wechat: 'chenfeng_fe',
                birthday: '1996-03-12',
                gender: '男',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '广东/广州',
                maritalStatus: '未婚',
                politicalStatus: '群众',
                site: 'https://github.com/chenfeng-fe',
                expectedSalary: ['18k', '28k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat', 'site'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '精通HTML/CSS/JS ES6+；熟练Vue3/React/Next.js；掌握Vite/Webpack工程化；擅长低代码/可视化/后台系统开发；熟悉接口联调、性能优化、Git协作。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '5年前端开发经验，独立负责项目全流程；技术栈全面，学习能力强，抗压性好，具备良好的业务理解与问题解决能力。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '深圳智慧科技有限公司',
                    post: '前端开发工程师',
                    department: '研发部',
                    city: '广东 - 深圳',
                    startDate: '2021-03-01',
                    endDate: '2025-04-01',
                    description:
                      '负责企业低代码平台、数据可视化、后台管理系统开发；基于Vue3+Vite搭建项目架构；封装通用组件，优化页面性能，提升用户体验。',
                  },
                  {
                    company: '广州软通科技',
                    post: '前端开发工程师',
                    department: '技术部',
                    city: '广东 - 广州',
                    startDate: '2019-07-01',
                    endDate: '2021-02-01',
                    description:
                      '开发企业官网、H5活动页、后台系统；负责移动端适配、样式兼容、需求迭代与上线。',
                  },
                ],
              },
            },
            {
              type: 'project',
              id: '5',
              options: {
                title: '项目经历',
                items: [
                  {
                    name: '企业低代码开发平台',
                    role: '前端核心开发',
                    startDate: '2022-05-01',
                    endDate: '2024-11-01',
                    description:
                      '负责画布拖拽、组件配置、表单渲染；封装30+业务组件，支持页面快速搭建，提升研发效率60%。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '广东工业大学',
                    degree: '本科',
                    major: '计算机科学与技术',
                    startDate: '2015-09-01',
                    endDate: '2019-06-01',
                    city: '广东 - 广州',
                    tags: ['211', '双一流'],
                    academy: '计算机学院',
                    description: '主修前端、计算机网络、数据结构、数据库。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [
                  { name: '前端开发工程师认证', date: '2020-10-01' },
                  { name: '计算机二级', date: '2017-06-01' },
                ],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'be',
    title: '后端工程师简历模板',
    config: {
      name: '后端工程师简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '刘健',
                phone: '13812349876',
                email: 'liujian@163.com',
                city: '广东/广州',
                status: '在职',
                intentCity: '广州、深圳、佛山',
                intentPosts: '后端工程师,Java开发',
                wechat: 'liujian_java',
                birthday: '1995-08-15',
                gender: '男',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '湖南/长沙',
                maritalStatus: '未婚',
                politicalStatus: '群众',
                site: 'https://gitee.com/liujian-java',
                expectedSalary: ['18k', '30k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat', 'site'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '精通Java/Python；熟练SpringBoot/SpringCloud微服务；熟悉MySQL/Redis/MongoDB；掌握接口开发、分布式、消息队列、服务器部署。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '5年后端开发经验，擅长微服务架构、高并发系统设计；具备良好的数据库优化、接口设计、问题排查能力。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '广州云科软件',
                    post: '后端开发工程师',
                    department: '技术部',
                    city: '广东 - 广州',
                    startDate: '2021-02-01',
                    endDate: '2025-04-01',
                    description:
                      '负责微服务架构开发、接口设计、数据库设计；参与系统性能优化、高并发处理、服务部署与维护。',
                  },
                ],
              },
            },
            {
              type: 'project',
              id: '5',
              options: {
                title: '项目经历',
                items: [
                  {
                    name: '企业中台管理系统',
                    role: '后端负责人',
                    startDate: '2022-03-01',
                    endDate: '2024-09-01',
                    description:
                      '基于SpringCloud微服务架构开发；负责用户中心、权限、订单、支付模块；支撑日活10万+系统稳定运行。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '华南理工大学',
                    degree: '本科',
                    major: '软件工程',
                    startDate: '2015-09-01',
                    endDate: '2019-06-01',
                    city: '广东 - 广州',
                    tags: ['211', '双一流'],
                    academy: '软件学院',
                    description: '主修Java、Python、数据库、计算机网络、操作系统。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [{ name: 'Java软件工程师认证', date: '2020-05-01' }],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'accounting',
    title: '会计简历模板',
    config: {
      name: '会计简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '李梅',
                phone: '13987654321',
                email: 'limei@163.com',
                city: '广东/佛山',
                status: '在职',
                intentCity: '佛山、广州、肇庆',
                intentPosts: '会计,财务专员',
                wechat: 'limei_caiwu',
                birthday: '1994-11-22',
                gender: '女',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '广东/佛山',
                maritalStatus: '已婚',
                politicalStatus: '群众',
                site: '',
                expectedSalary: ['7k', '12k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '熟悉金蝶/用友财务软件；熟练开票、报税、记账、报表编制；掌握成本核算、应收应付、固定资产管理；熟悉国家财税法规。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '6年会计工作经验，细心严谨，责任心强；熟悉全盘账务处理，具备良好的财务分析与风险把控能力。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '佛山贸易有限公司',
                    post: '会计',
                    department: '财务部',
                    city: '广东 - 佛山',
                    startDate: '2019-03-01',
                    endDate: '2025-04-01',
                    description:
                      '负责全盘账务处理、凭证审核、报表编制、税务申报；应收应付核对、成本核算、工资核算、财务档案管理。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '佛山科学技术学院',
                    degree: '本科',
                    major: '会计学',
                    startDate: '2015-09-01',
                    endDate: '2019-06-01',
                    city: '广东 - 佛山',
                    tags: ['211'],
                    academy: '经济管理学院',
                    description: '主修会计学、财务管理、税法、审计学、成本会计。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [
                  { name: '初级会计职称', date: '2019-05-01' },
                  { name: '计算机一级', date: '2016-06-01' },
                ],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'legal',
    title: '法务简历模板',
    config: {
      name: '法务简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '张敏',
                phone: '13711223344',
                email: 'zhangmin@163.com',
                city: '广东/广州',
                status: '在职',
                intentCity: '广州、深圳、珠海',
                intentPosts: '法务,法务专员',
                wechat: 'zhangmin_law',
                birthday: '1993-07-19',
                gender: '女',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '江西/南昌',
                maritalStatus: '未婚',
                politicalStatus: '群众',
                site: '',
                expectedSalary: ['10k', '18k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '熟悉民法典、公司法、劳动法；擅长合同审核、风险把控、纠纷处理；具备法律文书撰写、合规管理、诉讼支持能力。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '5年企业法务经验，逻辑严谨，沟通能力强；熟悉企业合规管理、合同全生命周期管理、法律风险防范。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '广州实业集团',
                    post: '法务专员',
                    department: '法务部',
                    city: '广东 - 广州',
                    startDate: '2020-04-01',
                    endDate: '2025-04-01',
                    description:
                      '负责合同起草、审核、修订；处理劳动纠纷、商业合作风险；提供法律咨询，完善公司合规制度。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '中山大学',
                    degree: '本科',
                    major: '法学',
                    startDate: '2015-09-01',
                    endDate: '2019-06-01',
                    city: '广东 - 广州',
                    tags: ['985', '双一流'],
                    academy: '法学院',
                    description: '主修民法、刑法、商法、经济法、诉讼法。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [{ name: '法律职业资格证', date: '2020-03-01' }],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'operation',
    title: '运营简历模板',
    config: {
      name: '运营简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '黄丽',
                phone: '13644556677',
                email: 'huangli@163.com',
                city: '广东/东莞',
                status: '在职',
                intentCity: '东莞、深圳、广州',
                intentPosts: '新媒体运营,电商运营,用户运营',
                wechat: 'huangli_operate',
                birthday: '1997-02-10',
                gender: '女',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '广西/南宁',
                maritalStatus: '未婚',
                politicalStatus: '群众',
                site: '',
                expectedSalary: ['8k', '15k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '熟悉公众号/小红书/抖音运营；擅长文案撰写、活动策划、数据分析、用户增长；熟练PS、剪映、办公软件。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '4年运营经验，具备从0到1账号搭建、内容创作、活动策划、用户增长能力；数据敏感，执行力强，善于复盘优化。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '东莞电商公司',
                    post: '新媒体运营',
                    department: '运营部',
                    city: '广东 - 东莞',
                    startDate: '2021-03-01',
                    endDate: '2025-04-01',
                    description:
                      '负责公众号、小红书、抖音内容运营；策划营销活动，提升粉丝量与转化率；数据分析、复盘优化运营策略。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '东莞理工学院',
                    degree: '本科',
                    major: '市场营销',
                    startDate: '2017-09-01',
                    endDate: '2021-06-01',
                    city: '广东 - 东莞',
                    tags: ['211'],
                    academy: '管理学院',
                    description: '主修市场营销、广告学、新媒体运营、电子商务。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [{ name: '新媒体运营师', date: '2021-06-01' }],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'ui-designer',
    title: 'UI设计师简历模板',
    config: {
      name: 'UI设计师简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '周雨',
                phone: '13678901234',
                email: 'zhouyu_ui@163.com',
                city: '广东/深圳',
                status: '在职',
                intentCity: [
                  ['广东', '深圳'],
                  ['广东', '广州'],
                  ['广东', '东莞'],
                ],
                intentPosts: 'UI设计师、视觉设计师、交互设计',
                wechat: 'zhouyu_ui',
                birthday: '1996-08-20',
                gender: '女',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '湖南/衡阳',
                maritalStatus: '未婚',
                politicalStatus: '群众',
                site: '',
                expectedSalary: ['12k', '20k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat', 'site'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '熟练Figma、PS、AI、Axure；擅长APP/小程序/后台界面视觉与交互设计；精通版式配色、图标设计、品牌视觉、规范组件库搭建；具备完整项目视觉落地能力。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '4年UI设计经验，审美良好、细节把控强；能独立完成从需求分析、原型、视觉设计到切图落地全流程；沟通顺畅，配合开发高效还原设计效果。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '深圳互联科技有限公司',
                    post: 'UI设计师',
                    department: '设计部',
                    city: '广东 - 深圳',
                    startDate: '2021-06-01',
                    endDate: '2025-05-01',
                    description:
                      '负责APP、小程序、后台管理系统整体视觉及交互设计；搭建通用组件库与设计规范；参与需求评审、输出设计稿、切图标注、跟进开发落地。',
                  },
                ],
              },
            },
            {
              type: 'project',
              id: '5',
              options: {
                title: '项目经历',
                items: [
                  {
                    name: '电商商城APP视觉设计',
                    role: '主视觉设计师',
                    startDate: '2022-03-01',
                    endDate: '2023-01-01',
                    description:
                      '负责整体品牌配色、页面版式、图标及全套页面设计；输出设计规范与组件库，统一多端视觉风格，提升用户体验。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '广州美术学院',
                    degree: '本科',
                    major: '视觉传达设计',
                    startDate: '2015-09-01',
                    endDate: '2019-06-01',
                    city: '广东 - 广州',
                    tags: ['211'],
                    academy: '设计学院',
                    description:
                      '主修平面设计、UI设计、版式排版、色彩构成、交互设计基础。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [{ name: 'Adobe视觉设计师认证', date: '2020-07-01' }],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'hr',
    title: '人力资源HR简历模板',
    config: {
      name: '人力资源HR简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '林婷',
                phone: '13545678901',
                email: 'linting_hr@163.com',
                city: '广东/东莞',
                status: '在职',
                intentCity: [
                  ['广东', '东莞'],
                  ['广东', '深圳'],
                  ['广东', '广州'],
                ],
                intentPosts: '人事专员、人力资源、招聘专员',
                wechat: 'linting_hr',
                birthday: '1995-04-18',
                gender: '女',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '福建/厦门',
                maritalStatus: '未婚',
                politicalStatus: '群众',
                site: '',
                expectedSalary: ['7k', '13k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '熟悉招聘全流程、入职离职、社保公积金办理；擅长员工关系、考勤核算、薪酬绩效、企业文化活动组织；熟悉劳动法及人事行政管理流程。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '5年人事行政经验，性格耐心细致、沟通协调能力强；熟悉制造业、互联网人事流程，能独立统筹招聘、员工关系及行政日常事务。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '东莞制造集团有限公司',
                    post: '人事专员',
                    department: '人事部',
                    city: '广东 - 东莞',
                    startDate: '2020-02-01',
                    endDate: '2025-05-01',
                    description:
                      '负责人员招聘、面试邀约、入职手续、劳动合同签订；考勤统计、薪资核算、社保公积金增减员；处理员工关系、离职面谈、企业文化活动策划执行。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '东莞城市学院',
                    degree: '本科',
                    major: '人力资源管理',
                    startDate: '2016-09-01',
                    endDate: '2020-06-01',
                    city: '广东 - 东莞',
                    tags: ['211'],
                    academy: '工商管理学院',
                    description:
                      '主修人力资源管理、薪酬绩效、劳动法、组织行为学、行政管理。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [{ name: '人力资源管理师四级', date: '2021-05-01' }],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'teacher',
    title: '教师简历模板',
    config: {
      name: '教师简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '陈浩',
                phone: '13765432109',
                email: 'chenhao_teacher@163.com',
                city: '广东/惠州',
                status: '在职',
                intentCity: [
                  ['广东', '惠州'],
                  ['广东', '东莞'],
                  ['广东', '深圳'],
                ],
                intentPosts: '小学教师、初中教师、语文教师',
                wechat: 'chenhao_edu',
                birthday: '1994-12-05',
                gender: '男',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '广东/梅州',
                maritalStatus: '未婚',
                politicalStatus: '中共党员',
                site: '',
                expectedSalary: ['8k', '15k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '精通学科教学、教案编写、课件制作；熟悉班级管理、家校沟通、学情分析；熟练使用多媒体教学设备、PPT课件、教学信息化工具。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '6年一线教学经验，教学功底扎实、责任心强；善于因材施教，课堂把控能力好，亲和力强，注重学生综合素质培养。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '惠州公立中小学',
                    post: '语文教师',
                    department: '教务处',
                    city: '广东 - 惠州',
                    startDate: '2019-09-01',
                    endDate: '2025-05-01',
                    description:
                      '负责日常课堂教学、备课教案、作业批改、学情跟踪；承担班级管理、家校沟通、课外活动组织；参与教研活动、公开课及教学培训。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '华南师范大学',
                    degree: '本科',
                    major: '汉语言文学（师范）',
                    startDate: '2015-09-01',
                    endDate: '2019-06-01',
                    city: '广东 - 广州',
                    tags: ['211', '双一流'],
                    academy: '文学院',
                    description:
                      '主修现代汉语、文学概论、教育学、心理学、学科教学法。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [
                  { name: '教师资格证（语文）', date: '2018-06-01' },
                  { name: '普通话二级甲等', date: '2017-05-01' },
                ],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'nurse',
    title: '护士简历模板',
    config: {
      name: '护士简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '吴佳',
                phone: '13898765432',
                email: 'wujia_nurse@163.com',
                city: '广东/中山',
                status: '在职',
                intentCity: [
                  ['广东', '中山'],
                  ['广东', '珠海'],
                  ['广东', '广州'],
                ],
                intentPosts: '护士、护理人员、临床护士',
                wechat: 'wujia_nurse',
                birthday: '1997-03-12',
                gender: '女',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '广西/桂林',
                maritalStatus: '未婚',
                politicalStatus: '群众',
                site: '',
                expectedSalary: ['6k', '11k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '熟练临床基础护理、输液打针、生命体征监测、医嘱执行；熟悉病房管理、院感防控、护理文书书写；具备良好应急处理、沟通安抚能力。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '4年临床护理工作经验，工作认真负责、细心有耐心；遵守医院规章制度，抗压能力强，服务意识良好。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '中山综合医院',
                    post: '临床护士',
                    department: '内科病房',
                    city: '广东 - 中山',
                    startDate: '2021-07-01',
                    endDate: '2025-05-01',
                    description:
                      '负责日常临床护理、基础治疗、病情观察、护理记录；执行医嘱、配药输液、病房巡视、健康宣教；配合医生抢救及日常诊疗协助工作。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '广东护理职业学院',
                    degree: '专科',
                    major: '护理',
                    startDate: '2016-09-01',
                    endDate: '2019-06-01',
                    city: '广东 - 广州',
                    tags: [],
                    academy: '护理学院',
                    description:
                      '主修基础护理学、内科护理、外科护理、妇产科护理、急救护理。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [
                  { name: '护士执业资格证', date: '2020-05-01' },
                  { name: '护士职称初级', date: '2021-06-01' },
                ],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'sales',
    title: '销售简历模板',
    config: {
      name: '销售简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '王俊',
                phone: '13912345678',
                email: 'wangjun_sale@163.com',
                city: '广东/佛山',
                status: '在职',
                intentCity: [
                  ['广东', '佛山'],
                  ['广东', '广州'],
                  ['广东', '东莞'],
                ],
                intentPosts: '销售代表、业务经理、渠道销售',
                wechat: 'wangjun_sales',
                birthday: '1993-06-25',
                gender: '男',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '四川/成都',
                maritalStatus: '已婚',
                politicalStatus: '群众',
                site: '',
                expectedSalary: ['8k', '20k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '擅长客户开发、渠道维护、商务谈判、订单跟进；熟悉市场推广、客户关系管理、销售目标拆解与达成；具备较强抗压、谈判及成交能力。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '7年线下渠道及终端销售经验，人脉资源广、沟通表达能力强；目标感强、执行力高，擅长新客户开拓与老客户维护复购。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '佛山建材贸易公司',
                    post: '销售主管',
                    department: '销售部',
                    city: '广东 - 佛山',
                    startDate: '2018-03-01',
                    endDate: '2025-05-01',
                    description:
                      '负责区域市场客户开发、渠道拓展、商务洽谈及报价跟单；维护老客户关系，促进复购与转介绍；完成公司销售指标，跟进回款及售后协调。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '佛山职业技术学院',
                    degree: '专科',
                    major: '市场营销',
                    startDate: '2012-09-01',
                    endDate: '2015-06-01',
                    city: '广东 - 佛山',
                    tags: [],
                    academy: '经济管理学院',
                    description:
                      '主修市场营销、销售技巧、消费者行为学、商务谈判、渠道管理。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [{ name: '市场营销经理认证', date: '2019-08-01' }],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'pm',
    title: '产品经理简历模板',
    config: {
      name: '产品经理简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '苏子轩',
                phone: '13652897410',
                email: 'suzixuan_pm@163.com',
                city: '广东/深圳',
                status: '在职',
                intentCity: [
                  ['广东', '深圳'],
                  ['广东', '广州'],
                  ['广东', '东莞'],
                ],
                intentPosts: '产品经理、APP产品、后台产品',
                wechat: 'suzixuan_pm',
                birthday: '1995-09-12',
                gender: '女',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '湖北/武汉',
                maritalStatus: '未婚',
                politicalStatus: '群众',
                site: '',
                expectedSalary: ['15k', '25k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat', 'site'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '熟练需求调研、竞品分析、产品规划、PRD文档撰写；精通原型设计、流程图、思维导图；熟悉APP、小程序、后台管理系统产品全流程；具备项目推进、跨部门沟通、数据分析与版本迭代能力。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '5年互联网产品经理经验，从0到1独立负责多条产品线；逻辑清晰、同理心强，善于挖掘用户需求、平衡业务与体验，高效推动研发、设计、测试落地上线。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '深圳互联网科技有限公司',
                    post: '产品经理',
                    department: '产品部',
                    city: '广东 - 深圳',
                    startDate: '2020-04-01',
                    endDate: '2025-05-01',
                    description:
                      '负责APP及后台产品需求调研、竞品分析、功能规划；输出PRD、原型、流程图，协调研发、UI、测试推进项目迭代；跟进线上数据、用户反馈，持续优化产品体验与转化指标。',
                  },
                ],
              },
            },
            {
              type: 'project',
              id: '5',
              options: {
                title: '项目经历',
                items: [
                  {
                    name: '生活服务小程序产品设计',
                    role: '产品负责人',
                    startDate: '2021-06-01',
                    endDate: '2022-03-01',
                    description:
                      '负责整体功能架构、用户流程、商家入驻、订单支付、会员体系设计；输出全套产品文档与原型，统筹多版本迭代，上线后用户留存与复购显著提升。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '深圳大学',
                    degree: '本科',
                    major: '电子商务',
                    startDate: '2014-09-01',
                    endDate: '2018-06-01',
                    city: '广东 - 深圳',
                    tags: ['211', '双一流'],
                    academy: '经济学院',
                    description:
                      '主修电子商务、互联网产品基础、市场营销、数据分析、消费者行为学。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [{ name: '产品经理专业认证', date: '2020-06-01' }],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'qa',
    title: '软件测试工程师简历模板',
    config: {
      name: '软件测试工程师简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '赵凯',
                phone: '13788669922',
                email: 'zhaokai_test@163.com',
                city: '广东/广州',
                status: '在职',
                intentCity: [
                  ['广东', '广州'],
                  ['广东', '深圳'],
                  ['广东', '佛山'],
                ],
                intentPosts: '软件测试工程师、功能测试、自动化测试',
                wechat: 'zhaokai_test',
                birthday: '1996-02-18',
                gender: '男',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '河南/郑州',
                maritalStatus: '未婚',
                politicalStatus: '群众',
                site: '',
                expectedSalary: ['12k', '22k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat', 'site'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '熟练功能测试、接口测试、兼容性测试、回归测试；精通测试用例、测试计划、缺陷管理流程；熟悉 HTTP 接口、抓包工具、MySQL 数据库基础；了解自动化测试、性能测试基础流程。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '4年软件测试经验，细心严谨、逻辑思维强；善于梳理业务流程、深挖隐性缺陷；执行力好，能快速适配项目节奏，配合研发高效闭环问题。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '广州软件科技有限公司',
                    post: '软件测试工程师',
                    department: '测试部',
                    city: '广东 - 广州',
                    startDate: '2021-03-01',
                    endDate: '2025-05-01',
                    description:
                      '负责Web后台、APP、小程序全流程测试；编写测试计划、测试用例、提交跟踪缺陷；开展功能、接口、多机型兼容、版本回归测试，保障版本稳定上线。',
                  },
                ],
              },
            },
            {
              type: 'project',
              id: '5',
              options: {
                title: '项目经历',
                items: [
                  {
                    name: '智慧园区管理系统测试',
                    role: '专职测试工程师',
                    startDate: '2022-01-01',
                    endDate: '2023-05-01',
                    description:
                      '参与需求评审、梳理业务流程；设计全覆盖测试用例，进行功能、接口、权限、边界值测试；跟进缺陷修复与回归验证，保障系统平稳交付使用。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '广州理工学院',
                    degree: '本科',
                    major: '软件工程',
                    startDate: '2015-09-01',
                    endDate: '2019-06-01',
                    city: '广东 - 广州',
                    tags: ['211', '双一流'],
                    academy: '信息工程学院',
                    description:
                      '主修软件工程、软件测试基础、计算机网络、数据库、数据结构。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [{ name: '软件测试工程师认证', date: '2021-04-01' }],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'ops',
    title: '运维工程师简历模板',
    config: {
      name: '运维工程师简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '林强',
                phone: '13566778899',
                email: 'linqiang_ops@163.com',
                city: '广东/深圳',
                status: '在职',
                intentCity: [
                  ['广东', '深圳'],
                  ['广东', '广州'],
                  ['广东', '东莞'],
                ],
                intentPosts: '运维工程师、服务器运维、Linux运维',
                wechat: 'linqiang_ops',
                birthday: '1995-07-16',
                gender: '男',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '福建/泉州',
                maritalStatus: '未婚',
                politicalStatus: '群众',
                site: '',
                expectedSalary: ['13k', '23k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat', 'site'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '熟练Linux系统日常运维、服务器搭建与维护；掌握Nginx、MySQL、Redis部署优化；熟悉Docker容器、Git、自动化部署；具备故障排查、备份恢复、安全加固、监控告警搭建能力。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '5年运维实战经验，责任心强、值守响应及时；熟悉网站及业务系统全链路运维，擅长故障快速定位与应急处理，保障服务稳定高可用。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '深圳云智科技有限公司',
                    post: '运维工程师',
                    department: '运维部',
                    city: '广东 - 深圳',
                    startDate: '2020-03-01',
                    endDate: '2025-05-01',
                    description:
                      '负责线上服务器、业务系统日常运维巡检；部署维护Web服务、数据库及中间件；做数据备份、安全加固、权限管理；处理突发故障、优化性能、搭建监控告警体系。',
                  },
                ],
              },
            },
            {
              type: 'project',
              id: '5',
              options: {
                title: '项目经历',
                items: [
                  {
                    name: '业务系统容器化迁移运维',
                    role: '运维负责人',
                    startDate: '2022-02-01',
                    endDate: '2023-06-01',
                    description:
                      '将传统业务服务迁移至Docker容器化部署；统一发布流程、优化资源占用，完善监控与自动重启策略，大幅降低人工运维成本。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '岭南职业技术学院',
                    degree: '专科',
                    major: '计算机网络技术',
                    startDate: '2015-09-01',
                    endDate: '2018-06-01',
                    city: '广东 - 广州',
                    tags: [],
                    academy: '信息技术学院',
                    description:
                      '主修计算机网络、Linux系统、服务器配置、数据库原理、网络安全基础。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [{ name: 'Linux运维工程师认证', date: '2019-07-01' }],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'admin-clerk',
    title: '行政专员简历模板',
    config: {
      name: '行政专员简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '陈雅',
                phone: '13755669988',
                email: 'chenya_xz@163.com',
                city: '广东/东莞',
                status: '在职',
                intentCity: [
                  ['广东', '东莞'],
                  ['广东', '广州'],
                  ['广东', '深圳'],
                ],
                intentPosts: '行政专员、前台行政、行政文员',
                wechat: 'chenya_admin',
                birthday: '1996-10-25',
                gender: '女',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '湖南/岳阳',
                maritalStatus: '未婚',
                politicalStatus: '群众',
                site: '',
                expectedSalary: ['6k', '10k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '熟练日常行政事务、办公用品采购与管理、固定资产登记；擅长会议安排、接待来访、文件归档、制度流程整理；精通Office办公软件、考勤统计、后勤食宿车辆统筹。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '5年行政前台工作经验，做事细心有条理、亲和力强；执行力好、沟通协调能力佳，能独立统筹公司日常行政后勤及接待事务。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '东莞实业有限公司',
                    post: '行政专员',
                    department: '行政部',
                    city: '广东 - 东莞',
                    startDate: '2020-01-01',
                    endDate: '2025-05-01',
                    description:
                      '负责日常前台接待、来电转接、来访登记；办公用品申购、入库发放、固定资产台账管理；会议布置、文件打印归档、员工考勤统计、后勤食宿及日常行政事务统筹。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '东莞职业学院',
                    degree: '专科',
                    major: '行政管理',
                    startDate: '2016-09-01',
                    endDate: '2019-06-01',
                    city: '广东 - 东莞',
                    tags: [],
                    academy: '经济管理学院',
                    description:
                      '主修行政管理、办公自动化、公文写作、人力资源基础、商务礼仪。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [{ name: '办公软件高级应用证书', date: '2018-05-01' }],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'ecommerce-artist',
    title: '电商美工简历模板',
    config: {
      name: '电商美工简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '何琳',
                phone: '13699887766',
                email: 'helin_design@163.com',
                city: '广东/广州',
                status: '在职',
                intentCity: [
                  ['广东', '广州'],
                  ['广东', '佛山'],
                  ['广东', '东莞'],
                ],
                intentPosts: '电商美工、平面设计、店铺装修',
                wechat: 'helin_art',
                birthday: '1997-04-08',
                gender: '女',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '江西/赣州',
                maritalStatus: '未婚',
                politicalStatus: '群众',
                site: '',
                expectedSalary: ['7k', '14k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat', 'site'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '熟练PS、AI、CDR、剪映；精通淘宝/拼多多/抖音店铺装修、详情页、主图、活动海报设计；擅长产品精修、配色排版、短视频剪辑、电商视觉整体风格把控。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '4年电商美工经验，审美在线、出图效率高；熟悉平台流量视觉逻辑，能独立完成店铺装修、单品设计、活动页面及日常视觉物料输出。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '广州电商贸易公司',
                    post: '电商美工',
                    department: '设计部',
                    city: '广东 - 广州',
                    startDate: '2021-02-01',
                    endDate: '2025-05-01',
                    description:
                      '负责淘宝、拼多多、抖音店铺首页装修、详情页、主图、活动海报设计；产品拍摄后期精修、节日活动页面制作；日常推广图文、短视频剪辑及视觉物料输出。',
                  },
                ],
              },
            },
            {
              type: 'project',
              id: '5',
              options: {
                title: '项目经历',
                items: [
                  {
                    name: '全店铺视觉升级改造',
                    role: '主美工设计',
                    startDate: '2022-08-01',
                    endDate: '2022-12-01',
                    description:
                      '统一店铺品牌视觉风格，重新设计首页、分类页、详情页模板；规范配色与版式，提升店铺整体质感与商品转化率。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '广州艺术职业学院',
                    degree: '专科',
                    major: '视觉传达设计',
                    startDate: '2017-09-01',
                    endDate: '2020-06-01',
                    city: '广东 - 广州',
                    tags: [],
                    academy: '设计学院',
                    description:
                      '主修平面设计、电商设计、版式排版、色彩搭配、图像处理、广告设计。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [{ name: 'PS视觉设计专业证书', date: '2020-06-01' }],
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'procurement',
    title: '采购专员简历模板',
    config: {
      name: '采购专员简历模板',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#383838',
        backgroundColor: '#fff',
        padding: 20,
        headerType: 1,
      },
      pages: [
        {
          modules: [
            {
              type: 'info1',
              id: '1',
              options: {
                name: '张伟',
                phone: '13844556677',
                email: 'zhangwei_purchase@163.com',
                city: '广东/佛山',
                status: '在职',
                intentCity: [
                  ['广东', '佛山'],
                  ['广东', '广州'],
                  ['广东', '东莞'],
                ],
                intentPosts: '采购专员、采购助理、供应链采购',
                wechat: 'zhangwei_cg',
                birthday: '1994-05-18',
                gender: '男',
                stature: '',
                weight: '',
                ethnic: '汉族',
                origin: '广西/南宁',
                maritalStatus: '已婚',
                politicalStatus: '群众',
                site: '',
                expectedSalary: ['7k', '13k'],
                avatar: '',
                layout: [
                  ['phone', 'email', 'city'],
                  ['wechat'],
                  ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
                ],
              },
            },
            {
              type: 'skill',
              id: '3',
              options: {
                title: '专业技能',
                description:
                  '熟悉采购全流程、供应商开发与管理、询价议价、比价招标；精通采购下单、交期跟进、入库对账、合同审核；熟悉物料成本核算、库存管控、供应链协调及采购台账管理。',
              },
            },
            {
              type: 'other',
              id: 'other-1',
              options: {
                title: '个人优势',
                description:
                  '6年工厂及贸易行业采购经验，诚信稳重、成本意识强；善于开发优质供应商、把控交期与品质，谈判议价能力好，能有效控制采购成本。',
              },
            },
            {
              type: 'job',
              id: '4',
              options: {
                title: '工作经历',
                items: [
                  {
                    company: '佛山五金制造有限公司',
                    post: '采购专员',
                    department: '采购部',
                    city: '广东 - 佛山',
                    startDate: '2019-02-01',
                    endDate: '2025-05-01',
                    description:
                      '负责原材料、辅料及办公用品采购；供应商开发、资质审核、询价议价、合同签订；跟进生产物料交期、品质异常协调；定期对账、台账整理、优化采购渠道与成本。',
                  },
                ],
              },
            },
            {
              type: 'education',
              id: '6',
              options: {
                title: '教育经历',
                items: [
                  {
                    school: '佛山职业技术学院',
                    degree: '专科',
                    major: '物流管理与采购供应链',
                    startDate: '2013-09-01',
                    endDate: '2016-06-01',
                    city: '广东 - 佛山',
                    tags: [],
                    academy: '工商管理学院',
                    description:
                      '主修采购管理、供应链物流、供应商管理、商务谈判、仓储与库存控制。',
                  },
                ],
              },
            },
            {
              type: 'certificate',
              id: '21421412',
              options: {
                title: '证书',
                items: [{ name: '采购职业经理人初级证书', date: '2020-05-01' }],
              },
            },
          ],
        },
      ],
    },
  },
];
