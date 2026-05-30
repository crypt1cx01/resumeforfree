import type { Template } from '~/types/template';
import { defaultTemplate } from './default';
import { compactTemplate } from './compact';
import { atsFriendlyTemplate } from './atsFriendly';
import { simpleTemplate } from './simple';
import { atsModernTemplate } from './ats-modern';
import { atsPremiumTemplate } from './ats-premium';


export const templates: Record<string, Template> = {
    'compact': compactTemplate,
    'default': defaultTemplate,
    'ats-friendly': atsFriendlyTemplate,
    'simple': simpleTemplate,
    'ats-modern': atsModernTemplate,
    'ats-premium': atsPremiumTemplate,

};
export const getTemplate = (id: string): Template => {
    return templates[id] || compactTemplate;
};
export const getTemplateList = () => {
    return Object.values(templates);
};
export * from './default';
export * from './compact';
export * from './atsFriendly';
export * from './simple';
export * from './ats-modern';
export * from './ats-premium'