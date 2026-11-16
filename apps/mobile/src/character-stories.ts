import type { Localized } from '../../../packages/core/src';

/**
 * Character stories: ORIGINAL HanziGo learning aids for the nine
 * characters stored in the supplementary pack.
 *
 * Honesty rules for this file:
 * - The pack itself stores radical / strokeCount / strokeOrder as
 *   null and every record as needs-review. Nothing here claims to
 *   restore that data.
 * - Component breakdowns are a memory aid based on the visible
 *   parts of each simplified character, not a scholarly etymology.
 * - Stories are invented mnemonics, written for this app, and the
 *   UI labels them "Memory aid — not etymology".
 */
export type CharacterComponent = { text: string; meaning: Localized };
export type CharacterStory = {
  characterId: string;
  components: CharacterComponent[];
  story: Localized;
};

const L = (en: string, zh: string, ar: string, es: string): Localized => ({ en, zh, ar, es });

export const characterStories: CharacterStory[] = [
  {
    characterId: 'c1',
    components: [
      {
        text: '亻',
        meaning: L(
          'person (side form)',
          '人（偏旁）',
          'شخص (شكل جانبي)',
          'persona (forma lateral)',
        ),
      },
      {
        text: '尔',
        meaning: L('you (old form)', '你（古称）', 'أنت (شكل قديم)', 'tú (forma antigua)'),
      },
    ],
    story: L(
      "A person (亻) stands next to 尔, an old-fashioned word for 'you'. Two figures side by side — the character points straight at you.",
      '一个人（亻）站在尔旁边，尔是"你"的古称。两个人并排站着，这个字正指着你。',
      "شخص (亻) يقف بجانب 尔، وهي كلمة قديمة تعني 'أنت'. شخصان جنباً إلى جنب — الحرف يشير إليك مباشرة.",
      "Una persona (亻) está junto a 尔, una palabra antigua para 'tú'. Dos figuras una al lado de la otra: el carácter te señala directamente.",
    ),
  },
  {
    characterId: 'c2',
    components: [
      { text: '日', meaning: L('sun, day', '太阳，白天', 'شمس، يوم', 'sol, día') },
      {
        text: '寸',
        meaning: L('inch, small measure', '寸，量度', 'بوصة، قياس صغير', 'pulgada, medida pequeña'),
      },
    ],
    story: L(
      "The sun (日) crosses the sky inch by inch (寸). Measuring the sun's slow crawl is how we measure time.",
      '太阳（日）一寸一寸（寸）地穿过天空。测量太阳缓慢的移动，就是测量时间。',
      'الشمس (日) تعبر السماء بوصة بوصة (寸). قياس زحف الشمس البطيء هو طريقة قياس الوقت.',
      'El sol (日) cruza el cielo pulgada a pulgada (寸). Medir el lento avance del sol es medir el tiempo.',
    ),
  },
  {
    characterId: 'c3',
    components: [
      { text: '冫', meaning: L('ice', '冰', 'جليد', 'hielo') },
      {
        text: '夬',
        meaning: L('decisive, parted', '决断，分开', 'حاسم، منفصل', 'decisivo, separado'),
      },
    ],
    story: L(
      'Ice (冫) keeps the head cold and clear while 夬 breaks the dam open. A decision is a cool head that finally lets the water through.',
      '冰（冫）让头脑保持冷静清醒，夬则冲开堤坝。决定就是：冷静的头脑终于放行。',
      'الجليد (冫) يبقي الرأس بارداً وصافياً بينما يفتح 夬 السد. القرار هو رأس هادئ يسمح للماء بالمرور أخيراً.',
      'El hielo (冫) mantiene la cabeza fría y clara mientras 夬 abre la presa. Decidir es una cabeza fría que por fin deja pasar el agua.',
    ),
  },
  {
    characterId: 'c4',
    components: [
      {
        text: '纟',
        meaning: L('silk (side form)', '丝（偏旁）', 'حرير (شكل جانبي)', 'seda (forma lateral)'),
      },
      {
        text: '又',
        meaning: L(
          'hand; also, again',
          '手；又，再',
          'يد؛ أيضاً، مرة أخرى',
          'mano; también, otra vez',
        ),
      },
      { text: '工', meaning: L('work, craft', '工作，工艺', 'عمل، حرفة', 'trabajo, oficio') },
    ],
    story: L(
      "Silk thread (纟) guided by a hand (又) across the loom's frame (工). Threads that pass through the loom become cloth — and the classic texts are threads that pass through the centuries.",
      '丝线（纟）在手（又）的引导下穿过织机的框架（工）。穿过织机的线成为布；经典则是穿过世纪的线。',
      'خيط الحرير (纟) تقوده يد (又) عبر إطار النول (工). الخيوط التي تمر عبر النول تصبح قماشاً — والنصوص الكلاسيكية خيوط تمر عبر القرون.',
      'El hilo de seda (纟) guiado por una mano (又) a través del marco del telar (工). Los hilos que pasan por el telar se vuelven tela; los textos clásicos son hilos que atraviesan los siglos.',
    ),
  },
  {
    characterId: 'c5',
    components: [
      { text: '王', meaning: L('king, jade', '王，玉', 'ملك، يشم', 'rey, jade') },
      { text: '不', meaning: L('not, no', '不', 'لا، ليس', 'no') },
    ],
    story: L(
      "A ring of precious jade (王) with no break in it — 'not' (不) a single gap. An unbroken circle surrounds everything inside it.",
      '一圈珍贵的玉（王），没有任何（不）缺口。一个完整的圆环包围着里面的一切。',
      'حلقة من اليشم الثمين (王) بلا (不) أي كسر. دائرة كاملة تحيط بكل ما بداخلها.',
      'Un anillo de jade precioso (王) sin (不) ninguna rotura. Un círculo intacto rodea todo lo que hay dentro.',
    ),
  },
  {
    characterId: 'c6',
    components: [
      {
        text: '又',
        meaning: L(
          'hand; also, again',
          '手；又，再',
          'يد؛ أيضاً، مرة أخرى',
          'mano; también, otra vez',
        ),
      },
      { text: '见', meaning: L('to see', '看见', 'يرى', 'ver') },
    ],
    story: L(
      'A hand (又) raised to shade the eyes so they can see (见) into the distance. That is observing: helping your eyes see further.',
      '一只手（又）抬起来为眼睛遮光，好让眼睛看（见）得更远。这就是观察：帮助眼睛看得更远。',
      'يد (又) مرفوعة لتظليل العينين حتى تتمكنا من الرؤية (见) بعيداً. هذه هي الملاحظة: مساعدة عينيك على الرؤية أبعد.',
      'Una mano (又) levantada para dar sombra a los ojos y poder ver (见) a lo lejos. Eso es observar: ayudar a tus ojos a ver más lejos.',
    ),
  },
  {
    characterId: 'c7',
    components: [
      {
        text: '讠',
        meaning: L(
          'speech (side form)',
          '言语（偏旁）',
          'كلام (شكل جانبي)',
          'habla (forma lateral)',
        ),
      },
      {
        text: '仑',
        meaning: L('order, coherence', '条理，顺序', 'نظام، ترتيب', 'orden, coherencia'),
      },
    ],
    story: L(
      'Speech (讠) arranged in order (仑), one point after another. A discussion is talk with a spine.',
      '把言语（讠）按顺序（仑）排列，一点接着一点。讨论就是有条理的谈话。',
      'كلام (讠) مرتب بنظام (仑)، نقطة بعد نقطة. النقاش هو حديث له عمود فقري.',
      'El habla (讠) ordenada (仑), un punto tras otro. Una discusión es una conversación con columna vertebral.',
    ),
  },
  {
    characterId: 'c8',
    components: [
      { text: '木', meaning: L('wood, tree', '木头，树', 'خشب، شجرة', 'madera, árbol') },
      {
        text: '又',
        meaning: L(
          'hand; also, again',
          '手；又，再',
          'يد؛ أيضاً، مرة أخرى',
          'mano; también, otra vez',
        ),
      },
    ],
    story: L(
      'A hand (又) gripping a wooden (木) staff — the old emblem of authority, and the wooden beam of a scale for weighing. Power and weighing in one grip.',
      '一只手（又）握着木（木）杖——古代权威的象征，也是木制的秤杆。权力和称量都在这一握之中。',
      'يد (又) تمسك بعصا خشبية (木) — رمز قديم للسلطة، وذراع ميزان خشبية للوزن. السلطة والوزن في قبضة واحدة.',
      'Una mano (又) que agarra un bastón de madera (木): el antiguo emblema de la autoridad y el brazo de madera de una balanza. Poder y peso en un solo agarre.',
    ),
  },
  {
    characterId: 'c9',
    components: [
      { text: '辛', meaning: L('bitter, hardship', '辛辣，辛苦', 'مر، مشقة', 'amargo, penuria') },
      {
        text: '讠',
        meaning: L(
          'speech (side form)',
          '言语（偏旁）',
          'كلام (شكل جانبي)',
          'habla (forma lateral)',
        ),
      },
      { text: '辛', meaning: L('bitter, hardship', '辛辣，辛苦', 'مر، مشقة', 'amargo, penuria') },
    ],
    story: L(
      'Two rivals, each armed with bitter words (辛), face off with speech (讠) flying between them. A debate is a duel of sharp tongues.',
      '两个对手各持辛辣之词（辛），中间言语（讠）交锋。辩论就是一场唇枪舌剑的对决。',
      'خصمان مسلحان بكلمات لاذعة (辛) يتواجهان والكلام (讠) يتطاير بينهما. المناظرة مبارزة بالألسنة الحادة.',
      'Dos rivales armados con palabras amargas (辛) se enfrentan con el habla (讠) volando entre ellos. Un debate es un duelo de lenguas afiladas.',
    ),
  },
];

const byCharacterId = new Map(characterStories.map((s) => [s.characterId, s]));
export function characterStory(characterId: string): CharacterStory | undefined {
  return byCharacterId.get(characterId);
}
