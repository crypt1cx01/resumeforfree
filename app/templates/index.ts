import type { Template } from '~/types/template';
import { defaultTemplate } from './default';
import { compactTemplate } from './compact';

export const templates: Record<string, Template> = {
    compact: compactTemplate,
    default: defaultTemplate,
};
export const getTemplate = (id: string): Template => {
    return templates[id] || compactTemplate;
};
export const getTemplateList = () => {
    return Object.values(templates);
};
export * from './default';
export * from './compact';
