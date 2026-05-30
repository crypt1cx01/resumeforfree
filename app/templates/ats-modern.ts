import type { ResumeData, SectionOrder } from '~/types/resume';
import type { SectionStyle, Template, TemplateParseInput, TemplateRenderConfig } from '~/types/template';
import { escapeTypstText } from '~/utils/stringUtils';
import { convertEmail, convertLink } from '~/utils/typstUtils';
import { RendererContext } from '~/utils/rendererContext';
import { isRtlLocale } from '~/composables/useLocale';
import { getSharedSectionRenderers, renderProfilePhoto } from '~/utils/sectionRenderers';

// اللون الأسود الكلاسيكي الاحترافي المتوافق مع معايير الـ ATS الصارمة
const ATS_BLACK = 'rgb("#111111")';

const ATS_LAYOUT_CONFIG: TemplateRenderConfig = {
    layout: 'single-column',
    sections: {
        spacing: 'joined',
        itemSpacing: '0.8em',
        joinSeparator: '\n\n',
        datesInline: true,
    },
    socialLinks: {
        orientation: 'horizontal',
        placement: 'header',
        separator: ' | ',
    },
    header: {
        style: 'simple',
        includeContact: true,
    },
    projects: {
        itemSpacing: '0.6em',
    },
    photo: {
        supported: false, // الـ ATS يفضل دائماً عدم وضع صورة شخصية
    },
};

const ATS_SECTION_STYLE: SectionStyle = {
    headerColor: ATS_BLACK,
    headerUnderline: true,
    headerUpperCase: true,
    headerSizeOffset: 1,
    spacingAbove: '1.2em',
};

function renderTopHeader(data: ResumeData, context: RendererContext, fontSize: number): string {
    const firstName = escapeTypstText(data?.firstName || '').toUpperCase();
    const lastName = escapeTypstText(data?.lastName || '').toUpperCase();
    const fullName = `${firstName} ${lastName}`.trim();
    const position = escapeTypstText((data?.position || '')).toUpperCase();

    const contactParts: string[] = [];
    if (data?.location) contactParts.push(escapeTypstText(data.location));
    if (data?.email) contactParts.push(convertEmail(data.email));
    if (data?.phone) contactParts.push(`#text(dir: ltr)[${escapeTypstText(data.phone)}]`);

    const platformLabels: Record<string, string> = {
        linkedin: 'LinkedIn',
        github: 'GitHub',
        twitter: 'Twitter',
        portfolio: 'Portfolio',
        dribbble: 'Dribbble',
        medium: 'Medium',
        devto: 'Dev.to',
        personal: 'Personal',
    };
    
    const socialParts: string[] = (data?.socialLinks || [])
        .filter(link => link.platform && link.url && link.url.trim() !== '')
        .map((link) => {
            const label = link.platform === 'other' && link.customLabel
                ? link.customLabel
                : (platformLabels[link.platform] || link.platform);
            return convertLink(link.url, label);
        });

    const textBlocks: string[] = [];
    if (fullName) {
        textBlocks.push(`#block(above: 0em, below: 0.5em)[#text(size: ${fontSize + 12}pt, weight: "bold", fill: ${ATS_BLACK})[${fullName}]]`);
    }
    if (position) {
        textBlocks.push(`#block(above: 0em, below: 0.8em)[#text(size: ${fontSize + 2}pt, weight: "medium")[${position}]]`);
    }
    if (contactParts.length > 0) {
        const below = socialParts.length > 0 ? '0.4em' : '1em';
        textBlocks.push(`#block(above: 0em, below: ${below})[#text(size: ${fontSize}pt)[${contactParts.join(' | ')}]]`);
    }
    if (socialParts.length > 0) {
        textBlocks.push(`#block(above: 0em, below: 1em)[#text(size: ${fontSize}pt)[${socialParts.join(' | ')}]]`);
    }

    return `#align(center)[${textBlocks.join('\n')}]\n#v(0.5em)`;
}

const parse = ({ data, font, locale, t, fontSize, photoShape }: TemplateParseInput): string => {
    const isRtl = isRtlLocale(locale);
    const context = new RendererContext({
        t,
        fontSize,
        config: ATS_LAYOUT_CONFIG,
        locale,
        photoShape: photoShape || 'rectangle',
        sectionStyle: ATS_SECTION_STYLE,
    });

    const header = renderTopHeader(data, context, fontSize);
    const shared = getSharedSectionRenderers();

    const sectionRenderers: Record<string, () => string> = {
        profile: () => shared.profile(data, context),
        experience: () => shared.experience(data, context),
        internships: () => shared.internships(data, context),
        education: () => shared.education(data, context),
        skills: () => shared.skills(data, context),
        projects: () => shared.projects(data, context),
        languages: () => shared.languages(data, context),
        volunteering: () => shared.volunteering(data, context),
        certificates: () => shared.certificates(data, context),
    };

    const orderedKeys = Object.keys(sectionRenderers).sort((a, b) => {
        if (a === 'profile') return -1;
        if (b === 'profile') return 1;
        const orderA = data.sectionOrder?.[a as keyof SectionOrder] ?? 999;
        const orderB = data.sectionOrder?.[b as keyof SectionOrder] ?? 999;
        return orderA - orderB;
    });

    const sections = orderedKeys
        .map(key => sectionRenderers[key]())
        .filter(content => content.trim() !== '')
        .join('\n');

    const fontConfig = isRtl
        ? `#set text(font: ("${font}", "Arial"), size: ${fontSize}pt, dir: rtl)`
        : `#set text(font: ("${font}"), size: ${fontSize}pt)`;

    return `#set page(margin: 1.2cm)
${fontConfig}
#set par(leading: 0.45em)
${header}
${sections}
#pagebreak(weak: true)`;
};

export const atsModernTemplate: Template = {
    id: 'ats-modern',
    name: 'ATS Modern',
    description: 'Clean, elegant, single-column template in pure black ink, optimized for automated parsing screens',
    layoutConfig: {
        isTwoColumn: false,
        movableSections: [],
    },
    parse,
};
