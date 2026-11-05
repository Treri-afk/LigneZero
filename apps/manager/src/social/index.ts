/**
 * Registry des templates du studio réseaux.
 *
 * Ajouter un poste :
 *   1. créer `templates/<mon-poste>.tsx` exportant un `TemplateDef` ;
 *   2. l'importer et l'ajouter au tableau `TEMPLATES` ci-dessous.
 * La page (SocialStudioPage) s'adapte seule : sélecteur groupé, source picker,
 * formulaire auto-généré, export PNG + légende.
 */
import type { TemplateDef, TemplateGroup } from './types';
import { GROUP_LABELS } from './types';
import { defaiteTemplate, matchdayTemplate, mvpTemplate, victoireTemplate } from './templates/matchCard';
import { lineupTemplate, rosterRevealTemplate } from './templates/lineup';
import { weekScheduleTemplate } from './templates/weekSchedule';
import { resultsRecapTemplate } from './templates/resultsRecap';
import { farewellTemplate, signingTemplate } from './templates/signing';
import { statHighlightTemplate } from './templates/statHighlight';
import { partnershipTemplate } from './templates/partnership';
import { clipTemplate } from './templates/clip';
import { liveNowTemplate } from './templates/liveNow';
import { productDropTemplate } from './templates/productDrop';
import { quoteTemplate } from './templates/quote';
import { recruitmentTemplate } from './templates/recruitment';
import { announcementTemplate } from './templates/announcement';
import { milestoneTemplate } from './templates/milestone';
import { streamScheduleTemplate } from './templates/streamSchedule';

// Cast en TemplateDef générique : chaque def garde son type de contenu en
// interne, mais le registry les manipule de façon homogène.
export const TEMPLATES: TemplateDef[] = [
  // Match
  matchdayTemplate,
  victoireTemplate,
  defaiteTemplate,
  lineupTemplate,
  weekScheduleTemplate,
  resultsRecapTemplate,
  // Joueur
  mvpTemplate,
  statHighlightTemplate,
  signingTemplate,
  farewellTemplate,
  // Effectif
  rosterRevealTemplate,
  // Sponsor
  partnershipTemplate,
  // Communauté
  clipTemplate,
  liveNowTemplate,
  streamScheduleTemplate,
  // Boutique
  productDropTemplate,
  // Divers
  quoteTemplate,
  recruitmentTemplate,
  announcementTemplate,
  milestoneTemplate,
] as unknown as TemplateDef[];

export function templateById(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** Templates regroupés par famille, dans l'ordre d'affichage. */
const GROUP_ORDER: TemplateGroup[] = ['match', 'joueur', 'effectif', 'sponsor', 'commu', 'boutique', 'divers'];

export function groupedTemplates(): { group: TemplateGroup; label: string; items: TemplateDef[] }[] {
  return GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    items: TEMPLATES.filter((t) => t.group === group),
  })).filter((g) => g.items.length > 0);
}

export * from './types';
export { FORMATS } from './formats';
export type { FormatId } from './formats';
