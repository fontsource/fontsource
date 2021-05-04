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
      return ".نص حكيم له سر قاطع وذو شأن عظيم مكتوب على ثوب أخضر ومغلف بجلد أزرق";

    case "greek":
      return "διαφυλάξτε γενικά τη ζωή σας από βαθειά ψυχικά τραύματα.";

    case "khmer":
      return "ខ្ញុំបានមើលព្យុះ ដែលមានភាពស្រស់ស្អាតណាស់ ប៉ុន្តែគួរឲ្យខ្លាច";

    case "korean":
      return "키스의 고유조건은 입술끼리 만나야 하고 특별한 기술은 필요치 않다.";

    default:
      return "Sphinx of black quartz, judge my vow.";
  }
};
