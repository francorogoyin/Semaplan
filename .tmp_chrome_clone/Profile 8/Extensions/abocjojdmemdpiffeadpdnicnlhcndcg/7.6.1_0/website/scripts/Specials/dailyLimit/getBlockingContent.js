const contextText = {
  title: {
    ar: "انتهى الوقت!",
    ca: "S'ha acabat el temps!",
    "zh-CN": "时间到了！",
    "zh-TW": "時間到了！",
    hr: "Vrijeme je isteklo!",
    cs: "Čas vypršel!",
    da: "Tiden er gået!",
    nl: "De tijd is om!",
    en: "Time is up!",
    fi: "Aika on lopussa!",
    fr: "Le temps s'est écoulé!",
    de: "Die Zeit ist um!",
    el: "Ο χρόνος τελειώνει!",
    he: "הזמן נגמר!",
    hi: "समय पूरा हो गया!",
    hu: "Lejárt az idő!",
    id: "Waktunya habis!",
    it: "Il tempo è scaduto!",
    ja: "時間切れです！",
    ko: "시간이 다 됐어요!",
    ms: "Masa sudah tamat!",
    no: "Tiden er ute!",
    pl: "Czas minął!",
    pt: "O tempo acabou!",
    ro: "Timpul s-a terminat!",
    ru: "Время истекло!",
    sk: "Čas vypršal!",
    es: "¡El tiempo ha terminado!",
    sv: "Tiden är ute!",
    th: "หมดเวลาแล้ว!",
    tr: "Zaman doldu!",
    uk: "Час минув!",
    vi: "Đã hết thời gian!",
  },

  text: {
    ar: "يتم توفير هذا المحتوى بواسطة ملحق المتصفح وقد حل محل الصفحة الأصلية.",
    ca: "Aquest contingut el proporciona l'extensió del navegador i ha substituït la pàgina original.",
    "zh-CN": "此内容由浏览器扩展提供，并已替换原始页面。",
    "zh-TW": "此內容由瀏覽器擴充功能提供並已取代原始頁面。",
    hr: "Ovaj sadržaj pruža proširenje preglednika i zamijenio je izvornu stranicu.",
    cs: "Tento obsah poskytuje rozšíření prohlížeče a nahradil původní stránku.",
    da: "Dette indhold leveres af browserudvidelsen og har erstattet den originale side.",
    nl: "Deze inhoud wordt geleverd door de browserextensie en heeft de originele pagina vervangen.",
    en: "This content is provided by the browser extension and has replaced the original page.",
    fi: "Tämän sisällön tarjoaa selainlaajennus, ja se on korvannut alkuperäisen sivun.",
    fr: "Ce contenu est fourni par l'extension du navigateur et a remplacé la page d'origine.",
    de: "Dieser Inhalt wird von der Browsererweiterung bereitgestellt und hat die Originalseite ersetzt.",
    el: "Αυτό το περιεχόμενο παρέχεται από την επέκταση του προγράμματος περιήγησης και έχει αντικαταστήσει την αρχική σελίδα.",
    he: "תוכן זה מסופק על ידי תוסף הדפדפן והחליף את הדף המקורי.",
    hi: "यह सामग्री ब्राउज़र एक्सटेंशन द्वारा प्रदान की गई है और इसने मूल पृष्ठ को प्रतिस्थापित कर दिया है।",
    hu: "Ezt a tartalmat a böngészőbővítmény biztosítja, és felváltotta az eredeti oldalt.",
    id: "Konten ini disediakan oleh ekstensi browser dan telah menggantikan halaman aslinya.",
    it: "Questo contenuto è fornito dall'estensione del browser e ha sostituito la pagina originale.",
    ja: "このコンテンツはブラウザ拡張機能によって提供され、元のページに置き換わりました。",
    ko: "이 콘텐츠는 브라우저 확장 프로그램에서 제공되며 원본 페이지를 대체했습니다.",
    ms: "Kandungan ini disediakan oleh sambungan penyemak imbas dan telah menggantikan halaman asal.",
    no: "Dette innholdet leveres av nettleserutvidelsen og har erstattet den opprinnelige siden.",
    pl: "Ta treść jest dostarczana przez rozszerzenie przeglądarki i zastępuje oryginalną stronę.",
    pt: "Este conteúdo é fornecido pela extensão do navegador e substituiu a página original.",
    ro: "Acest conținut este furnizat de extensia browserului și a înlocuit pagina originală.",
    ru: "Этот контент предоставляется расширением браузера и заменил исходную страницу.",
    sk: "Tento obsah poskytuje rozšírenie prehliadača a nahradilo pôvodnú stránku.",
    es: "Este contenido es proporcionado por la extensión del navegador y ha reemplazado la página original.",
    sv: "Detta innehåll tillhandahålls av webbläsartillägget och har ersatt den ursprungliga sidan.",
    th: "เนื้อหานี้จัดทำโดยส่วนขยายเบราว์เซอร์และแทนที่หน้าเดิม",
    tr: "Bu içerik tarayıcı uzantısı tarafından sağlanmıştır ve orijinal sayfanın yerini almıştır.",
    uk: "Цей вміст надається розширенням веб-переглядача та замінює оригінальну сторінку.",
    vi: "Nội dung này được cung cấp bởi tiện ích mở rộng của trình duyệt và đã thay thế trang gốc.",
  },
};

async function getBlockingContent() {
  const { socialFocus_not_syncing_state = {} } =
    await browser.storage.local.get(getConstNotSyncing.notSyncingState);

  const language =
    socialFocus_not_syncing_state[getConstNotSyncing.extensionLanguage] ?? "en";

  const element = document.documentElement;
  const variableValue = getComputedStyle(element)
    .getPropertyValue("--yt-spec-base-background")
    .trim();

  const content = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
      <div style="text-align: center; font-family: Arial, sans-serif;">
        <h1 style="font-size: 2.5em; margin-bottom: 0.5em; color: ${
          variableValue === "#0f0f0f" ? "white" : "dark"
        }">${contextText.title[language]}</h1>
        <p style="font-size: 1.2em; margin-top: 0; color:${
          variableValue === "#0f0f0f" ? "white" : "dark"
        }">${contextText.text[language]}</p>
      </div>
    </div>
  `;

  return content;
}
