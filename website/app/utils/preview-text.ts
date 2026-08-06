const previewModes = ['headline', 'paragraph', 'waterfall', 'compare'] as const;

export type PreviewMode = (typeof previewModes)[number];
type PreviewSampleLength = 'short' | 'long';

interface PreviewTextOption {
	label: string;
	value: string;
}

interface PreviewTextCorpus {
	language: {
		fallback: string;
		families: Readonly<Record<string, string>>;
		subsets: Readonly<Record<string, string>>;
	};
	search: {
		default: PreviewTextOption;
		groups: Array<{ label: string; options: PreviewTextOption[] }>;
	};
	editor: {
		sampleLengths: Record<PreviewMode, PreviewSampleLength>;
		defaults: Record<Exclude<PreviewMode, 'compare'>, string>;
		familyKinds: Record<'digital' | 'punctuation', Record<PreviewMode, string>>;
		categories: { monospace: Pick<Record<PreviewMode, string>, 'headline'> };
	};
}

const sharedPreviewText = {
	digits: '0123456789',
	digitalTime: '12:48:36',
	latinSentence: 'Sphinx of black quartz, judge my vow.',
	materialIcons:
		'photo_camerathumb_upassignmentcreate_new_folderinsert_invitationdraftscredit_cardtimercheck_boxclose',
	materialSymbols:
		'searchsettingshomepersonaddshopping_cartcheck_circlefavoritelogouttrophy',
	punctuation: '「ことば」を、心地よく。\n句読点まで、美しく。',
	yakuHan: '、。！？〈〉《》「」『』【】〔〕・（）：；［］｛｝',
	yakuHanBrackets: '〈〉《》「」『』【】〔〕（）［］｛｝',
} as const;

export const previewModeOptions: Array<{
	label: string;
	value: PreviewMode;
}> = [
	{ label: 'Headline', value: 'headline' },
	{ label: 'Paragraph', value: 'paragraph' },
	{ label: 'Waterfall', value: 'waterfall' },
	{ label: 'Compare', value: 'compare' },
];

export const previewText: PreviewTextCorpus = {
	language: {
		fallback: sharedPreviewText.latinSentence,
		families: {
			'dseg-weather': '0123456789 ABC',
			'dseg7-segg-chan': '0123456789',
			'dseg7-segg-chan-mini': '0123456789',
			'material-icons': sharedPreviewText.materialIcons,
			'material-icons-outlined': sharedPreviewText.materialIcons,
			'material-icons-round': sharedPreviewText.materialIcons,
			'material-icons-sharp': sharedPreviewText.materialIcons,
			'material-icons-two-tone': sharedPreviewText.materialIcons,
			'material-symbols-outlined': sharedPreviewText.materialSymbols,
			'material-symbols-rounded': sharedPreviewText.materialSymbols,
			'material-symbols-sharp': sharedPreviewText.materialSymbols,
			'noto-sans-symbols': '⛾⛿☯☸ ⛩⛰⛱⛴⛷⛸ ♸⚥☊☍☓☤ 🄰🄱🆈🆉 ⚖♇♪♬',
			'noto-sans-symbols-2': '⌚✋⯧☔🛪🏟⛅🞽🕖 🚲🡽🨄 🡢🡱🏠💻🐿👁📽',
			'noto-sans-math': '𝞉𝞩𝟃𞻰⟥⦀⦁ 𝚢𝚣𝚤𝖿𝗀𝗁𝗂 𝑻𝑼𝑽𝗔𝗕𝗖𝗗 ϑϕϰϱϵℊℎ ⊰⊱⊲⊳⊴⊵⫕ 𞹴𞹵𞹶𞹷𞹹𞹺𞹻',
			yakuhanjp: sharedPreviewText.yakuHan,
			yakuhanrp: sharedPreviewText.yakuHan,
			yakuhanjps: sharedPreviewText.yakuHanBrackets,
			yakuhanrps: sharedPreviewText.yakuHanBrackets,
			yakuhanmp: '、。！？《》「」『』【】〔〕・（）：；［］｛｝',
			yakuhanmps: '《》「」『』【】〔〕（）［］｛｝',
		},
		subsets: {
			latin: sharedPreviewText.latinSentence,
			'latin-ext': sharedPreviewText.latinSentence,
			all: sharedPreviewText.latinSentence,
			adlam: '𞤚𞤵𞥅𞤺𞤢𞥄𞤣𞤫 𞤱𞤮𞤲𞤣𞤫 𞤸𞤫𞤬𞤼𞤭𞤲𞤺𞤮𞤤 𞤸𞤮𞤪𞤥𞤢 𞤳𞤢𞤤𞤢 𞤲𞤫𞤯𞥆𞤮 𞤫',
			ahom: '𑜊𑜄𑜞 𑜊𑜕𑜄𑜣 𑜏𑜡𑜃𑜫𑜄𑜣𑜃𑜫𑜊𑜡𑜊𑜏𑜫𑜈𑜡𑜄𑜃𑜫𑜄𑜞𑜫𑜊𑜡𑜃𑜪𑜡 𑜒𑜡𑜔𑜡𑜍𑜑𑜫 𑜉𑜡𑜃𑜈𑜆𑜍𑜣𑜈𑜡𑜍𑜏𑜫𑜊 𑜏𑜍𑜫𑜈𑜦𑜧𑜏𑜡𑜉𑜆𑜣',
			'anatolian-hieroglyphs': '𔗷𔗬𔑈𔓯𔐤𔗷𔖶𔔆𔗐𔓱𔑣𔓢𔑈𔓷𔖻𔗔𔑏𔖱𔗷𔖶𔑦𔗬𔓯𔓷 𔖖𔓢𔕙𔑯𔗦 𔖪𔖱𔖪 𔑮𔐓𔗵𔗬 𔐱𔕬𔗬𔑰𔖱',
			arabic: 'الحب سماء لا تمطر غير الأحلام.',
			armenian: 'Քանզի մարդկային ընտանիքի բոլոր անդամներին',
			avestan: '𐬫𐬀𐬙𐬭𐬀 𐬘𐬀𐬔𐬀𐬙𐬌 𐬱𐬁𐬧𐬙𐬌𐬥𐬌𐬌𐬁𐬌𐬌𐬀𐬯𐬎𐬎𐬁𐬙𐬀𐬧𐬙𐬭𐬌𐬌𐬁𐬧𐬅 𐬁𐬜𐬁𐬭𐬀𐬵',
			balinese: 'ᬬᬢ᭄ᬭ ᬚᬕᬢᬶ ᬰᬵᬦ᭄ᬢᬶᬦ᭄ᬬᬵᬬᬲ᭄ᬯᬵᬢᬦ᭄ᬢ᭄ᬭ᭄ᬬᬵᬡᬵᬂ ᬆᬥᬵᬭᬄ ᬫᬵᬦᬯᬧᬭᬶᬯᬵᬭᬲ᭄ᬬ ᬲᬃᬯᬾᬱᬵᬫᬧᬶ',
			bamum: 'ꚳꚴ𖥉𖥊𖥋𖥌𖥍 𖡼𖡽𖠀𖠁𖠂𖠃𖠄 𖠎𖠏𖠐𖠑𖠒𖠓𖠔 ꚠꚡꚢꚣꚤꚥꚦ 𖨔𖨕𖨖𖨗𖨘𖨙𖨚 𖠣𖠤𖠥𖠦𖠧𖠨𖠩',
			'bassa-vah': '𖫞𖫫𖫰 𖫐𖫭𖫱𖫐𖫗𖫭𖫰𖫞𖫭𖫰 𖫑𖫫𖫱 𖫔𖫬𖫱𖫞𖫬𖫱𖫭𖫱𖫐𖫕𖫭𖫰 𖫔𖫪𖫰𖫐𖫬𖫲𖫐 𖫞𖫫𖫰𖫬𖫱 𖫕𖫨𖫲𖫐𖫪𖫳𖫐𖫕𖫪𖫱',
			batak: 'ᯛᯖ᯲ᯒ ᯐᯎᯖᯪ ᯚᯊ᯲ᯖᯪᯊ᯲ᯛᯛᯚ᯲ᯍᯖᯊ᯲ᯖ᯲ᯒ᯲ᯛᯊᯰ ᯀᯑᯒᯄ᯲ ᯔᯊᯍᯇᯒᯪᯍᯒᯚ᯲ᯛ ᯚᯒ᯲ᯍᯩᯚᯔᯇᯪ',
			bengali: 'আগুনের শিখা নিভে গিয়েছিল, আর তিনি জানলা দিয়ে তারাদের দিকে তাকালেন৷',
			bhaiksuki: '𑰧𑰝𑰿𑰨𑱃𑰕𑰐𑰝𑰰𑱃𑰫𑰯𑰡𑰿𑰝𑰰𑰡𑰿𑰧𑰯𑰧𑰭𑰿𑰪𑰯𑰝𑰡𑰿𑰝𑰿𑰨𑰿𑰧𑰯𑰜𑰯𑰽𑱃𑰁𑰠𑰯𑰨𑰾𑱃𑰦𑰯𑰡𑰪𑰢𑰨𑰰𑰪𑰯𑰨𑰭𑰿𑰧𑱃𑰭𑰨𑰿𑰪𑰸𑰬𑰯𑰦𑰢𑰰𑱃𑰭𑰟𑰭',
			brahmi: '𑀫𑀦 𑀱𑀩𑀩 𑀫𑀯𑀥𑀬𑀢𑀅 𑀩𑀅𑀬𑀔𑀭𑀅 𑀰𑀭𑀰𑀦𑀬𑀅 𑀮𑀓𑀮𑀳 𑀳𑀥𑀫𑀅 𑀥𑀓',
			buginese: 'ᨔᨗᨊᨗᨊ ᨑᨘᨄ ᨈᨕᨘ ᨑᨗ ᨍᨍᨗᨕᨊᨁᨗ ᨑᨗᨒᨗᨊᨚᨕᨙ ᨊᨄᨘᨊᨕᨗ ᨆᨊᨙᨊᨁᨗ ᨑᨗᨕᨔᨙᨊᨁᨙ ᨕᨒᨙᨅᨗᨑᨙ᨞',
			buhid: 'ᝌᝆᝍ ᝇᝄᝆᝒ ᝐᝈᝆᝒᝈᝌᝌᝐᝏᝆᝈᝆᝍᝌᝈᝋ ᝀᝇᝍᝃ ᝋᝈᝏᝉᝍᝒᝏᝍᝐᝌ ᝐᝍᝏᝒᝐᝋᝉᝒ',
			'canadian-aboriginal': 'ᐃᒪᐃᒻᒪᑦ ᐃᓕᑕᖅᓯᒪᐅᑎᖃᑦᒪᑦ ᓯᕗᓕᕐᓂᓴᑐᖃᕐᓂᒃ ᓂᕐᓱᐃᓂᑦᒥᒃ',
			carian: '𐊪𐊾𐊠𐊽𐊾𐊲𐊸𐊫𐊷𐋉𐋃𐊷𐊲𐊷𐊲𐊰𐊫𐋇𐊫𐊰𐊪𐊫𐊣𐊪𐊾𐊠𐊽𐊾𐊲𐊸𐊫𐊷𐋉𐋃𐊷𐊲𐊷𐊲𐊰𐊫𐋇𐊫𐊰𐊪𐊫𐊣',
			'caucasian-albanian': '𐕗𐕘𐕙𐔷𐔸𐔹𐔺 𐔻𐔼𐔽𐕌𐕍𐕎𐕏 𐕂𐕃𐕄𐕅𐕆𐕇𐕈 𐔰𐔱𐔲𐔳𐔴𐔵𐔶 𐕡𐕢𐕣𐔾𐔿𐕀𐕁 𐕉𐕊𐕋𐕚𐕛𐕜𐕝',
			chakma: '𑄡𑄨𑄠𑄚𑄧𑄖𑄳𑄠𑄬 𑄟𑄚𑄬𑄭 𑄉𑄨𑄢𑄨𑄢𑄴 𑄝𑄬𑄇𑄴𑄅𑄚𑄧𑄖𑄳𑄠𑄴 𑄥𑄧𑄁 𑄃𑄮 𑄑𑄚𑄑𑄚𑄳𑄠𑄴 𑄝𑄚𑄝𑄚𑄳𑄠𑄴 𑄃𑄇𑄴𑄇𑄥𑄁𑄃𑄚𑄩',
			cham: 'ꨢꨓꨴ ꨎꨈꨓꨪ ꨦꨩꩆꨓꨪꨘꨳꨩꨢꨧꨶꨩꨓꩆꨓꨴꨳꨩꨘꨩꩌ ꨀꨩꨖꨩꨣꩍ ꨠꨩꨘꨥꨚꨣꨪꨥꨩꨣꨧꨳ ꨧꨣꨶꨯꨮꨦꨩꨠꨚꨪ ꨧꨕꨧꨳꨩꨘꨩꩌ',
			cherokee: 'ᎬᏂᏳᏉ ᏗᏓᏂᎸᏨ ᎾᏍᎩ ᎠᏠᏯᏍᏗᏍᎩ ᎠᏢᏉᏙᏗ ᎠᎴ ᎾᏍᎩᏃ ᎢᎦᏘ',
			'chinese-hongkong': '他们所有的设备和仪器彷佛都是有生命的。',
			'chinese-simplified': '他们所有的设备和仪器彷佛都是有生命的。',
			'chinese-traditional': '他们所有的设备和仪器彷佛都是有生命的。',
			coptic: 'ⲥⲟⲩⲙⲟⲥⲉ ⲣⲱⲙⲉ ⲛⲓⲙ ⲉⲩϣⲏϣ ⲉ ⲛⲉⲩⲉⲣⲏⲩ ϩⲛ ⲟⲩⲇⲓⲕⲁⲓⲟⲥⲩⲛⲏ',
			cuneiform: '𒆪𒌋𒀭𒆷𒈦𒇻𒀭𒆘𒀀𒁺𒀭𒀫𒌓𒀭𒈾𒀭𒇸𒀀𒉿𒈝𒀸',
			cypriot: '𐠀𐠜𐠍𐠚 𐠃𐠙𐠪𐠒𐠚 𐠰𐠜𐠙𐠪𐠎𐠡𐠦𐠚 𐠰𐠛 𐠅𐠮𐠣𐠚 𐠊𐠩 𐠰𐠩 𐠊𐠪𐠋𐠚𐠰𐠩',
			cyrillic: 'Алая вспышка осветила силуэт зазубренного крыла.',
			'cyrillic-ext': 'Видовище перед нашими очима справді вражало.',
			deseret: '𐐃𐑊 𐐸𐐷𐐭𐑋𐐲𐑌 𐐺𐐨𐐮𐑍𐑆 𐐪𐑉 𐐺𐐫𐑉𐑌 𐑁𐑉𐐨 𐐰𐑌𐐼 𐐨𐐿𐐶𐐲𐑊 𐐮𐑌',
			devanagari: 'अंतरिक्ष यान से दूर नीचे पृथ्वी शानदार ढंग से जगमगा रही थी ।',
			dogra: '𑠣𑠙𑠹𑠤 𑠑𑠌𑠙𑠭 𑠧𑠬𑠝𑠹𑠙𑠭𑠝𑠹𑠣𑠬𑠣𑠩𑠹𑠦𑠬𑠙𑠝𑠹𑠙𑠹𑠤𑠹𑠣𑠬𑠘𑠬𑠷 𑠁𑠜𑠬𑠤𑠸',
			duployan: '𛱔𛱕𛱖𛱗𛱘𛱙𛱚 𛱩𛱪𛱰𛱱𛱲𛱳𛱴 𛰀𛰁𛰂𛰃𛰄𛰅𛰆 𛲔𛲕𛲖𛲗𛲘𛲙𛲜 𛰎𛰏𛰐𛰑𛰒𛰓𛰔 𛱢𛱣𛱤𛱥𛱦𛱧𛱨',
			'egyptian-hieroglyphs': '𓈖𓆓 𓊽𓉐𓉐 𓈖𓏲𓇯𓂝𓏴𓃾 𓉐𓃾𓂝𓃻𓁶𓃾 𓌓𓁶𓌓𓆓𓂝𓃾 𓌅𓂧𓌅𓀠 𓀠𓇯𓈖𓃾 𓇯𓂧',
			elbasan: '𐔟 𐔁𐔀 𐔒𐔎𐔇𐔔 𐔏𐔇 𐔠𐔖 𐔀𐔝𐔎𐔇 𐔟 𐔒𐔁𐔟𐔛𐔌𐔔𐔈 𐔄𐔍𐔝𐔈 𐔝𐔈 𐔗𐔎𐔇𐔐𐔐𐔈',
			elymaic: '𐿬𐿭 𐿮𐿡𐿡 𐿬𐿥𐿣𐿩𐿵𐿠 𐿡𐿠𐿩𐿲𐿳𐿠 𐿴𐿳𐿴𐿭𐿩𐿠 𐿫𐿪𐿫𐿤 𐿤𐿣𐿬𐿠 𐿣𐿪',
			ethiopic: 'የሰው፡ልጅ፡ሁሉ፡ሲወለድ፡ነጻና፡በክብርና፡በመብትም፡እኩልነት፡ያለው፡ነው።፡የተፈጥሮ፡ማስተዋልና',
			georgian: 'ვინაიდან ადამიანთა ოჯახის ყველა წევრისათვის',
			glagolitic: 'ⰲⱐⱄⰻ ⰱⱁ ⰾⱓⰴⰻⰵ ⱃⱁⰴⱔⱅⱏ ⱄⱔ ⱄⰲⱁⰱⱁⰴⱐⱀⰻ ⰻ ⱃⰰⰲⱐⱀⰻ',
			gothic: '𐌰𐌻𐌻𐌰𐌹 𐌼𐌰𐌽𐌽𐌰 𐍆𐍂𐌴𐌹𐌷𐌰𐌻𐍃 𐌾𐌰𐌷 𐍃𐌰𐌼𐌰𐌻𐌴𐌹𐌺𐍉 𐌹𐌽 𐍅𐌰𐌹𐍂𐌸𐌹𐌳𐌰𐌹',
			grantha: '𑌯𑌤𑍍𑌰 𑌜𑌗𑌤𑌿 𑌶𑌾𑌨𑍍𑌤𑌿𑌨𑍍𑌯𑌾𑌯𑌸𑍍𑌵𑌾𑌤𑌨𑍍𑌤𑍍𑌰𑍍𑌯𑌾𑌣𑌾𑌂 𑌆𑌧𑌾𑌰𑌃 𑌮𑌾𑌨𑌵𑌪𑌰𑌿𑌵𑌾𑌰𑌸𑍍𑌯 𑌸𑌰𑍍𑌵𑍇𑌷𑌾𑌮𑌪𑌿',
			greek: 'διαφυλάξτε γενικά τη ζωή σας από βαθειά ψυχικά τραύματα.',
			'greek-ext': 'διαφυλάξτε γενικά τη ζωή σας από βαθειά ψυχικά τραύματα.',
			gujarati: 'અમને તેની જાણ થાય તે પહેલાં જ, અમે જમીન છોડી દીધી હતી.',
			'gunjala-gondi': '𑵬𑵳𑶗𑶈 𑶀𑵶𑵳𑶋 𑶉𑶊𑵺𑶗𑵳𑶋𑵺𑶗𑵬𑶊𑵬𑶉𑶗𑵭𑶊𑵳𑵺𑶗𑵳𑶗𑶈𑶗𑵬𑶊𑵺𑶊𑶕 𑵡𑵹𑶊𑶈𑶖',
			gurmukhi: 'ਸਵਾਲ ਸਿਰਫ਼ ਸਮੇਂ ਦਾ ਸੀ।',
			'hanifi-rohingya': '𐴀𐴞𐴕𐴐𐴝𐴦𐴕 𐴁𐴠𐴒𐴧𐴟𐴕 𐴀𐴝𐴎𐴝𐴊𐴢 𐴀𐴝𐴌 𐴀𐴠𐴑𐴧𐴟 𐴉𐴟𐴥𐴖𐴝𐴙𐴕𐴝',
			hanunoo: 'ᜬᜦ᜴ᜭ ᜧᜤᜦᜲ ᜰᜨ᜴ᜦᜲᜨ᜴ᜬᜬᜰ᜴ᜯᜦᜨ᜴ᜦ᜴ᜭ᜴ᜬᜨᜫ᜴ ᜠᜧᜭᜣ᜴ ᜫᜨᜯᜩᜭᜲᜯᜭᜰ᜴ᜬ ᜰᜭ᜴ᜯᜲᜰᜫᜩᜲ',
			hatran: '𐣬𐣭 𐣮𐣡𐣡 𐣬𐣥𐣣𐣩𐣵𐣠 𐣡𐣠𐣩𐣲𐣣𐣠 𐣴𐣣𐣴𐣭𐣩𐣠 𐣫𐣪𐣫𐣤 𐣤𐣣𐣬𐣠 𐣣𐣪',
			hebrew: 'כך התרסק נפץ על גוזל קטן, שדחף את צבי למים.',
			'imperial-aramaic': '𐡌𐡍 𐡎𐡁𐡁 𐡌𐡅𐡃𐡉𐡕𐡀 𐡁𐡀𐡉𐡒𐡓𐡀 𐡔𐡓𐡔𐡍𐡉𐡀 𐡋𐡊𐡋𐡄 𐡄𐡃𐡌𐡀 𐡃𐡊',
			'indic-siyaq-numbers': '𞲝𞲞𞲟𞲠𞲡 𞲆𞲇𞲈𞲉𞲊𞲋𞲌 𞱸𞲂𞲃𞲄𞲅 𞲘 ا٠١٢٣٤٥',
			'inscriptional-pahlavi': '𐭬𐭭 𐭮𐭡𐭡 𐭬𐭥𐭣𐭩𐭲𐭠 𐭡𐭠𐭩𐭬𐭥𐭠 𐭱𐭥𐭱𐭭𐭩𐭠 𐭫𐭪𐭫𐭤 𐭤𐭣𐭬𐭠 𐭣𐭪',
			'inscriptional-parthian': '𐭌𐭍 𐭎𐭁𐭁 𐭌𐭅𐭃𐭉𐭕𐭀 𐭁𐭀𐭉𐭒𐭓𐭀 𐭔𐭓𐭔𐭍𐭉𐭀 𐭋𐭊𐭋𐭄 𐭄𐭃𐭌𐭀 𐭃𐭊',
			japanese:
				'鳥啼く声す 夢覚ませ 見よ明け渡る 東を 空色栄えて 沖つ辺に 帆船群れゐぬ 靄の中',
			javanese: '꧋ꦩꦤꦶꦩ꧀ꦧꦁꦩꦤꦮꦲꦏ꧀ꦲꦏ꧀ꦲꦸꦩꦠ꧀ꦩꦤꦸꦁꦱꦥꦼꦂꦭꦸꦲꦤ꧀ꦠꦸꦏ꧀ꦥꦔꦪꦺꦴꦩ꧀ꦩꦤ꧀ꦏꦤ꧀ꦛꦶꦥꦿꦤꦠꦤ꧀ꦭꦤ꧀ꦠꦠꦤꦤ',
			kaithi: '𑂨𑂞𑂹𑂩 𑂔𑂏𑂞𑂱 𑂬𑂰𑂢𑂹𑂞𑂱𑂢𑂹𑂨𑂰𑂨𑂮𑂹𑂫𑂰𑂞𑂢𑂹𑂞𑂹𑂩𑂹𑂨𑂰𑂝𑂰𑂁 𑂄𑂡𑂰𑂩𑂂 𑂧𑂰𑂢𑂫𑂣𑂩𑂱𑂫𑂰𑂩𑂮𑂹𑂨 𑂮𑂩𑂹𑂫𑂵𑂭𑂰𑂧𑂣𑂱 𑂮𑂠𑂮',
			kannada: 'ಇದು ಕೇವಲ ಸಮಯದ ಪ್ರಶ್ನೆಯಾಗಿದೆ.',
			'kayah-li': 'ꤒꤟꤢꤧ꤬ꤚꤤ꤬ꤒꤟꤢꤧ꤬ꤊꤛꤢ꤭ ꤘꤣ ꤠꤢ꤭ ꤞꤢꤧꤐꤟꤢꤦ ꤟꤢꤩꤏꤥ꤬ ꤔꤟꤢꤧ꤬ ꤔꤌꤣ꤬ꤗꤢ꤬ ꤢ꤬ꤥ꤬',
			kharoshthi: '𐨩𐨟𐨿𐨪 𐨗𐨒𐨟𐨁 𐨭𐨌𐨣𐨿𐨟𐨁𐨣𐨿𐨩𐨌𐨩𐨯𐨿𐨬𐨌𐨟𐨣𐨿𐨟𐨿𐨪𐨿𐨩𐨌𐨞𐨌𐨎 𐨀𐨌𐨢𐨌𐨪𐨏 𐨨𐨌𐨣𐨬𐨤𐨪𐨁𐨬𐨌𐨪𐨯𐨿𐨩 𐨯𐨪𐨿𐨬𐨅𐨮𐨌𐨨𐨤𐨁',
			khmer: 'ខ្ញុំបានមើលព្យុះ ដែលមានភាពស្រស់ស្អាតណាស់ ប៉ុន្តែគួរឲ្យខ្លាច',
			khojki:
				'𑈥𑈙𑈵𑈦𑈺𑈐𑈊𑈙𑈭𑈺𑈩𑈶𑈬𑈞𑈵𑈙𑈭𑈞𑈵𑈥𑈬𑈥𑈩𑈵𑈨𑈬𑈙𑈞𑈵𑈙𑈵𑈦𑈵𑈥𑈬𑈘𑈬𑈴𑈺𑈁𑈝𑈬𑈦𑈪𑈵𑈺𑈤𑈬𑈞𑈨𑈟𑈦𑈭𑈨𑈬𑈦𑈩𑈵𑈥𑈺𑈩𑈦𑈵𑈨𑈰𑈩𑈶𑈬𑈤𑈟𑈭𑈺𑈩𑈛𑈩',
			khudawadi: '𑋘𑋍𑋪𑋙 𑋂𑊼𑋍𑋡 𑋜𑋠𑋑𑋪𑋍𑋡𑋑𑋪𑋘𑋠𑋘𑋝𑋪𑋛𑋠𑋍𑋑𑋪𑋍𑋪𑋙𑋪𑋘𑋠𑋌𑋠𑋟 𑊱𑋐𑋠𑋙𑋞𑋪 𑋗𑋠𑋑𑋛𑋒𑋙𑋡𑋛𑋠𑋙𑋝𑋪𑋘 𑋝𑋙𑋪𑋛𑋥𑋜𑋩𑋠𑋗𑋒𑋡',
			korean:
				'키스의 고유조건은 입술끼리 만나야 하고 특별한 기술은 필요치 않다.',
			lao: 'ດ້ວຍເຫດວ່າ ການຮັບຮູ້ກຽດຕິສັກອັນມີປະຈຳຢູ່ຕົວບຸກຄົນໃນວົງສະກຸນຂອງມະນຸດທຸກໆຄົນ',
			lepcha:
				'ᰚᰊᰥ ᰈᰃᰊᰧ ᰡᰦᰰᰊᰧᰍᰤᰦᰚᰠᰟᰦᰊᰰᰊᰥᰤᰦᰍᰦᰵ ᰣᰦᰌᰦᰛᰝ ᰕᰦᰍᰟᰎᰛᰧᰟᰦᰛᰠᰤ ᰠᰲᰟᰬᰡ᰷ᰦᰕᰎᰧ ᰠᰌᰠᰤᰦᰍᰦᰵ',
			limbu: 'ᤂᤡᤷᤗᤡ ᤕᤠ᤺ᤶᤒᤰ ᤆᤠ᤺ᤣᤰᤁᤡ ᤁᤧᤘᤠ᤹ᤒᤠ ᤔᤏᤠᤜᤠ᤹ ᤁᤢᤓᤡ᤺ᤰᤔᤠᤴ ᤔᤧᤂᤧᤵᤛᤢᤴᤏᤠᤔᤧᤴᤏᤧ ᤋᤁᤠᤳ ᤑᤧᤈᤠ ᤘᤠᤑᤣ᤹ ᤔᤧᤕᤠᤱᤛᤡᤱᤅᤠᤱ',
			'linear-a': '𐘀𐘁𐘂𐘃𐘄𐘅𐘆 𐘣𐘤𐘥𐘦𐘧𐘨𐘩 𐚯𐚰𐚱𐚲𐚳𐚴𐚵 𐜟𐜠𐜡𐜢𐜣𐜤𐜥 𐚨𐚩𐚪𐚫𐚬𐚭𐚮 𐛋𐛌𐛍𐛎𐛏𐛐𐛑',
			'linear-b': '𐀴𐀪𐀡𐀆𐄀𐁁𐀐𐀄𐄀𐀐𐀩𐀯𐀍𐄀𐀸𐀐 𐃠 𐄈 𐀴𐀪𐀡𐄀𐀁𐀕𐄀𐀡𐀆𐄀𐀃𐀺𐀸 𐃠 𐄇 𐀴𐀪𐀡𐄀𐀐𐀩𐀯𐀍𐄀𐀸𐀐𐄀𐀀𐀢𐄀𐀐𐀏𐀄𐀕𐀜',
			lisu: 'ꓞꓳ ꓘꓹ ꓠꓯꓹꓼ ꓢꓲ ꓫꓬ ꓟ ꓙ ꓖꓴ ꓗꓪ ꓟꓬꓱꓽ ꓧꓳꓽ ꓢꓴ ꓠꓬ꓾',
			lycian: '𐊁𐊂𐊚𐊑𐊏𐊚 𐊓𐊕𐊑𐊏𐊀𐊇𐊒 𐊎𐊚𐊏 𐊁𐊓𐊕𐊑𐊏𐊀𐊇𐊀𐊗𐊚 𐊛𐊀𐊏𐊀𐊅𐊀𐊈𐊀 𐊛𐊕𐊓𐊓𐊆𐊍𐊀𐊅𐊆',
			lydian: '𐤠𐤨𐤯𐤦𐤫 𐤫𐤵𐤲𐤦𐤳 𐤲𐤤𐤩𐤷𐤨 𐤱𐤶𐤫𐤳𐤷𐤦𐤱𐤦𐤣 𐤱𐤠𐤨𐤪𐤷 𐤠𐤭𐤯𐤦𐤪𐤰𐤮',
			mahajani: '𑅛𑅣𑅭 𑅛𑅗𑅣𑅑 𑅰𑅳𑅐𑅧𑅣𑅑𑅧𑅛𑅐𑅛𑅰𑅯𑅐𑅣𑅧𑅣𑅭𑅛𑅐𑅢𑅐𑅧 𑅐𑅦𑅐𑅭𑅱 𑅬𑅐𑅧𑅯𑅨𑅭𑅑𑅯𑅐𑅭𑅰𑅛',
			mandaic: 'ࡕࡉࡁࡉࡋ ࡓࡌࡀ ࡀࡐࡀࡓࡀ ࡀࡎࡀࡓ ࡏࡅࡕࡓࡀ ࡂࡁࡓࡀ ࡍࡄࡅࡓࡀ ࡁࡓࡀࡄࡉࡌ',
			manichaean: '𐫖𐫗 𐫘𐫁𐫁 𐫖𐫇𐫅𐫏𐫤𐫀 𐫁𐫀𐫏𐫞𐫡𐫀 𐫢𐫡𐫢𐫗𐫏𐫀 𐫓𐫐𐫓𐫆 𐫆𐫅𐫖𐫀 𐫅𐫐',
			malayalam: 'അവരുടെ എല്ലാ ഉപകരണങ്ങളും യന്ത്രങ്ങളും ഏതെങ്കിലും രൂപത്തിൽ സജീവമാണ്.',
			marchen: '𑲉𑱺𑲪 𑱸𑱴𑱺𑲱 𑲌𑲰𑱽𑲚𑲱𑱽𑲩𑲰𑲉𑲍𑲥𑲰𑱺𑱽𑲚𑲪𑲩𑲰𑱽𑲰𑲵 𑲏𑲰𑱼𑲮𑲰𑲊𑲎 𑲁𑲰𑱽𑲅𑱾𑲊𑲱𑲅𑲰𑲊𑲍𑲩 𑲍𑲊𑲥𑲳𑲌𑲰𑲁𑱾𑲱 𑲍𑱼𑲍𑲩𑲰𑱽𑲰𑲵',
			'masaram-gondi': '𑴥𑴰 𑴓𑴎𑴛𑴲 𑴩𑴱𑴟𑵅𑴛𑴲𑴟𑵅𑴥𑴱𑴥𑴫𑵅𑴨𑴱𑴛𑴟𑵄𑴰𑵅𑴥𑴱𑴚𑴱𑵀 𑴁𑴞𑴱𑴦𑵁',
			'mayan-numerals': '𝋠𝋡𝋢𝋣𝋤𝋥𝋦 𝋧𝋨𝋩𝋪𝋫𝋬𝋭',
			medefaidrin: '𖹀𖹦𖹻𖹧 𖹻 𖹫𖹠𖹦𖹤 𖹃𖹣𖹫 𖹤𖹨 𖹦𖹻𖹫𖹤 𖹣𖹫 𖹤𖹠 𖹛𖹫 𖹧𖹨𖹫𖹤𖹣 𖹫𖹤𖹣𖹧𖹨',
			meroitic: '𐦣𐦤𐦥𐦦𐦮𐦯𐦰 𐦀𐦁𐦂𐦃𐦄𐦅𐦆 𐦱𐦲𐦳𐦴𐦵𐦶𐦷 𐦾𐦿𐦧𐦨𐦩𐦪𐦫 𐦑𐦒𐦓𐦔𐦠𐦡𐦢 𐦜𐦝𐦞𐦟𐦎𐦏𐦐',
			miao: '𖼐𖽪𖾐 𖼞𖽪 𖼷𖽷 𖽐𖼊𖽪𖾏 𖼷𖽷 𖼊𖽡 𖽐𖼞𖽻𖾏 𖼽𖽘 𖼮𖽷𖾑 𖼨𖽑𖽪𖾐 𖽐𖼊𖽪𖾏 𖼎𖽻 𖼡𖽑𖽔𖾑 𖼀𖽱 𖼎𖽻 𖼡𖽻𖾐 𖽐𖼊𖽪𖾏 𖼀𖽡𖾐 𖼳𖽔𖾐',
			modi: '𑘕𑘿𑘧𑘰 𑘀𑘨𑘿𑘞𑘲 𑘦𑘰𑘡𑘪 𑘎𑘳𑘘𑘳𑘽𑘪𑘰𑘝𑘲𑘩 𑘭𑘨𑘿𑘪 𑘪𑘿𑘧𑘎𑘿𑘝𑘲𑘽𑘓𑘲 𑘭𑘿𑘪𑘰𑘥𑘰𑘪𑘲𑘎 𑘢𑘿𑘨𑘝𑘲𑘬𑘿𑘙𑘰 𑘪',
			mongolian: 'ᠬᠦᠮᠦᠨ ᠪᠦᠷ ᠲᠥᠷᠥᠵᠦ ᠮᠡᠨᠳᠡᠯᠡᠬᠦ ᠡᠷᠬᠡ ᠴᠢᠯᠥᠭᠡ ᠲᠡᠢ᠂',
			mro: '𖩂𖩒𖩀𖩓𖩒 𖩋𖩒𖩌𖩒𖩀𖩊 𖩔𖩆𖩏𖩀𖩊𖩏𖩂𖩆𖩂𖩒𖩔𖩗𖩆𖩀𖩒𖩏𖩀𖩓𖩂𖩆𖩏𖩆𖩃 𖩆𖩅𖩆𖩓𖩒𖩉',
			multani: '𑊡𑊖𑊢 𑊌𑊆𑊖 𑊥𑊚𑊖𑊚𑊡𑊡𑊥𑊤𑊖𑊚𑊖𑊢𑊡𑊕𑊚 𑊀𑊙𑊢𑊦 𑊠𑊚𑊤𑊛𑊢𑊤𑊢𑊥𑊡 𑊥𑊢𑊤𑊥𑊠𑊛',
			music: '𝄆 𝄙𝆏 𝅗𝅘𝅥𝅘𝅥𝅯𝅘𝅥𝅱 𝄞𝄟𝄢 𝄾𝄿𝄎 𝄴 𝄶𝅁 𝄭𝄰 𝇛𝇜 𝄊 𝄇 𝀸𝀹𝀺𝀻𝀼𝀽 𝈀𝈁𝈂𝈃𝈄𝈅',
			myanmar:
				'သီဟိုဠ်မှ ဉာဏ်ကြီးရှင်သည် အာယုဝဍ္ဎနဆေးညွှန်းစာကို ဇလွန်ဈေးဘေးဗာဒံပင်ထက် အဓိဋ္ဌာန်လျက် ဂဃနဏဖတ်ခဲ့သည်။',
			nabataean: '𐢓𐢔 𐢖𐢃𐢂 𐢓𐢈𐢅𐢍𐢞𐢀 𐢃𐢁𐢍𐢚𐢛𐢀 𐢝𐢛𐢝𐢕𐢍𐢀 𐢑𐢏𐢑𐢆 𐢇𐢅𐢓𐢀 𐢅𐢏',
			'new-tai-lue': 'ᦝᧂᦑᦸᦰ ᦍᦸᧆᦑᦲᧈᦷᦢᦆᧄ ᦅᧀᦂᦱᧂᦐᦸᧂ ᦂᦱᧁ ᦙᦸᧃᦟᦱᧆᦓᧄᧉ ᦶᦙᧈᦷᦎᦶᦂᧄᧉ',
			newa: '𑐳𑐎𑐮𑐾𑑄 𑐩𑐣𑐹𑐟 𑐳𑑂𑐰𑐟𑐣𑑂𑐟𑑂𑐬 𑐰 𑐖𑑂𑐰𑐮𑐶𑐖𑑂𑐰𑑅 𑐁𑐟𑑂𑐩𑐳𑐩𑑂𑐩𑐵𑐣 𑐰 𑐰𑐵𑑄 𑐡𑐂𑐎𑐠𑑄 𑐧𑐸𑐂',
			nko: 'ߞߣߐ߫ ߛߓߍߟߌ߫ ߞߊߡߊ߬ ߞߊ߬ ߞߐߕߐ߮ ߞߎߘߊ ߘߏ߫ ߘߊߦߟߍ߬ ߸ ߏ߬ ߞߐ߫',
			nushu:
				'𛇤𛅰𛈕𛅸𛇃𛆤𛈕𛇤𛅰𛈕𛅸𛇃𛆤𛈕𛇤𛅰𛈕𛅸𛇃𛆤𛈕𛇤𛅰𛈕𛅸𛇃𛆤𛈕𛇤𛅰𛈕𛅸𛇃𛆤𛈕𛇤𛅰𛈕𛅸𛇃𛆤𛈕',
			'nyiakeng-puachue-hmong': '𞄔𞄄𞄧𞄤𞄃𞄧𞄴𞄅𞄫𞄵𞄘𞄧𞄵𞄉𞄨𞄴 𞄀𞄧𞄲𞄤𞄎𞄪𞄳𞄘𞄬𞄲𞄚𞄄𞄲𞄫𞄃𞄄𞄦𞄰𞄤𞄊𞄦𞄰𞄜𞄤𞄵𞄨𞄋𞄨𞄴',
			ogham: '᚛ᚌᚔᚚ ᚓ ᚈᚔᚄᚓᚇ ᚔᚅ ᚃᚐᚔᚇᚉᚆᚓ᚜ ᚛ᚇᚘᚐ ᚋᚁᚐ ᚌᚐᚄᚉᚓᚇᚐᚉᚆ᚜',
			'ol-chiki': 'ᱭᱚᱛᱨᱚ ᱡᱚᱜᱚᱛᱤ ᱥᱟᱱᱛᱤᱱᱭᱟᱭᱚᱥᱣᱟᱛᱚᱱᱛᱨᱭᱟᱬᱟᱝ ᱟᱫᱷᱟᱨᱚᱷ',
			'old-hungarian':
				'𐲪𐲢𐲙𐲔 𐲥𐲬𐲖𐲦𐲤𐲦𐲬𐲖 𐲌𐲛𐲍𐲮𐲀𐲙 𐲐𐲢𐲙𐲔 𐲯𐲢𐲞𐲦  𐲥𐲀𐲯𐲎 𐲥𐲦𐲙𐲇𐲞𐲂𐲉 𐲘𐲀𐲨𐲤 𐲒𐲀𐲙𐲛𐲤 𐲤𐲨𐲦𐲙 𐲓𐲛𐲮𐲀𐲆 𐲆𐲐𐲙𐲀𐲖𐲦𐲔 𐲘𐲀𐲨𐲀𐲤𐲘𐲤𐲦𐲢 𐲍𐲢𐲍𐲗𐲘𐲤𐲦𐲢𐲆𐲐𐲙𐲀𐲖𐲦𐲀𐲔 𐲍 𐲐𐲒 𐲀 𐲤 𐲐 𐲗 𐲗 𐲖𐲦 𐲀',
			'old-italic': '𐌆𐌀𐌌𐌈𐌉𐌂 𐌈𐌖𐌍 𐌗𐌀𐌓𐌖𐌍 𐌘𐌄𐌓𐌔𐌖 𐌆𐌀𐌌𐌀𐌈𐌉 𐌀𐌉𐌔 𐌑𐌀𐌔 𐌐𐌖𐌉𐌀',
			'old-north-arabian': '𐪃𐪌 𐪊𐪈𐪈 𐪃𐪅𐪕𐪚𐪗𐪑 𐪈𐪑𐪚𐪄𐪇𐪑 𐪏𐪇𐪏𐪌𐪚𐪑 𐪁𐪋𐪁𐪀 𐪀𐪕𐪃𐪑 𐪕𐪋',
			'old-permic': '𐍐𐍑𐍒𐍓𐍔𐍕𐍖 𐍞𐍟𐍠𐍡𐍢𐍣𐍤 𐍥𐍦𐍧𐍨𐍩𐍪𐍫 𐍗𐍘𐍙𐍚𐍛𐍜𐍝 𐍬𐍭𐍮𐍯𐍰𐍱𐍲',
			'old-persian': '𐎹𐎫𐎼𐏐𐎩𐎥𐎫𐎡𐏐𐏁𐎠𐎴𐎫𐎡𐎴𐎹𐎠𐎹𐎿𐎺𐎠𐎫𐎴𐎫𐎼𐎹𐎠𐎴𐎠𐎶𐏐𐎠𐎭𐎠𐎼𐏃𐏐𐎶𐎠𐎴𐎺𐎱𐎼𐎡𐎺𐎠𐎼𐎿𐎹',
			'old-sogdian': '𐼍𐼏 𐼑𐼂𐼃 𐼍𐼇𐼌𐼊𐼚𐼁 𐼂𐼀𐼊𐼋𐼘𐼁 𐼙𐼘𐼙𐼎𐼊𐼁 𐼌𐼋𐼌𐼅 𐼆𐼌𐼍𐼁 𐼌𐼋',
			'old-south-arabian': '𐩣𐩬 𐩪𐩨𐩨 𐩣𐩥𐩵𐩺𐩩𐩱 𐩨𐩱𐩺𐩤𐩧𐩱 𐩦𐩧𐩦𐩬𐩺𐩱 𐩡𐩫𐩡𐩠 𐩠𐩵𐩣𐩱 𐩵𐩫',
			'old-turkic': '𐱅𐰇𐰼𐰜 𐰆𐰍𐰔 𐰋𐰏𐰠𐰼𐰃 𐰉𐰆𐰑𐰣 𐱁𐰃𐰓𐰤 𐰇𐰔𐰀 𐱅𐰭𐰼𐰃 𐰉𐰽𐰢𐰽𐰺 𐰽𐰺𐰀 𐰘𐰃𐰼 𐱅𐰠𐰃𐰤𐰢𐰾𐰼',
			oriya: 'ଏହା କେବଳ ଏକ ସମୟ କଥା ହିଁ ଥିଲା.',
			osage: '𐒻𐓲𐓣𐓤𐓪 𐓰𐓘͘𐓤𐓘 𐓷𐓣͘ 𐓘𐓵𐓟 𐓘𐓬𐓘 𐓤𐓘𐓸𐓘 𐓤𐓯𐓣 𐓘𐓵𐓟 𐓘𐓬𐓘 𐓪𐓬𐓸𐓘',
			osmanya: '𐒛𐒆𐒖𐒒𐒖𐒔𐒖 𐒊𐒖𐒑𐒑𐒛𐒒𐒂𐒕𐒈 𐒓𐒚𐒄𐒓 𐒊𐒖𐒉𐒛 𐒘𐒈𐒖𐒌𐒝 𐒄𐒙𐒇 𐒖𐒔',
			'pahawh-hmong': '𖬑𖬦𖬰 𖬇𖬰𖬧𖬵 𖬁𖬲𖬬 𖬇𖬲𖬤 𖬓𖬲𖬞 𖬐𖬰𖬦 𖬉 𖬘𖬲𖬤 𖬀𖬰𖬝𖬵 𖬔𖬟𖬰 𖬂𖬲𖬤𖬵 𖬅𖬲𖬨𖬵 𖬓𖬲𖬥𖬰 𖬄𖬲𖬟',
			palmyrene: '𐡬𐡭 𐡯𐡡𐡡 𐡬𐡥𐡣𐡩𐡶𐡠 𐡡𐡠𐡩𐡳𐡴𐡠 𐡵𐡴𐡵𐡭𐡩𐡠 𐡫𐡪𐡫𐡤 𐡤𐡣𐡬𐡠 𐡣𐡪',
			'pau-cin-hau': '𑫢𑫪𑫫𑫬𑫭𑫮𑫯 𑫸𑫱𑫲𑫳𑫴𑫵𑫶 𑫔𑫜𑫝𑫞𑫟𑫠𑫡 𑫀𑫁𑫂𑫃𑫄𑫅𑫆 𑫰𑫕𑫖𑫗𑫘𑫙𑫚 𑫣𑫤𑫥𑫦𑫧𑫨𑫩',
			'phags-pa': 'ꡗ ꡈꡱ ᠂ ꡒ ꡂ ꡈꡞ ᠂ ꡚꡖꡋ ꡈꡞꡋꡨꡖ ꡗꡛꡧꡖ ꡈꡋ ꡈꡱꡨꡖ ꡳꡬꡖ',
			phoenician: '𐤌𐤍 𐤎𐤁𐤁 𐤌𐤅𐤃𐤉𐤕𐤀 𐤁𐤀𐤉𐤒𐤓𐤀 𐤔𐤓𐤔𐤍𐤉𐤀 𐤋𐤊𐤋𐤄 𐤄𐤃𐤌𐤀 𐤃𐤊',
			'psalter-pahlavi': '𐮋𐮌 𐮍𐮁𐮁 𐮋𐮅𐮃𐮈𐮑𐮀 𐮁𐮀𐮈𐮋𐮅𐮀 𐮐𐮅𐮐𐮌𐮈𐮀 𐮊𐮉𐮊𐮄 𐮄𐮃𐮋𐮀 𐮃𐮉',
			rejang: 'ꤰꥈꤳꥎ ꤳꥈꥐ ꤾꥁꥉꥑ ꤸꥎꥑꤴꥉꤰ ꤳ꥓ꤸꥈꥆꥐ ꥁꥋꤰ꥓ꥁꥋꤰ꥓ ꤴꥎ ꤼ꥓ꤽꥊ  ꤰꥈꤳꥎ ꤵꤱꥇꥒꤰ꥓ꤷꥒ ꥆꤰꥎꥒ ꤶꥉꤰꥉꥑ',
			runic: 'ᚨᛚᛚᚨᛁ ᛗᚨᚾᚾᚨ ᚠᚱᛖᛁᚺᚨᛚᛋ ᛃᚨᚺ ᛋᚨᛗᚨᛚᛖᛁᚲᛟ ᛁᚾ ᚹᚨᛁᚱᚦᛁᛞᚨᛁ',
			samaritan: 'ࠌࠍ ࠎࠁࠁ ࠌࠅࠃࠉࠕࠀ ࠁࠀࠉࠒࠓࠀ ࠔࠓࠔࠍࠉࠀ ࠋࠊࠋࠄ ࠄࠃࠌࠀ ࠃࠊ',
			saurashtra: 'ꢫꢡ꣄ꢬ ꢙꢔꢡꢶ ꢯꢵꢥ꣄ꢡꢶꢥ꣄ꢫꢵꢫꢱ꣄ꢮꢵꢡꢥ꣄ꢡ꣄ꢬ꣄ꢫꢵꢠꢵꢀ ꢃꢤꢵꢬꢁ ꢪꢵꢥꢮꢦꢬꢶꢮꢵꢬꢱ꣄ꢫ ꢱꢬ꣄ꢮꢿꢰꢵꢪꢦꢶ',
			sharada:
				'𑆪𑆠𑇀𑆫 𑆘𑆓𑆠𑆴 𑆯𑆳𑆤𑇀𑆠𑆴𑆤𑇀𑆪𑆳𑆪𑆱𑇀𑆮𑆳𑆠𑆤𑇀𑆠𑇀𑆫𑇀𑆪𑆳𑆟𑆳𑆁 𑆄𑆣𑆳𑆫𑆂 𑆩𑆳𑆤𑆮𑆥𑆫𑆴𑆮𑆳𑆫𑆱𑇀𑆪 𑆱𑆫𑇀𑆮𑆼𑆰𑆳𑆩𑆥𑆴',
			shavian: '𐑢𐑺𐑨𐑟 𐑮𐑧𐑒𐑩𐑜𐑯𐑦𐑖𐑩𐑯 𐑝 𐑞 𐑦𐑯𐑣𐑧𐑮𐑩𐑯𐑑 𐑛𐑦𐑜𐑯𐑦𐑑𐑦 𐑯 𐑝',
			siddham: '𑖧𑖝𑖿𑖨 𑖕𑖐𑖝𑖰 𑖫𑖯𑖡𑖿𑖝𑖰𑖡𑖿𑖧𑖯𑖧𑖭𑖿𑖪𑖯𑖝𑖡𑖿𑖝𑖿𑖨𑖿𑖧𑖯𑖜𑖯𑖽 𑖁𑖠𑖯𑖨𑖾 𑖦𑖯𑖡𑖪𑖢𑖨𑖰𑖪𑖯𑖨𑖭𑖿𑖧 𑖭𑖨𑖿𑖪𑖸𑖬𑖯𑖦𑖢𑖰',
			signwriting: '𝧿𝨊𝡝𝪜𝦦𝪬𝡝𝪩𝡝𝪡𝤅',
			sinhala: 'එය කාලය පිළිබඳ ප්‍රශ්නයක් පමණක් විය.',
			sogdian: '𐼺𐼻 𐼼𐼱𐼱 𐼺𐼴𐼹𐼷𐽂𐼰 𐼱𐼰𐼷𐼸𐽀𐼰 𐽁𐽀𐽁𐼻𐼷𐼰 𐽄𐼸𐽄𐼳 𐼳𐼹𐼺𐼰 𐼹𐼸',
			'sora-sompeng': '𑃜𑃑𑃝 𑃠𑃕𑃑𑃤 𑃐𑃠𑃢𑃙𑃑𑃤𑃙𑃜𑃢𑃜𑃐𑃚𑃢𑃑𑃙𑃑𑃝𑃜𑃢𑃙𑃨𑃢𑃖 𑃢𑃔𑃨𑃠𑃢𑃝𑃞',
			soyombo: '𑩻𑩫𑪙𑩼 𑩣𑩞𑩫𑩑 𑩿𑩛𑩯𑪙𑩫𑩑𑩯𑪙𑩻𑩛𑩻𑪁𑪙𑩾𑩛𑩫𑩯𑪙𑩫𑪙𑩼𑪙𑩻𑩛𑩪𑩛𑪖 𑩐𑩛𑩮𑩛𑩼𑪗',
			sundanese: 'ᮚᮒᮢ ᮏᮌᮒᮤ ᮯᮔ᮪ᮒᮤᮔᮡᮚᮞ᮪ᮝᮒᮔ᮪ᮒᮢᮡᮔᮀ ᮃᮓᮛᮂ ᮙᮔᮝᮕᮛᮤᮝᮛᮞᮡ ᮞᮁᮝᮨᮯᮙᮕᮤ ᮞᮓᮞᮡᮔᮀ',
			'syloti-nagri':
				'ꠎꠔ꠆ꠞ ꠎꠉꠔꠤ ꠡꠣꠘ꠆ꠔꠤꠘ꠆ꠎꠣꠎꠡ꠆ꠛꠣꠔꠘ꠆ꠔ꠆ꠞ꠆ꠎꠣꠘꠣꠋ ꠀꠗꠣꠞꠢ꠆ ꠝꠣꠘꠛꠙꠞꠤꠛꠣꠞꠡ꠆ꠎ ꠡꠞ꠆ꠛꠦꠡꠣꠝꠙꠤ',
			syriac: 'ܟܠ ܒܪܢܫܐ ܒܪܝܠܗ ܚܐܪܐ ܘܒܪܒܪ ܓܘ ܐܝܩܪܐ ܘܙܕܩܐ.',
			tagalog: 'ᜀᜅ᜔ ᜎᜑᜆ᜔ ᜅ᜔ ᜆᜂᜌ᜔ ᜁᜐᜒᜈᜒᜎᜅ᜔ ᜈ ᜋᜎᜌ ᜀᜆ᜔ ᜉᜈ᜔ᜆᜌ᜔ᜉᜈ᜔ᜆᜌ᜔ ᜐ ᜃᜇᜅᜎᜈ᜔',
			tagbanwa: 'ᝬᝦᝮ ᝧᝤᝦᝲ ᝰᝨᝦᝲᝨᝬᝬᝰᝯᝦᝨᝦᝮᝬᝨᝫ ᝠᝧᝮᝣ ᝫᝨᝯᝩᝮᝲᝯᝮᝰᝬ ᝰᝮᝯᝲᝰᝫᝩᝲ',
			'tai-le': 'ᥓᥣᥳ ᥞᥨᥛ ᥑᥤᥴ ᥘᥤ ᥞᥨᥛ ᥓᥨᥛᥰ ᥓᥣᥳ ᥙᥣᥰ ᥘᥤ ᥑᥤᥴ ᥙᥣᥰ',
			'tai-tham': 'ᨾᨶᩩᩔ᩼ᨴ᩠ᨦᩢᩉᩖᩣ᩠ᨿᨠᩮ᩠ᨯᩨᨾᩣᨾᩦᨻ᩠ᨦᩈᩁᩓᩢᨹ᩠ᨿ᩵ᨦᨻ᩠ᨿᨦᨠ᩠ᨶᩢ ᨶᩱᨠᩥᨲ᩠ᨲᩥᩈ᩠ᨠᩢ ᩓᩢᩈᩥᨴ᩠ᨵᩥ ᨲ᩵ᩣ᩠ᨦᨣᩳ᩶ᨣᩢᨾᩦᨾᨶᩮᩣᨵᨾ᩠ᨾ᩼ᩓᩢ',
			'tai-viet': 'ꪫꪸꪀ ꪶꪀꪉ ꪐꪽ ꪻꪬ ꪩꪾꪣ ꫛ ꪶꪔꪙ ꪠꪴ ꪝꪳꪉ ꪁꪫꪸꪙ ꪹꪋꪷꪉ ꪝꪸꪉ ꪹꪚꪱ',
			takri: '𑚣𑚙𑚶𑚤 𑚑𑚌𑚙𑚮 𑚧𑚭𑚝𑚶𑚙𑚮𑚝𑚶𑚣𑚭𑚣𑚨𑚶𑚦𑚭𑚙𑚝𑚶𑚙𑚶𑚤𑚶𑚣𑚭𑚘𑚭𑚫 𑚁𑚜𑚭𑚤𑚬 𑚢𑚭𑚝𑚦𑚞𑚤𑚮𑚦𑚭𑚤𑚨𑚶𑚣 𑚨𑚤𑚶𑚦𑚲𑚋𑚭𑚢𑚞𑚮',
			tamil: 'அந்திமாலையில், அலைகள் வேகமாக வீசத் தொடங்கின.',
			'tamil-supplement': '𑿕𑿖𑿗𑿘𑿙𑿚𑿛 𑿱𑿪𑿫𑿬𑿭𑿮𑿯 𑿰𑿣𑿤𑿥𑿦𑿧𑿨 𑿩𑿜𑿝𑿞𑿟𑿠𑿡',
			tangut:
				'𗀔𗼘𗁅𗔔𗀄𗀇𗦲𗤶𗊴𗼑𗀂𗧍𗙏𘏫𗒹𘊝𗼮𗢯𗐴𘋨𗄊𗵤𗀈𗀊𘈩𗏘𗿉𗮶𗥠𗡞𘟪𗋽𘎃𗕑𘜶𗀋𗵃𗀆𗋾𘉋𗜐𗀃𗦻𗵒𘓐𗤁𗭒𗌜𗀀𗀅𗫌𗀁𗰗𗱸𗘮𗍫𗏁𗃑𗀉𗮺𗼹𗥃𗴂𘕕𗢭𗁃𗢸𗤒𗑉𗰭',
			telugu: 'ఆ రాత్రి మొదటిసారిగా ఒక నక్షత్రం నేలరాలింది.',
			tibetan: 'ཁོ་ཚོའི་སྒྲིག་ཆས་དང་ལག་ཆ་ཡོད་ཚད་གསོན་པོ་རེད།',
			tifinagh: 'ⵍⵍⵉⵖ ⵜⴳⴰ ⵜⵓⴽⵣⴰ ⵏ ⵓⵍⵍⴰⵍⵓ ⵏ ⴽⴰⵢⴳⴰⵜ ⵢⴰⵏ ⵖ ⵜⴰⵡⵊⴰ',
			tirhuta: '𑒨𑒞𑓂𑒩 𑒖𑒑𑒞𑒱 𑒬𑒰𑒢𑓂𑒞𑒱𑒢𑓂𑒨𑒰𑒨𑒮𑓂𑒫𑒰𑒞𑒢𑓂𑒞𑓂𑒩𑓂𑒨𑒰𑒝𑒰𑓀 𑒂𑒡𑒰𑒩𑓁 𑒧𑒰𑒢𑒫𑒣𑒩𑒱𑒫𑒰𑒩𑒮𑓂𑒨 𑒮𑒩𑓂𑒫𑒹𑒭𑒰𑒧𑒣𑒱',
			thaana: 'ދެންފަހެ، މިނިވަންކަމާއި، ޢަދުލުވެރިކަމާއި، ޞުލްޙަވެރިކަން ދުނިޔޭގައި ޤާއިމުވެ',
			thai: 'การเดินทางขากลับคงจะเหงา',
			ugaritic: '𐎎𐎐 𐎒𐎁𐎁 𐎎𐎆𐎄𐎊𐎚𐎀 𐎁𐎀𐎊𐎖𐎗𐎀 𐎌𐎗𐎌𐎐𐎊𐎀 𐎍𐎋𐎍𐎅 𐎅𐎄𐎎𐎀 𐎄𐎋',
			vai: 'ꕪꘋ ꖷ ꗞꔧ ꕀꔤ ꔻꔤ ꔤ ꗃꗡ ꖸꕊ ꗪꗡ ꔻꔤꘂ ꕮ ꘃꖷ ꕉ ꗋꘋ ꕉꕜꕮ',
			vietnamese: 'Bầu trời trong xanh thăm thẳm, không một gợn mây.',
			wancho: '𞋙𞋞𞋩𞋛𞋔 𞋉𞋞𞋮𞋎𞋀𞋮 𞋔𞋜𞋘𞋯 𞋐𞋀𞋞 𞋔𞋁𞋞 𞋋𞋁𞋘 𞋚𞋕𞋉𞋯 𞋃𞋁 𞋐𞋛𞋯',
			'warang-citi': '𑣅𑣕𑣜 𑣎𑣋𑣕𑣂 𑣞𑣁𑣓𑣕𑣂𑣓𑣅𑣁𑣅𑣞𑣟𑣁𑣕𑣓𑣕𑣜𑣅𑣁𑣐𑣁𑣀 𑣁𑣙𑣔𑣁𑣜𑣄 𑣖𑣁𑣓𑣟𑣘𑣜𑣂𑣟𑣁𑣜𑣞𑣅',
			yezidi: '𐺀𐺁𐺍𐺄𐺆𐺍𐺦𐺍 𐺀𐺍𐺁 𐺆𐺀𐺆𐺄𐺁𐺆 𐺦𐺆𐺦 𐺦𐺀𐺍 𐺍𐺦𐺆𐺍𐺁𐺀𐺄𐺍𐺀 𐺆𐺆𐺀𐺀',
			yi: 'ꊽꋩꅍꏭꉜꀋꒉꌠꌋꆀꉜꄸꑠꆹꅢꎆꌊꆀꍀꆿꃅꇏꅊꀐꃅꇏꋋꈨꆹꃰꊿꂄꉌꇬꍍꄀꌠꉬꊿꂷꈀꐥꃅꐥꋭꅇꉉꈋꍣꌋꆀꑇꌠꄿꐨꐥ',
			'zanabazar-square': '𑨪𑨙𑩇𑨫 𑨒𑨍𑨙𑨁 𑨮𑨊𑨝𑩇𑨙𑨁𑨝𑩇𑨪𑨊𑨪𑨰𑩇𑨭𑨊𑨙𑨝𑩇𑨙𑩇𑨫𑩇𑨪𑨊𑨘𑨊𑨸 𑨀𑨊𑨜𑨊𑨫𑨹',
		},
	},
	search: {
		default: {
			label: 'Sentence',
			value: sharedPreviewText.latinSentence,
		},
		groups: [
			{
				label: 'Sentences',
				options: [
					{
						label: 'Sentence',
						value: 'The quick brown fox jumps over the lazy dog.',
					},
					{
						label: 'Sentence',
						value: sharedPreviewText.latinSentence,
					},
				],
			},
			{
				label: 'Alphabets',
				options: [
					{ label: 'Alphabet', value: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
					{ label: 'Alphabet', value: 'abcdefghijklmnopqrstuvwxyz' },
				],
			},
			{
				label: 'Numbers',
				options: [{ label: 'Number', value: sharedPreviewText.digits }],
			},
			{
				label: 'Symbols',
				options: [{ label: 'Symbol', value: "!@#$%^&*()_+-=[]{}|;':,./<>?" }],
			},
		],
	},
	editor: {
		sampleLengths: {
			headline: 'short',
			paragraph: 'long',
			waterfall: 'short',
			compare: 'short',
		},
		defaults: {
			headline: 'Every letter has\na point of view.',
			paragraph:
				'A typeface changes the temperature of a sentence before its meaning has time to settle. Set a few lines, adjust the rhythm, and see an ordinary paragraph find its own voice.',
			waterfall: 'Sphinx of black quartz',
		},
		familyKinds: {
			digital: {
				headline: sharedPreviewText.digitalTime,
				paragraph: 'TEMPERATURE 24.5   DISTANCE 120.8',
				waterfall: sharedPreviewText.digitalTime,
				compare: sharedPreviewText.digits,
			},
			punctuation: {
				headline: sharedPreviewText.punctuation,
				paragraph: sharedPreviewText.punctuation,
				waterfall: sharedPreviewText.punctuation,
				compare: sharedPreviewText.punctuation,
			},
		},
		categories: {
			monospace: {
				headline: 'Same width.\nDifferent shapes.',
			},
		},
	},
};
