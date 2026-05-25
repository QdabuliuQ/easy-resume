export type PolishType = 'job' | 'project' | 'education' | 'skill';

export type PolishRequest =
  | {
      type: 'job';
      richTextHtml: string;
      intentPosts: string;
      context: {
        company: string;
        time: string;
        postDepartment: string;
        city: string;
      };
    }
  | {
      type: 'project';
      richTextHtml: string;
      intentPosts: string;
      context: {
        projectName: string;
        role: string;
      };
    }
  | {
      type: 'education';
      richTextHtml: string;
      intentPosts: string;
      context: {
        school: string;
        degree: string;
        major: string;
        city: string;
        schoolTypeTags: string;
        academy: string;
        studyTime: string;
      };
    }
  | {
      type: 'skill';
      richTextHtml: string;
      intentPosts: string;
    };
