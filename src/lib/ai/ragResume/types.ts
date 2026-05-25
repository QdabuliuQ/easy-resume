export type OptimizeScene = 'skill' | 'work' | 'project';

export type OptimizeRequest = {
  postType: string;
  rawText: string;
};

export type RagRoleMatch = {
  roleKey: string;
  roleLabel: string;
};

export type RagKnowledgeDoc = {
  id: string;
  text: string;
  source: string;
  roleKey: string | null;
  roleLabel: string;
  scope: 'global' | 'scene-global' | 'role';
};
