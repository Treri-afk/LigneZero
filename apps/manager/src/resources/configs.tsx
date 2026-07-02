import type {
  Game,
  Staff,
  Match,
  Sponsor,
  Creator,
  Clip,
  Product,
  PlayerStat,
  SocialLink,
  SponsorTier,
  MatchStatus,
  ProductStatus,
} from '@lignezero/types';
import { db } from '@/lib/supabase';
import {
  Badge,
  arrToLines,
  linesToArr,
  objsToPairs,
  pairsToObjs,
  type ResourceConfig,
} from './engine';

// ── Helpers ───────────────────────────────────────────────────────────
const num = (s: string | undefined) => (s && s.trim() ? Number(s) : undefined);
const str = (s: string | undefined) => (s && s.trim() ? s.trim() : undefined);
const toStatsArr = (s: string) => pairsToObjs(s, 'label', 'value') as unknown as PlayerStat[];
const toSocialsArr = (s: string) => pairsToObjs(s, 'label', 'url') as unknown as SocialLink[];

// ── Games ─────────────────────────────────────────────────────────────
export const gamesConfig: ResourceConfig<Game> = {
  code: 'GAM // Jeux',
  title: 'Jeux',
  rowKey: (g) => g.id,
  rowTitle: (g) => g.name,
  columns: [
    { header: 'Nom', cell: (g) => <span className="text-[color:var(--text)]">{g.name}</span> },
    { header: 'Sigle', cell: (g) => <Badge>{g.tag}</Badge> },
    { header: 'Palmarès', cell: (g) => `${g.palmares?.length ?? 0} entrée(s)` },
  ],
  fields: () => [
    { key: 'id', label: 'ID (slug unique)', idField: true, required: true, placeholder: 'ex. valorant' },
    { key: 'slug', label: 'Slug', required: true, placeholder: 'valorant' },
    { key: 'name', label: 'Nom', required: true },
    { key: 'tag', label: 'Sigle', required: true, placeholder: 'VAL' },
    { key: 'color', label: 'Couleur (hex)', placeholder: '#f23127' },
    { key: 'visual', label: 'Visuel (chemin)', placeholder: '/img/games/valorant.jpg' },
    { key: 'stats', label: 'Stats (label | valeur)', type: 'pairs' },
    { key: 'palmares', label: 'Palmarès (un par ligne)', type: 'lines' },
  ],
  emptyDraft: { id: '', slug: '', name: '', tag: '', color: '', visual: '', stats: '', palmares: '' },
  toDraft: (g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    tag: g.tag,
    color: g.color ?? '',
    visual: g.visual ?? '',
    stats: objsToPairs(g.stats, 'label', 'value'),
    palmares: arrToLines(g.palmares),
  }),
  fromDraft: (d) => ({
    id: d.id.trim(),
    slug: d.slug.trim(),
    name: d.name.trim(),
    tag: d.tag.trim(),
    color: str(d.color),
    visual: str(d.visual),
    stats: toStatsArr(d.stats),
    palmares: linesToArr(d.palmares),
  }),
  load: () => db.listGames(),
  save: (g) => db.upsertGame(g),
  remove: (id) => db.removeGame(id),
};

// ── Staff ─────────────────────────────────────────────────────────────
export const staffConfig: ResourceConfig<Staff> = {
  code: 'STF // Staff',
  title: 'Staff',
  rowKey: (s) => s.id,
  rowTitle: (s) => s.name,
  columns: [
    { header: 'Nom', cell: (s) => <span className="text-[color:var(--text)]">{s.name}</span> },
    { header: 'Rôle', cell: (s) => s.role },
    { header: 'Division', cell: (s) => s.division ?? '—' },
    { header: 'Matricule', cell: (s) => <Badge>{s.matricule ?? '—'}</Badge> },
  ],
  fields: () => [
    { key: 'id', label: 'ID (slug unique)', idField: true, required: true, placeholder: 's-coach' },
    { key: 'name', label: 'Nom', required: true },
    { key: 'role', label: 'Rôle', required: true, placeholder: 'Head Coach' },
    { key: 'division', label: 'Division', placeholder: 'Performance' },
    { key: 'clearance', label: 'Habilitation', placeholder: 'Niveau 4' },
    { key: 'matricule', label: 'Matricule', placeholder: 'STF-001' },
    { key: 'since', label: 'Depuis (année)', type: 'number' },
    { key: 'photo', label: 'Photo (chemin)', placeholder: '/img/staff/axis.jpg' },
    { key: 'bio', label: 'Bio', type: 'textarea' },
    { key: 'socials', label: 'Réseaux (label | url)', type: 'pairs' },
  ],
  emptyDraft: { id: '', name: '', role: '', division: '', clearance: '', matricule: '', since: '', photo: '', bio: '', socials: '' },
  toDraft: (s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    division: s.division ?? '',
    clearance: s.clearance ?? '',
    matricule: s.matricule ?? '',
    since: s.since?.toString() ?? '',
    photo: s.photo ?? '',
    bio: s.bio ?? '',
    socials: objsToPairs(s.socials, 'label', 'url'),
  }),
  fromDraft: (d) => ({
    id: d.id.trim(),
    name: d.name.trim(),
    role: d.role.trim(),
    division: str(d.division),
    clearance: str(d.clearance),
    matricule: str(d.matricule),
    since: num(d.since),
    photo: str(d.photo),
    bio: str(d.bio),
    socials: toSocialsArr(d.socials),
  }),
  load: () => db.listStaff(),
  save: (s) => db.upsertStaff(s),
  remove: (id) => db.removeStaff(id),
};

// ── Matches ───────────────────────────────────────────────────────────
const STATUS_BADGE: Record<MatchStatus, 'live' | 'ok' | 'mute'> = {
  live: 'live',
  upcoming: 'ok',
  finished: 'mute',
};
export const matchesConfig: ResourceConfig<Match> = {
  code: 'MTC // Calendrier',
  title: 'Calendrier',
  rowKey: (m) => m.id,
  rowTitle: (m) => `${m.competition} vs ${m.opponent.name}`,
  columns: [
    { header: 'Date', cell: (m) => new Date(m.dateISO).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) },
    { header: 'Adversaire', cell: (m) => <span className="text-[color:var(--text)]">{m.opponent.name}</span> },
    { header: 'Compétition', cell: (m) => m.competition },
    { header: 'Statut', cell: (m) => <Badge tone={STATUS_BADGE[m.status]}>{m.status}</Badge> },
    { header: 'Score', cell: (m) => (m.score ? `${m.score.us}–${m.score.them}` : '—') },
  ],
  fields: (ctx) => [
    { key: 'id', label: 'ID (slug unique)', idField: true, required: true, placeholder: 'm-vs-nemesis' },
    {
      key: 'gameId',
      label: 'Jeu',
      type: 'select',
      required: true,
      options: ((ctx.games as Game[]) ?? []).map((g) => ({ value: g.id, label: g.name })),
    },
    { key: 'opponentName', label: 'Adversaire', required: true },
    { key: 'opponentLogo', label: 'Logo adversaire (chemin)' },
    { key: 'dateISO', label: 'Date & heure', type: 'datetime', required: true },
    { key: 'competition', label: 'Compétition', required: true },
    {
      key: 'status',
      label: 'Statut',
      type: 'select',
      required: true,
      options: [
        { value: 'upcoming', label: 'À venir' },
        { value: 'live', label: 'En direct' },
        { value: 'finished', label: 'Terminé' },
      ],
    },
    { key: 'scoreUs', label: 'Score (nous)', type: 'number' },
    { key: 'scoreThem', label: 'Score (eux)', type: 'number' },
    { key: 'streamUrl', label: 'URL stream' },
    { key: 'vodUrl', label: 'URL VOD' },
  ],
  emptyDraft: {
    id: '', gameId: '', opponentName: '', opponentLogo: '', dateISO: '', competition: '',
    status: 'upcoming', scoreUs: '', scoreThem: '', streamUrl: '', vodUrl: '',
  },
  toDraft: (m) => ({
    id: m.id,
    gameId: m.gameId,
    opponentName: m.opponent.name,
    opponentLogo: m.opponent.logo ?? '',
    dateISO: m.dateISO.slice(0, 16),
    competition: m.competition,
    status: m.status,
    scoreUs: m.score?.us?.toString() ?? '',
    scoreThem: m.score?.them?.toString() ?? '',
    streamUrl: m.streamUrl ?? '',
    vodUrl: m.vodUrl ?? '',
  }),
  fromDraft: (d) => {
    const us = num(d.scoreUs);
    const them = num(d.scoreThem);
    return {
      id: d.id.trim(),
      gameId: d.gameId,
      opponent: { name: d.opponentName.trim(), logo: str(d.opponentLogo) },
      dateISO: new Date(d.dateISO).toISOString(),
      competition: d.competition.trim(),
      status: d.status as MatchStatus,
      score: us !== undefined && them !== undefined ? { us, them } : undefined,
      streamUrl: str(d.streamUrl),
      vodUrl: str(d.vodUrl),
    };
  },
  load: () => db.listMatches(),
  save: (m) => db.upsertMatch(m),
  remove: (id) => db.removeMatch(id),
  loadContext: async () => ({ games: await db.listGames() }),
};

// ── Sponsors ──────────────────────────────────────────────────────────
export const sponsorsConfig: ResourceConfig<Sponsor> = {
  code: 'SPN // Sponsors',
  title: 'Sponsors',
  rowKey: (s) => s.id,
  rowTitle: (s) => s.name,
  columns: [
    { header: 'Nom', cell: (s) => <span className="text-[color:var(--text)]">{s.name}</span> },
    { header: 'Palier', cell: (s) => <Badge>{s.tier}</Badge> },
    { header: 'Secteur', cell: (s) => s.sector ?? '—' },
  ],
  fields: () => [
    { key: 'id', label: 'ID (slug unique)', idField: true, required: true },
    { key: 'name', label: 'Nom', required: true },
    {
      key: 'tier',
      label: 'Palier',
      type: 'select',
      required: true,
      options: [
        { value: 'principal', label: 'Principal' },
        { value: 'officiel', label: 'Officiel' },
        { value: 'technique', label: 'Technique' },
      ],
    },
    { key: 'url', label: 'URL', required: true },
    { key: 'sector', label: 'Secteur' },
    { key: 'since', label: 'Depuis (année)', type: 'number' },
    { key: 'logo', label: 'Logo (chemin)' },
    { key: 'color', label: 'Couleur marque (hex)', placeholder: '#38c8d6' },
    { key: 'tagline', label: 'Accroche' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'contribution', label: 'Contribution', type: 'textarea' },
    { key: 'dClassification', label: 'Dossier · classification' },
    { key: 'dAgent', label: 'Dossier · agent' },
    { key: 'dIntel', label: 'Dossier · intel (un par ligne)', type: 'lines' },
    { key: 'dStory', label: 'Dossier · récit', type: 'textarea' },
    { key: 'dActivation', label: 'Dossier · activation (un par ligne)', type: 'lines' },
  ],
  emptyDraft: {
    id: '', name: '', tier: 'officiel', url: '', sector: '', since: '', logo: '', color: '', tagline: '',
    description: '', contribution: '', dClassification: '', dAgent: '', dIntel: '', dStory: '', dActivation: '',
  },
  toDraft: (s) => ({
    id: s.id,
    name: s.name,
    tier: s.tier,
    url: s.url,
    sector: s.sector ?? '',
    since: s.since?.toString() ?? '',
    logo: s.logo ?? '',
    color: s.color ?? '',
    tagline: s.tagline ?? '',
    description: s.description ?? '',
    contribution: s.contribution ?? '',
    dClassification: s.dossier?.classification ?? '',
    dAgent: s.dossier?.agent ?? '',
    dIntel: arrToLines(s.dossier?.intel),
    dStory: s.dossier?.story ?? '',
    dActivation: arrToLines(s.dossier?.activation),
  }),
  fromDraft: (d) => {
    const dossier = {
      classification: str(d.dClassification),
      agent: str(d.dAgent),
      intel: linesToArr(d.dIntel),
      story: str(d.dStory),
      activation: linesToArr(d.dActivation),
    };
    const hasDossier =
      dossier.classification || dossier.agent || dossier.story ||
      dossier.intel.length || dossier.activation.length;
    return {
      id: d.id.trim(),
      name: d.name.trim(),
      tier: d.tier as SponsorTier,
      url: d.url.trim(),
      sector: str(d.sector),
      since: num(d.since),
      logo: str(d.logo),
      color: str(d.color),
      tagline: str(d.tagline),
      description: str(d.description),
      contribution: str(d.contribution),
      dossier: hasDossier ? dossier : undefined,
    };
  },
  load: () => db.listSponsors(),
  save: (s) => db.upsertSponsor(s),
  remove: (id) => db.removeSponsor(id),
};

// ── Creators ──────────────────────────────────────────────────────────
export const creatorsConfig: ResourceConfig<Creator> = {
  code: 'CRT // Créateurs',
  title: 'Créateurs',
  rowKey: (c) => c.id,
  rowTitle: (c) => c.name,
  columns: [
    { header: 'Nom', cell: (c) => <span className="text-[color:var(--text)]">{c.name}</span> },
    { header: 'Plateforme', cell: (c) => <Badge>{c.platform}</Badge> },
    { header: 'Live', cell: (c) => (c.live ? <Badge tone="live">LIVE</Badge> : '—') },
  ],
  fields: () => [
    { key: 'id', label: 'ID (slug unique)', idField: true, required: true },
    { key: 'name', label: 'Nom', required: true },
    { key: 'role', label: 'Rôle affiché', placeholder: 'Créatrice · Valorant' },
    {
      key: 'platform',
      label: 'Plateforme',
      type: 'select',
      required: true,
      options: [
        { value: 'Twitch', label: 'Twitch' },
        { value: 'YouTube', label: 'YouTube' },
        { value: 'Kick', label: 'Kick' },
      ],
    },
    { key: 'live', label: 'En direct', type: 'checkbox', placeholder: 'Actuellement en live' },
    { key: 'title', label: 'Titre du live/vidéo' },
    { key: 'viewers', label: 'Spectateurs', type: 'number' },
    { key: 'avatar', label: 'Avatar (chemin)' },
    { key: 'url', label: 'URL', required: true },
  ],
  emptyDraft: { id: '', name: '', role: '', platform: 'Twitch', live: '', title: '', viewers: '', avatar: '', url: '' },
  toDraft: (c) => ({
    id: c.id,
    name: c.name,
    role: c.role ?? '',
    platform: c.platform,
    live: c.live ? 'true' : '',
    title: c.title ?? '',
    viewers: c.viewers?.toString() ?? '',
    avatar: c.avatar ?? '',
    url: c.url,
  }),
  fromDraft: (d) => ({
    id: d.id.trim(),
    name: d.name.trim(),
    role: str(d.role),
    platform: d.platform as Creator['platform'],
    live: d.live === 'true',
    title: str(d.title),
    viewers: num(d.viewers),
    avatar: str(d.avatar),
    url: d.url.trim(),
  }),
  load: () => db.listCreators(),
  save: (c) => db.upsertCreator(c),
  remove: (id) => db.removeCreator(id),
};

// ── Clips ─────────────────────────────────────────────────────────────
export const clipsConfig: ResourceConfig<Clip> = {
  code: 'CLP // Clips',
  title: 'Clips',
  rowKey: (c) => c.id,
  rowTitle: (c) => c.title,
  columns: [
    { header: 'Titre', cell: (c) => <span className="text-[color:var(--text)]">{c.title}</span> },
    { header: 'Auteur', cell: (c) => c.author },
    { header: 'Jeu', cell: (c) => c.game ?? '—' },
  ],
  fields: () => [
    { key: 'id', label: 'ID (slug unique)', idField: true, required: true },
    { key: 'title', label: 'Titre', required: true },
    { key: 'author', label: 'Auteur', required: true },
    { key: 'game', label: 'Jeu' },
    { key: 'thumb', label: 'Vignette (chemin)' },
    { key: 'url', label: 'URL', required: true },
  ],
  emptyDraft: { id: '', title: '', author: '', game: '', thumb: '', url: '' },
  toDraft: (c) => ({
    id: c.id, title: c.title, author: c.author, game: c.game ?? '', thumb: c.thumb ?? '', url: c.url,
  }),
  fromDraft: (d) => ({
    id: d.id.trim(),
    title: d.title.trim(),
    author: d.author.trim(),
    game: str(d.game),
    thumb: str(d.thumb),
    url: d.url.trim(),
  }),
  load: () => db.listClips(),
  save: (c) => db.upsertClip(c),
  remove: (id) => db.removeClip(id),
};

// ── Products ──────────────────────────────────────────────────────────
export const productsConfig: ResourceConfig<Product> = {
  code: 'PRD // Boutique',
  title: 'Boutique',
  rowKey: (p) => p.id,
  rowTitle: (p) => p.name,
  columns: [
    { header: 'Nom', cell: (p) => <span className="text-[color:var(--text)]">{p.name}</span> },
    { header: 'Catégorie', cell: (p) => p.category },
    { header: 'Prix', cell: (p) => p.price ?? '—' },
    { header: 'Statut', cell: (p) => <Badge tone={p.status === 'available' ? 'ok' : 'warn'}>{p.status}</Badge> },
  ],
  fields: () => [
    { key: 'id', label: 'ID (slug unique)', idField: true, required: true },
    { key: 'name', label: 'Nom', required: true },
    { key: 'category', label: 'Catégorie', required: true },
    { key: 'price', label: 'Prix', placeholder: '29,90 €' },
    { key: 'image', label: 'Image (chemin)' },
    {
      key: 'status',
      label: 'Statut',
      type: 'select',
      required: true,
      options: [
        { value: 'available', label: 'Disponible' },
        { value: 'soon', label: 'Bientôt' },
      ],
    },
  ],
  emptyDraft: { id: '', name: '', category: '', price: '', image: '', status: 'available' },
  toDraft: (p) => ({
    id: p.id, name: p.name, category: p.category, price: p.price ?? '', image: p.image ?? '', status: p.status,
  }),
  fromDraft: (d) => ({
    id: d.id.trim(),
    name: d.name.trim(),
    category: d.category.trim(),
    price: str(d.price),
    image: str(d.image),
    status: d.status as ProductStatus,
  }),
  load: () => db.listProducts(),
  save: (p) => db.upsertProduct(p),
  remove: (id) => db.removeProduct(id),
};
