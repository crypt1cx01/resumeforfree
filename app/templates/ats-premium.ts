import type { ResumeData, SectionOrder } from '~/types/resume';
import type { SectionStyle, Template, TemplateParseInput, TemplateRenderConfig } from '~/types/template';
import { escapeTypstText } from '~/utils/stringUtils';
import { convertEmail, convertLink } from '~/utils/typstUtils';
import { RendererContext } from '~/utils/rendererContext';
import { isRtlLocale } from '~/composables/useLocale';
import { getSharedSectionRenderers, renderProfilePhoto } from '~/utils/sectionRenderers';

const PREMIUM_TECH_BLUE = 'rgb("#0f172a")'; 
const ACCENT_BLUE = 'rgb("#2563eb")'; 

const ATS_LAYOUT_CONFIG: TemplateRenderConfig = {
    layout: 'single-column',
    sections: {
        spacing: 'joined',
        itemSpacing: '0.9em',
        joinSeparator: '\n\n',
        datesInline: true,
    },
    socialLinks: {
        orientation: 'horizontal',
        placement: 'header',
        separator: '  •  ',
    },
    header: {
        style: 'simple',
        includeContact: true,
    },
    projects: {
        itemSpacing: '0.8em',
    },
    photo: {
        supported: false, 
    },
};

const ATS_SECTION_STYLE: SectionStyle = {
    headerColor: PREMIUM_TECH_BLUE,
    headerUnderline: true,
    headerUpperCase: true,
    headerSizeOffset: 1.5,
    spacingAbove: '1.4em',
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
        portfolio: 'Website',
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
        textBlocks.push(`#block(above: 0em, below: 0.4em)[#text(size: ${fontSize + 14}pt, weight: "bold", fill: ${PREMIUM_TECH_BLUE})[${fullName}]]`);
    }
    if (position) {
        textBlocks.push(`#block(above: 0em, below: 0.8em)[#text(size: ${fontSize + 1}pt, weight: "medium", fill: ${ACCENT_BLUE})[${position}]]`);
    }
    if (contactParts.length > 0) {
        textBlocks.push(`#block(above: 0em, below: 0.4em)[#text(size: ${fontSize - 0.5}pt, fill: rgb("#475569"))[${contactParts.join('  |  ')}]]`);
    }
    if (socialParts.length > 0) {
        textBlocks.push(`#block(above: 0em, below: 0.8em)[#text(size: ${fontSize - 0.5}pt)[${socialParts.join('  •  ')}]]`);
    }

    return `#align(center)[${textBlocks.join('\n')}]\n#v(0.2em)`;
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

    // إضافة معالج مخصص للشهادات لضمان ظهور شهادة الـ Ubuntu بشكل معيارى ونظيف للـ ATS
    const sectionRenderers: Record<string, () => string> = {
        profile: () => shared.profile(data, context),
        experience: () => shared.experience(data, context),
        internships: () => shared.internships(data, context),
        education: () => shared.education(data, context),
        skills: () => shared.skills(data, context),
        projects: () => shared.projects(data, context),
        languages: () => shared.languages(data, context),
        volunteering: () => shared.volunteering(data, context),
        certificates: () => shared.certificates(data, context), // هذا السطر سيقوم بسحب الشهادات تلقائياً من الـ Form
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

    const chosenFont = font || "Inter";

    const fontConfig = isRtl
        ? `#set text(font: ("${chosenFont}", "Arial"), size: ${fontSize}pt, dir: rtl)`
        : `#set text(font: ("${chosenFont}"), size: ${fontSize}pt)`;

    return `#set page(margin: (x: 1.25cm, y: 1.25cm))
${fontConfig}
#set par(leading: 0.5em, justify: true)
${header}
${sections}
#pagebreak(weak: true)`;
};

export const atsPremiumTemplate: Template = {
    id: 'ats-premium',
    name: 'ATS Premium Tech',
    description: 'A modern Slate-Blue minimalist template designed to hook tech recruiters while fully optimizing for ATS parsing.',
    layoutConfig: {
        isTwoColumn: false,
        movableSections: [],
    },
    parse,
};
