import { SlashCommandBuilder, type SlashCommandOptionsOnlyBuilder, type ChatInputCommandInteraction } from 'discord.js';
import * as db from './db';
import { rankFor } from './features';

/** Un builder de slash command, avec ou sans options. */
export type AnySlashBuilder = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;

/**
 * Commandes Discord INTÉGRÉES : logique réelle branchée sur les mêmes données
 * que Twitch/le site (points, boutique, minijeux, prédictions). Le compte du
 * membre est résolu via member_links.discord_user_id → login Twitch (même
 * cagnotte partout). Chaque commande est une ligne discord_commands kind='builtin'
 * que le staff peut désactiver/supprimer.
 */
export interface Builtin {
  builder: AnySlashBuilder;
  run: (i: ChatInputCommandInteraction) => Promise<void>;
}

const LINK = 'Lie d’abord ton compte Twitch à Discord depuis ton espace membre sur le site 🔗';
const b = (name: string, desc: string) => new SlashCommandBuilder().setName(name).setDescription(desc);
const say = (i: ChatInputCommandInteraction, content: string, ephemeral = false) => i.reply({ content, ephemeral });

async function viewer(i: ChatInputCommandInteraction) {
  return db.viewerByDiscord(i.user.id);
}

export const BUILTINS: Record<string, Builtin> = {
  points: {
    builder: b('points', 'Voir tes points').addStringOption((o) => o.setName('login').setDescription('Login Twitch (optionnel)')),
    run: async (i) => {
      const login = i.options.getString('login') ?? (await viewer(i)).login;
      if (!login) return void say(i, LINK, true);
      await say(i, `\`${login}\` possède ${await db.getPoints(login)} points 🪙`);
    },
  },
  rank: {
    builder: b('rank', 'Ton rang de fidélité'),
    run: async (i) => {
      const v = await viewer(i);
      if (!v.login) return void say(i, LINK, true);
      const pts = await db.getPoints(v.login);
      const r = rankFor(pts);
      await say(i, `🎖️ ${r.name} — ${pts} points${r.next ? ` (encore ${r.next.min - pts} pour ${r.next.name})` : ' · palier max 👑'}`);
    },
  },
  watchtime: {
    builder: b('watchtime', 'Ton temps de visionnage'),
    run: async (i) => {
      const v = await viewer(i);
      if (!v.login) return void say(i, LINK, true);
      const { watchMinutes } = await db.getViewer(v.login);
      await say(i, `⏱️ ${Math.floor(watchMinutes / 60)}h${String(watchMinutes % 60).padStart(2, '0')} de visionnage cumulé.`);
    },
  },
  leaderboard: {
    builder: b('leaderboard', 'Classement des points'),
    run: async (i) => {
      const top = await db.topPoints(10);
      if (!top.length) return void say(i, 'Personne n’a encore de points.');
      await say(i, '🏆 **Classement**\n' + top.map((t, n) => `${n + 1}. ${t.login} — ${t.points}`).join('\n'));
    },
  },
  rewards: {
    builder: b('rewards', 'Voir la boutique'),
    run: async (i) => {
      const rewards = await db.listRewards();
      if (!rewards.length) return void say(i, 'Boutique vide pour le moment.');
      await say(i, '🛒 **Boutique**\n' + rewards.map((r) => `• ${r.name} — ${r.cost}${r.stock != null ? ` (stock ${r.stock})` : ''}`).join('\n'));
    },
  },
  redeem: {
    builder: b('redeem', 'Échanger des points contre une récompense').addStringOption((o) => o.setName('recompense').setDescription('Nom de la récompense').setRequired(true)),
    run: async (i) => {
      const v = await viewer(i);
      if (!v.login) return void say(i, LINK, true);
      const reward = await db.findReward(i.options.getString('recompense', true));
      if (!reward) return void say(i, 'Récompense introuvable. Vois `/rewards`.', true);
      const res = await db.redeemReward(v.login, reward.id);
      if (res.ok) await say(i, `✅ Tu as échangé « ${res.reward} » ! Solde : ${res.remaining}. Demande transmise au staff.`);
      else if (res.reason === 'insufficient') await say(i, `Pas assez de points (${res.remaining}/${res.cost}).`, true);
      else if (res.reason === 'out_of_stock') await say(i, 'Rupture de stock 😢', true);
      else await say(i, 'Récompense indisponible.', true);
    },
  },
  gamble: {
    builder: b('gamble', 'Parier des points').addIntegerOption((o) => o.setName('montant').setDescription('Points à miser').setRequired(true)),
    run: async (i) => {
      const v = await viewer(i);
      if (!v.login) return void say(i, LINK, true);
      const amount = i.options.getInteger('montant', true);
      if (amount <= 0) return void say(i, 'Montant invalide.', true);
      const debit = await db.adjustPoints(v.login, v.owner ?? null, -amount);
      if (!debit.ok) return void say(i, `Pas assez de points (${debit.remaining}).`, true);
      if (Math.random() < 0.47) {
        const r = await db.adjustPoints(v.login, v.owner ?? null, amount * 2);
        await say(i, `🎰 Gagné ! +${amount} → ${r.remaining} points.`);
      } else await say(i, `💀 Perdu… solde ${debit.remaining} points.`);
    },
  },
  slots: {
    builder: b('slots', 'Machine à sous').addIntegerOption((o) => o.setName('montant').setDescription('Points à miser').setRequired(true)),
    run: async (i) => {
      const v = await viewer(i);
      if (!v.login) return void say(i, LINK, true);
      const amount = i.options.getInteger('montant', true);
      if (amount <= 0) return void say(i, 'Montant invalide.', true);
      const debit = await db.adjustPoints(v.login, v.owner ?? null, -amount);
      if (!debit.ok) return void say(i, `Pas assez de points (${debit.remaining}).`, true);
      const SYM = ['🍒', '🍋', '🔔', '⭐', '7️⃣'];
      const r = [0, 0, 0].map(() => SYM[Math.floor(Math.random() * SYM.length)]);
      let mult = 0;
      if (r[0] === r[1] && r[1] === r[2]) mult = r[0] === '7️⃣' ? 10 : 5;
      else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) mult = 2;
      if (mult > 0) { const res = await db.adjustPoints(v.login, v.owner ?? null, amount * mult); await say(i, `🎰 [${r.join(' ')}] x${mult} ! +${amount * mult} → ${res.remaining}.`); }
      else await say(i, `🎰 [${r.join(' ')}] perdu… solde ${debit.remaining}.`);
    },
  },
  predict: {
    builder: b('predict', 'Miser sur la prédiction en cours')
      .addIntegerOption((o) => o.setName('option').setDescription('Numéro de l’option').setRequired(true))
      .addIntegerOption((o) => o.setName('montant').setDescription('Points à miser').setRequired(true)),
    run: async (i) => {
      const v = await viewer(i);
      if (!v.login) return void say(i, LINK, true);
      const pred = await db.openPrediction();
      if (!pred || pred.status !== 'open') return void say(i, 'Aucun pari ouvert.', true);
      const opt = i.options.getInteger('option', true);
      const amount = i.options.getInteger('montant', true);
      if (opt < 1 || opt > pred.options.length || amount <= 0) return void say(i, `Usage : /predict option 1-${pred.options.length} montant.`, true);
      const res = await db.placeBet(v.login, v.owner ?? null, pred.id, opt - 1, amount);
      if (res.ok) await say(i, `✅ Mise de ${amount} sur « ${pred.options[opt - 1]} ». Solde : ${res.remaining}.`);
      else if (res.reason === 'already_bet') await say(i, 'Tu as déjà parié sur ce match.', true);
      else if (res.reason === 'insufficient') await say(i, `Pas assez de points (${res.remaining}).`, true);
      else await say(i, 'Mise refusée.', true);
    },
  },
  nextmatch: { builder: b('nextmatch', 'Prochain match'), run: async (i) => void (await say(i, '📅 ' + (await db.nextMatchLabel()))) },
  score: { builder: b('score', 'Score du match en cours'), run: async (i) => void (await say(i, await db.currentScoreLabel())) },
  roster: { builder: b('roster', 'L’effectif'), run: async (i) => void (await say(i, '👥 ' + (await db.rosterLabel()))) },
  link: { builder: b('link', 'Lier ton compte'), run: async (i) => void (await say(i, LINK, true)) },
};
