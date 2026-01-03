export interface Template {
  alternates?: Record<string, string>;
  category?: string;
  description: string;
  label: string;
  path?: string;
}

export interface Manifest {
  templates: Template[];
}
