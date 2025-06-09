export default {
  globalStyle: {
    width: 595,
    height: 842,
    fontSize: 13,
    lineHeight: 1.3,
    horizontalMargin: 10,
    verticalMargin: 10,
    color: '#43a8ff',
    backgroundColor: '#fff',
  },
  pages: [
    {
      moduleMargin: 10,
      modules: [
        {
          type: 'info1',
          id: '1',
          options: {
            name: '张三',
            phone: '12345678901',
            email: 'zhangsan@163.com',
            city: '北京',
            status: '在职',
            intentCity: '北京',
            intentPosts: '前端开发工程师',
            wechat: 'zhangsan',
            birthday: '1990-01-01',
            gender: '男',
            stature: '180cm',
            weight: '70kg',
            ethnic: '汉族',
            origin: '北京',
            maritalStatus: '已婚',
            politicalStatus: '中共党员',
            site: 'https://www.baidu.com',
            expectedSalary: ['10k', '20k'],
            avatar:
              'https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/samantha/logo-icon-white-bg.png',
            layout: [
              ['phone', 'email', 'city'],
              ['wechat', 'site'],
              [
                'birthday',
                'gender',
                'height',
                'weight',
                'origin',
                'ethnic',
                'politicalStatus',
                'maritalStatus',
              ],
              ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
            ],
          },
        },
        {
          type: 'certificate',
          id: '2',
          options: {
            title: '证书',
            color: '#ba443a',
            items: [{ name: '证书1', date: '2020-01-01' }],
          },
        },
        {
          type: 'skill',
          id: '3',
          options: {
            title: '技能',
            color: '#ba443a',
            description:
              '1、技能技技能技能描述描述能技能技技能技能描述描述能描述描述技能技技能技能123123描述描述能描述描述技能技技能技能描述描述能描述描述技能技技能技能描述描述能描述描述描述描述2、12312\n2、12312\n2、12312\n2、12312',
          },
        },
        {
          type: 'job',
          id: '4',
          options: {
            title: '工作经历',
            color: '#ba443a',
            items: [
              {
                company: '公司',
                post: '职位',
                department: '部门',
                city: '城市',
                startDate: '2020-01-01',
                endDate: '2021-01-01',
                description:
                  '描描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描述描述描述描述描述描述描述描述述',
              },
              {
                company: '公司',
                post: '职位',
                department: '部门',
                city: '城市',
                startDate: '2020-01-01',
                endDate: '2021-01-01',
                description:
                  '描描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描描述描述描述描述描述描述描述描述述描述描述描述描述描述描述描述描述述',
              },
            ],
          },
        },
        {
          type: 'project',
          id: '5',
          options: {
            title: '项目经历',
            color: '#ba443a',
            items: [
              {
                name: '项目1',
                role: '角色',
                startDate: '2020-01-01',
                endDate: '2021-01-01',
                description: '描述',
              },
            ],
          },
        },
        {
          type: 'education',
          id: '6',
          options: {
            title: '教育经历',
            color: '#ba443a',
            items: [
              {
                school: '学校',
                degree: '学位',
                major: '专业',
                startDate: '2020-01-01',
                endDate: '2021-01-01',
                city: '城市',
                tags: ['标签1', '标签2'],
                academy: '学院',
                description: '描述',
              },
            ],
          },
        },
        {
          type: 'education',
          id: '7',
          options: {
            title: '教育经历',
            color: '#ba443a',
            items: [
              {
                school: '学校',
                degree: '学位',
                major: '专业',
                startDate: '2020-01-01',
                endDate: '2021-01-01',
                city: '城市',
                tags: ['标签1', '标签2'],
                academy: '学院',
                description: '描述',
              },
            ],
          },
        },
        {
          type: 'education',
          id: '8',
          options: {
            title: '教育经历',
            color: '#ba443a',
            items: [
              {
                school: '学校',
                degree: '学位',
                major: '专业',
                startDate: '2020-01-01',
                endDate: '2021-01-01',
                city: '城市',
                tags: ['标签1', '标签2'],
                academy: '学院',
                description: '描述',
              },
            ],
          },
        },
        {
          type: 'education',
          id: '9',
          options: {
            title: '教育经历',
            color: '#ba443a',
            items: [
              {
                school: '学校',
                degree: '学位',
                major: '专业',
                startDate: '2020-01-01',
                endDate: '2021-01-01',
                city: '城市',
                tags: ['标签1', '标签2'],
                academy: '学院',
                description: '描述',
              },
            ],
          },
        },
      ],
    },
  ],
};
