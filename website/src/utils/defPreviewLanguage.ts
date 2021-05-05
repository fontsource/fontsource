export const selectDefPreviewText = (id: string, subset: string) => {
  switch (id) {
    case "dseg-weather":
    case "dseg14":
    case "dseg7":
      return "0123456789";

    case "material-icons":
    case "material-icons-outlined":
    case "material-icons-rounded":
    case "material-icons-sharp":
    case "material-icons-two-tone":
      return "photo_camera thumb_up assignment create_new_folder insert_invitation drafts credit_card timer check_box close";

    case "yakuhanjp":
    case "yakuhanrp":
      return "、。！？〈〉《》「」『』【】〔〕・（）：；［］｛｝";

    case "yakuhanjps":
    case "yakuhanrps":
      return "〈〉《》「」『』【】〔〕（）［］｛｝";

    case "yakuhanmp":
      return "、。！？《》「」『』【】〔〕・（）：；［］｛｝";
    case "yakuhanmps":
      return "《》「」『』【】〔〕（）［］｛｝";

    default:
      break;
  }

  switch (subset) {
    case "latin":
    case "latin-ext":
    case "all":
      return "Sphinx of black quartz, judge my vow.";

    case "arabic":
      return "الحب سماء لا تمطر غير الأحلام.";

    case "bengali":
      return "আগুনের শিখা নিভে গিয়েছিল, আর তিনি জানলা দিয়ে তারাদের দিকে তাকালেন৷";

    case "chinese-hongkong":
    case "chinese-simplified":
    case "chinese-traditional":
      return "他们所有的设备和仪器彷佛都是有生命的。";

    case "cyrillic":
      return "Алая вспышка осветила силуэт зазубренного крыла.";

    case "cyrillic-ext":
      return "Видовище перед нашими очима справді вражало.";

    case "devanagari":
      return "अंतरिक्ष यान से दूर नीचे पृथ्वी शानदार ढंग से जगमगा रही थी ।";

    case "greek":
    case "greek-ext":
      return "διαφυλάξτε γενικά τη ζωή σας από βαθειά ψυχικά τραύματα.";

    case "gujurati":
      return "અમને તેની જાણ થાય તે પહેલાં જ, અમે જમીન છોડી દીધી હતી.";

    case "gurmukhi":
      return "ਸਵਾਲ ਸਿਰਫ਼ ਸਮੇਂ ਦਾ ਸੀ।";

    case "hebrew":
      return "כך התרסק נפץ על גוזל קטן, שדחף את צבי למים.";

    case "japanese":
      return "鳥啼く声す 夢覚ませ 見よ明け渡る 東を 空色栄えて 沖つ辺に 帆船群れゐぬ 靄の中";

    case "kannada":
      return "ಇದು ಕೇವಲ ಸಮಯದ ಪ್ರಶ್ನೆಯಾಗಿದೆ.";

    case "khmer":
      return "ខ្ញុំបានមើលព្យុះ ដែលមានភាពស្រស់ស្អាតណាស់ ប៉ុន្តែគួរឲ្យខ្លាច";

    case "korean":
      return "키스의 고유조건은 입술끼리 만나야 하고 특별한 기술은 필요치 않다.";

    case "malayalam":
      return "അവരുടെ എല്ലാ ഉപകരണങ്ങളും യന്ത്രങ്ങളും ഏതെങ്കിലും രൂപത്തിൽ സജീവമാണ്.";

    case "myanmar":
      return "သီဟိုဠ်မှ ဉာဏ်ကြီးရှင်သည် အာယုဝဍ္ဎနဆေးညွှန်းစာကို ဇလွန်ဈေးဘေးဗာဒံပင်ထက် အဓိဋ္ဌာန်လျက် ဂဃနဏဖတ်ခဲ့သည်။";

    case "oriya":
      return "ଏହା କେବଳ ଏକ ସମୟ କଥା ହିଁ ଥିଲା.";

    case "sinhala":
      return "එය කාලය පිළිබඳ ප්‍රශ්නයක් පමණක් විය.";

    case "tamil":
      return "அந்திமாலையில், அலைகள் வேகமாக வீசத் தொடங்கின.";

    case "telegu":
      return "ఆ రాత్రి మొదటిసారిగా ఒక నక్షత్రం నేలరాలింది.";

    case "tibetan":
      return "ཁོ་ཚོའི་སྒྲིག་ཆས་དང་ལག་ཆ་ཡོད་ཚད་གསོན་པོ་རེད།";

    case "thai":
      return "การเดินทางขากลับคงจะเหงา";

    case "vietnamese":
      return "Bầu trời trong xanh thăm thẳm, không một gợn mây.";

    default:
      return "Sphinx of black quartz, judge my vow.";
  }
};
