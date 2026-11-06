import type { BotCommand, BotConfig, BotFeatureKey } from '@lignezero/types';
import * as db from './db';
import { api } from './twitch';
import { isEnabled, fillTokens, uptimeLabel, rankFor } from './features';
import { live, raffle, poll, duels, onCooldown } from './state';

export interface CmdCtx {
  broadcasterId: string;
  user: string; // login
  display: string; // nom affiché
  text: string;
  who: { isMod: boolean; isBroadcaster: boolean; isVip: boolean; isSubscriber: boolean };
  cfg: BotConfig;
  commands: Map<string, BotCommand>;
  say: (msg: string) => void;
  reloadCommands: () => Promise<void>;
}

const EIGHT_BALL = [
  'C’est certain.', 'Sans aucun doute.', 'Oui, absolument.', 'Probablement.', 'Peut-être bien.',
  'Difficile à dire…', 'Rien n’est moins sûr.', 'Ne compte pas dessus.', 'Ma réponse est non.', 'Très douteux.',
];
const staff = (c: CmdCtx) => c.who.isMod || c.who.isBroadcaster;
const arg = (text: string) => text.trim().split(/\s+/).slice(1).join(' ').trim();

/** Route une commande de chat. Retourne true si une commande a été reconnue. */
export async function handleCommand(c: CmdCtx): Promise<boolean> {
  const parts = c.text.trim().split(/\s+/);
  const word = parts[0].toLowerCase();
  const feat = (k: BotFeatureKey) => isEnabled(c.cfg, k);

  switch (word) {
    // ── Tickets ──
    case '!ticket': {
      if (!feat('tickets') || !c.cfg.ticketsEnabled) return true;
      if (!live.match) return true; // pas de live rattaché → silencieux
      if (onCooldown(`ticket:${c.user}`, 5)) return true;
      const ownerId = await db.resolveOwnerByTwitch(c.user);
      if (!ownerId) {
        await db.logEvent({ kind: 'ticket_unlinked', twitchUser: c.user, matchId: live.match.id });
        c.say(c.cfg.claimMessageUnlinked.split('{user}').join(c.display));
        return true;
      }
      const res = await db.grantTicket(ownerId, live.match.id);
      if (res === 'granted' && feat('points')) await db.addPoints(c.user, ownerId, c.cfg.pointsPerClaim);
      await db.logEvent({ kind: res === 'granted' ? 'ticket_claim' : 'ticket_already', twitchUser: c.user, ownerId, matchId: live.match.id });
      c.say(
        res === 'already'
          ? `@${c.display} tu as déjà récupéré ton ticket pour ce match ✅`
          : c.cfg.claimMessage.split('{user}').join(c.display).split('{match}').join(live.match.opponent).split('{competition}').join(live.match.competition),
      );
      return true;
    }

    // ── Points de fidélité ──
    case '!points':
    case '!point': {
      if (!feat('points')) return true;
      const target = arg(c.text).replace(/^@/, '') || c.user;
      const pts = await db.getPoints(target);
      c.say(`@${target} possède ${pts} ${c.cfg.pointsName} 🪙`);
      return true;
    }
    case '!leaderboard':
    case '!top': {
      if (!feat('points')) return true;
      const top = await db.topPoints(5);
      if (!top.length) return (c.say('Personne n’a encore de points 🪙'), true);
      c.say('🏆 Top : ' + top.map((t, i) => `${i + 1}. ${t.login} (${t.points})`).join(' · '));
      return true;
    }

    // ── Shoutout ──
    case '!so':
    case '!shoutout': {
      if (!feat('shoutout')) return true;
      if (!staff(c)) return true;
      const name = arg(c.text).replace(/^@/, '');
      if (!name) return (c.say('Usage : !so <streamer>'), true);
      const target = await api.users.getUserByName(name).catch(() => null);
      if (!target) return (c.say(`Streamer introuvable : ${name}`), true);
      const info = await api.channels.getChannelInfoById(target.id).catch(() => null);
      const game = info?.gameName ? ` Dernier jeu : ${info.gameName}.` : '';
      c.say(`📣 Grosse dédicace à @${target.displayName} !${game} Va le/la suivre → https://twitch.tv/${target.name}`);
      return true;
    }

    // ── Tirage au sort ──
    case '!raffle': {
      if (!feat('raffle') || !staff(c)) return true;
      const kw = arg(c.text).split(/\s+/)[0] || '!join';
      raffle.open = true;
      raffle.keyword = kw.toLowerCase();
      raffle.entrants.clear();
      c.say(`🎟️ Tirage au sort ouvert ! Tape ${raffle.keyword} pour participer.`);
      return true;
    }
    case '!draw': {
      if (!feat('raffle') || !staff(c)) return true;
      const list = [...raffle.entrants];
      raffle.open = false;
      if (!list.length) return (c.say('Aucun participant au tirage 😢'), true);
      const winner = list[Math.floor(Math.random() * list.length)];
      await db.logEvent({ kind: 'raffle_draw', twitchUser: winner, detail: { entrants: list.length } });
      c.say(`🎉 Le gagnant du tirage est… @${winner} ! (${list.length} participants)`);
      return true;
    }
    case '!raffleoff': {
      if (!feat('raffle') || !staff(c)) return true;
      raffle.open = false;
      c.say('Tirage au sort fermé.');
      return true;
    }

    // ── Sondages ──
    case '!poll': {
      if (!feat('poll') || !staff(c)) return true;
      const raw = arg(c.text);
      const bits = raw.split('|').map((s) => s.trim()).filter(Boolean);
      if (bits.length < 3) return (c.say('Usage : !poll Question | Option 1 | Option 2 [| …]'), true);
      poll.open = true;
      poll.question = bits[0];
      poll.options = bits.slice(1);
      poll.votes.clear();
      c.say(`📊 ${poll.question} — ` + poll.options.map((o, i) => `${i + 1}) ${o}`).join('  ') + '  → !vote <n>');
      return true;
    }
    case '!vote': {
      if (!feat('poll') || !poll.open) return true;
      const n = parseInt(arg(c.text), 10);
      if (!n || n < 1 || n > poll.options.length) return true;
      poll.votes.set(c.user, n - 1);
      return true;
    }
    case '!pollresult': {
      if (!feat('poll') || !staff(c)) return true;
      if (!poll.options.length) return (c.say('Aucun sondage en cours.'), true);
      const tally = poll.options.map((_, i) => [...poll.votes.values()].filter((v) => v === i).length);
      c.say(`📊 ${poll.question} — ` + poll.options.map((o, i) => `${o}: ${tally[i]}`).join('  ·  '));
      return true;
    }
    case '!polloff': {
      if (!feat('poll') || !staff(c)) return true;
      poll.open = false;
      c.say('Sondage fermé.');
      return true;
    }

    // ── Citations ──
    case '!quote': {
      if (!feat('quotes')) return true;
      const rest = arg(c.text);
      if (rest.toLowerCase().startsWith('add ')) {
        if (!staff(c)) return true;
        const text = rest.slice(4).trim();
        if (!text) return true;
        const id = await db.addQuote(text, c.user);
        c.say(`Citation #${id} ajoutée ✍️`);
        return true;
      }
      const byId = parseInt(rest, 10);
      const q = byId ? await db.quoteById(byId) : await db.randomQuote();
      c.say(q ? `💬 #${q.id} : « ${q.text} »` : 'Aucune citation enregistrée.');
      return true;
    }

    // ── Fun ──
    case '!dice':
    case '!de':
      if (!feat('fun')) return true;
      c.say(`🎲 @${c.display} lance un dé… ${1 + Math.floor(Math.random() * 6)} !`);
      return true;
    case '!flip':
    case '!piece':
      if (!feat('fun')) return true;
      c.say(`🪙 @${c.display} → ${Math.random() < 0.5 ? 'Pile' : 'Face'} !`);
      return true;
    case '!8ball':
    case '!question':
      if (!feat('fun')) return true;
      c.say(`🎱 ${EIGHT_BALL[Math.floor(Math.random() * EIGHT_BALL.length)]}`);
      return true;
    case '!hug': {
      if (!feat('fun')) return true;
      const t = arg(c.text).replace(/^@/, '');
      c.say(t ? `🤗 @${c.display} fait un câlin à @${t} !` : `🤗 @${c.display} distribue des câlins !`);
      return true;
    }
    case '!love': {
      if (!feat('fun')) return true;
      const t = arg(c.text).replace(/^@/, '') || c.display;
      c.say(`❤️ Compatibilité @${c.display} × @${t} : ${Math.floor(Math.random() * 101)}%`);
      return true;
    }

    // ── Minijeux (jouer ses points) ──
    case '!gamble':
    case '!casino': {
      if (!feat('minigames')) return true;
      if (onCooldown(`gamble:${c.user}`, 5)) return true;
      const bal = await db.getPoints(c.user);
      const raw = arg(c.text).toLowerCase();
      const amount = raw === 'all' || raw === 'tout' ? bal : parseInt(raw, 10);
      if (!amount || amount <= 0) return (c.say('Usage : !gamble <montant|all>'), true);
      const owner = await db.resolveOwnerByTwitch(c.user).catch(() => null);
      const debit = await db.adjustPoints(c.user, owner, -amount);
      if (!debit.ok) return (c.say(`@${c.display} pas assez de ${c.cfg.pointsName} (${debit.remaining}).`), true);
      if (Math.random() < 0.47) {
        const res = await db.adjustPoints(c.user, owner, amount * 2);
        c.say(`🎰 @${c.display} mise ${amount} et GAGNE ! +${amount} → ${res.remaining} ${c.cfg.pointsName}.`);
      } else {
        c.say(`💀 @${c.display} mise ${amount} et perd tout… solde ${debit.remaining}.`);
      }
      return true;
    }
    case '!slots':
    case '!machine': {
      if (!feat('minigames')) return true;
      if (onCooldown(`slots:${c.user}`, 5)) return true;
      const amount = parseInt(arg(c.text), 10);
      if (!amount || amount <= 0) return (c.say('Usage : !slots <montant>'), true);
      const owner = await db.resolveOwnerByTwitch(c.user).catch(() => null);
      const debit = await db.adjustPoints(c.user, owner, -amount);
      if (!debit.ok) return (c.say(`@${c.display} pas assez de ${c.cfg.pointsName} (${debit.remaining}).`), true);
      const SYM = ['🍒', '🍋', '🔔', '⭐', '7️⃣'];
      const r = [0, 0, 0].map(() => SYM[Math.floor(Math.random() * SYM.length)]);
      let mult = 0;
      if (r[0] === r[1] && r[1] === r[2]) mult = r[0] === '7️⃣' ? 10 : 5;
      else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) mult = 2;
      if (mult > 0) {
        const res = await db.adjustPoints(c.user, owner, amount * mult);
        c.say(`🎰 [${r.join(' ')}] @${c.display} x${mult} ! +${amount * mult} → ${res.remaining}.`);
      } else c.say(`🎰 [${r.join(' ')}] @${c.display} perdu… solde ${debit.remaining}.`);
      return true;
    }
    case '!duel':
    case '!defi': {
      if (!feat('minigames')) return true;
      const target = parts[1]?.replace(/^@/, '').toLowerCase();
      const amount = parseInt(parts[2], 10);
      if (!target || !amount || amount <= 0) return (c.say('Usage : !duel @joueur <montant>'), true);
      if (target === c.user) return (c.say('Tu ne peux pas te défier toi-même.'), true);
      const bal = await db.getPoints(c.user);
      if (bal < amount) return (c.say(`@${c.display} tu n'as pas ${amount} ${c.cfg.pointsName}.`), true);
      duels.set(target, { from: c.user, fromDisplay: c.display, amount, at: Date.now() });
      c.say(`⚔️ @${c.display} défie @${target} pour ${amount} ${c.cfg.pointsName} ! @${target} → !accept ou !decline (2 min).`);
      return true;
    }
    case '!accept': {
      if (!feat('minigames')) return true;
      const d = duels.get(c.user);
      if (!d || Date.now() - d.at > 120000) { duels.delete(c.user); return (c.say(`@${c.display} aucun duel en attente.`), true); }
      duels.delete(c.user);
      const ownerA = await db.resolveOwnerByTwitch(d.from).catch(() => null);
      const ownerB = await db.resolveOwnerByTwitch(c.user).catch(() => null);
      const challengerWins = Math.random() < 0.5;
      const winner = challengerWins ? d.from : c.user;
      const loser = challengerWins ? c.user : d.from;
      const debit = await db.adjustPoints(loser, challengerWins ? ownerB : ownerA, -d.amount);
      if (!debit.ok) return (c.say(`Duel annulé : @${loser} n'a plus assez de ${c.cfg.pointsName}.`), true);
      const res = await db.adjustPoints(winner, challengerWins ? ownerA : ownerB, d.amount);
      c.say(`⚔️ @${winner} remporte le duel et empoche ${d.amount} ${c.cfg.pointsName} ! (solde ${res.remaining})`);
      await db.logEvent({ kind: 'duel', detail: { winner, loser, amount: d.amount } });
      return true;
    }
    case '!decline':
    case '!refuse': {
      if (!feat('minigames')) return true;
      if (duels.delete(c.user)) c.say(`@${c.display} a décliné le duel.`);
      return true;
    }

    // ── Rang de fidélité ──
    case '!rank':
    case '!rang': {
      if (!feat('ranks')) return true;
      const target = arg(c.text).replace(/^@/, '') || c.user;
      const pts = await db.getPoints(target);
      const r = rankFor(pts);
      const nxt = r.next ? ` — encore ${r.next.min - pts} pts pour ${r.next.name}` : ' — palier max 👑';
      c.say(`🎖️ @${target} : ${r.name} (${pts} ${c.cfg.pointsName})${nxt}`);
      return true;
    }

    // ── Temps de visionnage ──
    case '!watchtime':
    case '!temps': {
      if (!feat('watchtime')) return true;
      const target = arg(c.text).replace(/^@/, '') || c.user;
      const v = await db.getViewer(target);
      const h = Math.floor(v.watchMinutes / 60);
      const m = v.watchMinutes % 60;
      c.say(`⏱️ @${target} a regardé ${h}h${String(m).padStart(2, '0')} de live.`);
      return true;
    }

    // ── Boutique de points ──
    case '!rewards':
    case '!boutique': {
      if (!feat('shop')) return true;
      const rewards = await db.listRewards();
      if (!rewards.length) return (c.say('Boutique vide pour le moment.'), true);
      c.say('🛒 Boutique : ' + rewards.map((r) => `${r.name} (${r.cost}${r.stock != null ? `, stock ${r.stock}` : ''})`).join(' · ') + ' — !redeem <nom>');
      return true;
    }
    case '!redeem':
    case '!acheter': {
      if (!feat('shop')) return true;
      const q = arg(c.text);
      if (!q) return (c.say('Usage : !redeem <nom ou id>. Liste : !rewards'), true);
      const reward = await db.findReward(q);
      if (!reward) return (c.say(`Récompense introuvable : ${q}`), true);
      const res = await db.redeemReward(c.user, reward.id);
      if (res.ok) {
        c.say(`✅ @${c.display} a échangé « ${res.reward} » ! Solde : ${res.remaining} ${c.cfg.pointsName}. Demande transmise au staff.`);
        await db.logEvent({ kind: 'redeem', twitchUser: c.user, detail: { reward: reward.name, cost: reward.cost } });
      } else if (res.reason === 'insufficient') c.say(`@${c.display} il te manque des ${c.cfg.pointsName} (${res.remaining}/${res.cost}).`);
      else if (res.reason === 'out_of_stock') c.say(`@${c.display} rupture de stock 😢`);
      else c.say(`@${c.display} récompense indisponible.`);
      return true;
    }

    // ── Prédictions / paris ──
    case '!prediction':
    case '!pari': {
      if (!feat('predictions')) return true;
      const sub = (parts[1] ?? '').toLowerCase();
      if (staff(c) && sub === 'start') {
        const bits = arg(c.text).replace(/^start\s+/i, '').split('|').map((s) => s.trim()).filter(Boolean);
        if (bits.length < 3) return (c.say('Usage : !prediction start Question | Option 1 | Option 2'), true);
        await db.createPrediction(bits[0], bits.slice(1), live.match?.id ?? null);
        c.say(`🔮 Pari ouvert : ${bits[0]} — ` + bits.slice(1).map((o, i) => `${i + 1}) ${o}`).join('  ') + '  → !predict <n> <montant>');
        return true;
      }
      const pred = await db.openPrediction();
      if (staff(c) && sub === 'lock') {
        if (pred) await db.setPredictionStatus(pred.id, 'locked');
        c.say(pred ? '🔒 Paris fermés, plus de mises.' : 'Aucun pari en cours.');
        return true;
      }
      if (staff(c) && sub === 'resolve') {
        const n = parseInt(parts[2], 10);
        if (!pred || !n) return (c.say('Usage : !prediction resolve <n° option gagnante>'), true);
        const res = await db.resolvePrediction(pred.id, n - 1);
        c.say(res.refunded ? '↩️ Personne n’a trouvé, mises remboursées.' : `🏆 Option ${n} gagnante ! ${res.paid} ${c.cfg.pointsName} redistribués à ${res.winners} parieur(s).`);
        await db.logEvent({ kind: 'prediction_resolve', detail: res });
        return true;
      }
      if (!pred) return (c.say('Aucun pari en cours.'), true);
      c.say(`🔮 ${pred.question} — ` + pred.options.map((o, i) => `${i + 1}) ${o}`).join('  ') + (pred.status === 'locked' ? ' (fermé)' : '  → !predict <n> <montant>'));
      return true;
    }
    case '!predict':
    case '!bet':
    case '!miser': {
      if (!feat('predictions')) return true;
      const pred = await db.openPrediction();
      if (!pred || pred.status !== 'open') return (c.say('Aucun pari ouvert.'), true);
      const n = parseInt(parts[1], 10);
      const amount = parseInt(parts[2], 10);
      if (!n || !amount || n < 1 || n > pred.options.length) return (c.say('Usage : !predict <n° option> <montant>'), true);
      const owner = await db.resolveOwnerByTwitch(c.user).catch(() => null);
      const res = await db.placeBet(c.user, owner, pred.id, n - 1, amount);
      if (res.ok) c.say(`✅ @${c.display} mise ${amount} sur « ${pred.options[n - 1]} ». Solde : ${res.remaining}.`);
      else if (res.reason === 'already_bet') c.say(`@${c.display} tu as déjà parié sur ce match.`);
      else if (res.reason === 'insufficient') c.say(`@${c.display} pas assez de ${c.cfg.pointsName} (${res.remaining}).`);
      else if (res.reason === 'closed') c.say('Les paris sont fermés.');
      else c.say('Mise refusée.');
      return true;
    }

    // ── Infos match / roster / uptime ──
    case '!match':
    case '!score':
      if (!feat('matchInfo')) return true;
      c.say(await db.currentScoreLabel());
      return true;
    case '!next':
    case '!prochain':
      if (!feat('matchInfo')) return true;
      c.say('📅 Prochain match : ' + (await db.nextMatchLabel()));
      return true;
    case '!roster':
    case '!lineup':
    case '!effectif':
      if (!feat('roster')) return true;
      c.say('👥 Roster : ' + (await db.rosterLabel()));
      return true;
    case '!uptime':
      if (!feat('uptime')) return true;
      c.say(`⏱️ En live depuis ${uptimeLabel()}`);
      return true;

    // ── Gestion des commandes custom (staff) ──
    case '!addcom': {
      if (!feat('customCommands') || !staff(c)) return true;
      const rest = arg(c.text);
      const m = rest.match(/^(!\S+)\s+([\s\S]+)$/);
      if (!m) return (c.say('Usage : !addcom !nom réponse'), true);
      await db.addCommand(m[1].toLowerCase(), m[2].trim());
      await c.reloadCommands();
      c.say(`Commande ${m[1].toLowerCase()} enregistrée ✅`);
      return true;
    }
    case '!delcom': {
      if (!feat('customCommands') || !staff(c)) return true;
      const name = arg(c.text).split(/\s+/)[0]?.toLowerCase();
      if (!name) return true;
      await db.removeCommand(name);
      await c.reloadCommands();
      c.say(`Commande ${name} supprimée 🗑️`);
      return true;
    }

    // ── Aide ──
    case '!commands':
    case '!help':
    case '!aide': {
      const builtins = [
        feat('tickets') && '!ticket',
        feat('points') && '!points',
        feat('matchInfo') && '!match',
        feat('matchInfo') && '!next',
        feat('roster') && '!roster',
        feat('quotes') && '!quote',
        feat('fun') && '!dice',
        feat('uptime') && '!uptime',
      ].filter(Boolean) as string[];
      const custom = feat('customCommands') ? [...c.commands.keys()] : [];
      c.say('Commandes : ' + [...builtins, ...custom].join(' · '));
      return true;
    }
  }

  // ── Participation au tirage (mot-clé dynamique) ──
  if (feat('raffle') && raffle.open && word === raffle.keyword) {
    raffle.entrants.add(c.user);
    return true;
  }

  // ── Commandes personnalisées ──
  if (feat('customCommands')) {
    const cmd = c.commands.get(word);
    if (cmd && cmd.enabled) {
      if (!canRun(cmd, c.who)) return true;
      if (onCooldown(`cmd:${cmd.trigger}`, Math.max(cmd.cooldownSec, c.cfg.cooldownSec))) return true;
      c.say(await fillTokens(cmd.response, c.cfg, c.display));
      await db.logEvent({ kind: 'command', twitchUser: c.user, detail: { trigger: cmd.trigger } });
      return true;
    }
  }
  return false;
}

function canRun(cmd: BotCommand, who: CmdCtx['who']): boolean {
  switch (cmd.minRole) {
    case 'broadcaster': return who.isBroadcaster;
    case 'mod': return who.isMod || who.isBroadcaster;
    case 'vip': return who.isVip || who.isMod || who.isBroadcaster;
    case 'sub': return who.isSubscriber || who.isVip || who.isMod || who.isBroadcaster;
    default: return true;
  }
}
