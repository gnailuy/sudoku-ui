import type { MessageCatalog } from './types';

export const hi: MessageCatalog = {
  'common.language.en': 'English',
  'common.language.zh-Hans': '简体中文',
  'common.language.zh-Hant': '繁體中文',
  'common.language.pt-BR': 'Português (Brasil)',
  'common.language.pt-BR.short': 'Português',
  'common.language.es': 'Español',
  'common.language.ja': '日本語',
  'common.language.ko': '한국어',
  'common.language.fr': 'Français',
  'common.language.de': 'Deutsch',
  'common.language.ru': 'Русский',
  'common.language.ar': 'العربية',
  'common.language.id': 'Bahasa Indonesia',
  'common.language.id.short': 'Indonesia',
  'common.language.hi': 'हिन्दी',
  'common.language.it': 'Italiano',
  'common.language.tr': 'Türkçe',
  'common.language.vi': 'Tiếng Việt',
  'common.language.uk': 'Українська',
  'common.language.nl': 'Nederlands',
  'common.language.pl': 'Polski',
  'common.language.th': 'ไทย',
  'common.language.fil': 'Filipino',
  'common.language.ms': 'Bahasa Melayu',
  'common.language.ms.short': 'Melayu',
  'common.language.cs': 'Čeština',
  'common.language.sv': 'Svenska',
  'strategy.naked-single.name': 'Naked Single',
  'strategy.hidden-single.name': 'Hidden Single',
  'strategy.naked-pair.name': 'Naked Pair',
  'strategy.naked-triple.name': 'Naked Triple',
  'strategy.pointing-pair.name': 'Pointing Pairs / Box-Line Reduction',
  'strategy.hidden-pair.name': 'Hidden Pair',
  'strategy.x-wing.name': 'X-Wing',
  'strategy.xy-wing.name': 'XY-Wing',
  'strategy.hidden-triple.name': 'Hidden Triple',
  'strategy.w-wing.name': 'W-Wing',
  'strategy.swordfish.name': 'Swordfish',
  'strategy.naked-quad.name': 'Naked Quad',
  'strategy.simple-coloring.name': 'Simple Coloring',
  'strategy.hidden-quad.name': 'Hidden Quad',
  'strategy.xyz-wing.name': 'XYZ-Wing',
  'strategy.jellyfish.name': 'Jellyfish',
  'strategy.bug-plus-one.name': 'BUG+1',
  'strategy.unique-rectangle.name': 'Unique Rectangle Type 1',
  'strategy.unique-rectangle-2.name': 'Unique Rectangle Type 2',
  'strategy.unique-rectangle-3.name': 'Unique Rectangle Type 3',
  'strategy.unique-rectangle-4.name': 'Unique Rectangle Type 4',
  'strategy.x-cycles.name': 'X-Cycles',
  'strategy.xy-chain.name': 'XY-Chain',
  'strategy.backtracker.name': 'Backtracker',
  'hint.narration.period': '.',
  'hint.narration.separator': ', ',
  'game.mistakes.label': '{count, plural, one {# गलती} other {# गलतियाँ}}',
  'board.cell':
    'पंक्ति {row}, स्तंभ {column}, {content}{pending, select, true {, जाँच जारी} other {}}{invalid, select, true {, अमान्य} other {}}{hint, select, none {} other {, {hint}}}',
  'hint.target.candidate.locator': '{value} · r{row}c{column}',
  'hint.target.cell.locator': 'r{row}c{column}',
  'common.language.label': 'भाषा',
  'common.language.auto': 'ऑटो',
  'accessibility.language.changed': 'भाषा बदलकर {language} कर दी गई.',
  'common.difficulty.easy': 'आसान',
  'common.difficulty.medium': 'मध्यम',
  'common.difficulty.hard': 'कठिन',
  'common.difficulty.expert': 'विशेषज्ञ',
  'common.difficulty.evil': 'दुष्ट',
  'difficulty.easy.name': 'आसान',
  'difficulty.medium.name': 'मध्यम',
  'difficulty.hard.name': 'कठिन',
  'difficulty.expert.name': 'विशेषज्ञ',
  'difficulty.evil.name': 'दुष्ट',
  'hint.value-correction.title': 'इस मान को ठीक करें',
  'hint.candidate-correction.title': 'इस उम्मीदवार सेल को ठीक करें',
  'hint.value-correction.summary':
    '{cell} का मान पहेली से टकराता है। जारी रखने से पहले इसे साफ़ करें.',
  'hint.candidate-correction.summary':
    'आगे बढ़ने से पहले, पंक्ति, स्तंभ और बॉक्स में भरे अंकों के आधार पर {cell} के उम्मीदवार फिर से तय करें।',
  'hint.strategy.summary':
    '{strategy} को समझने और लागू करने के लिए ये {steps} चरण पूरे करें।',
  'hint.value-correction.observe': '{cell} जाँचें। यह अंक बोर्ड से मेल नहीं खाता।',
  'hint.value-correction.conclude':
    '{cell} पर मान साफ़ करें ताकि उम्मीदवार ग्रिड की अगली जाँच की जा सके।',
  'hint.candidate-correction.observe':
    '{cell} जाँचें। इसके उम्मीदवार बोर्ड से मेल नहीं खाते।',
  'hint.candidate-correction.compare':
    'पंक्ति, स्तंभ और बॉक्स में भरे अंकों के आधार पर इस खाने के उम्मीदवार फिर से तय करें।',
  'hint.candidate-correction.conclude':
    '{cell} के उम्मीदवारों को उसकी पंक्ति, स्तंभ और बॉक्स में अनुमत सभी अंकों पर रीसेट करें।',
  'hint.coloring.pair':
    '{unit} में {digit} के लिए केवल {cells} ही संभावित खाने हैं और इनमें से ठीक एक में यह अंक आएगा। इन दोनों विपरीत संभावनाओं को A और B चिह्न दें।',
  'hint.coloring.chain':
    'हर ठोस लिंक के साथ आगे बढ़ें। ऐसा लिंक किसी पंक्ति, स्तंभ या बॉक्स में {digit} के केवल दो संभावित खानों को जोड़ता है, इसलिए पूरी शृंखला में चिह्न बारी-बारी से लगेंगे: {group_a} पर A और {group_b} पर B।',
  'hint.coloring.alternatives':
    'या तो A चिह्न वाले सभी खानों में {digit} होगा और B चिह्न वाले किसी खाने में नहीं, या ठीक इसका उलटा होगा। यह तय किए बिना भी अंक हटाया जा सकता है कि इनमें से कौन-सी स्थिति सही है।',
  'hint.coloring.elimination':
    '{cell}, A चिह्न वाले {group_a_cell} और B चिह्न वाले {group_b_cell} में से हर एक के साथ अलग-अलग कोई पंक्ति, स्तंभ या बॉक्स साझा करता है। दोनों रंग-समूहों में से किसी एक में {digit} अवश्य होगा, इसलिए इस खाने में वह अंक नहीं आ सकता।',
  'hint.coloring.apply':
    '{candidates} हटाएँ। हर लक्षित खाना A चिह्न वाले कम से कम एक खाने और B चिह्न वाले कम से कम एक खाने—दोनों के साथ अलग-अलग कोई पंक्ति, स्तंभ या बॉक्स साझा करता है। इसलिए सही रंग कोई भी हो, {colored_digit} वहाँ नहीं रह सकता। यह पैटर्न {strategy} कहलाता है।',
  'hint.coloring.place':
    '{colored_digit} के लिए लिंक किए गए उम्मीदवार परिणाम को बाध्य करते हैं। {digit} को {cell} में रखें। यह पैटर्न {strategy} है।',
  'hint.x-cycle.opening':
    '{unit} में {digit} के लिए केवल {cells} ही संभावित खाने हैं। इन दोनों में से एक में यह अंक अवश्य आएगा।',
  'hint.x-cycle.assume':
    'मान लें कि {start} में {digit} नहीं है। तब {forced} में {digit} होना ही होगा। इससे {blocked} में {digit} नहीं आ सकता और {unit} में {result} ही {digit} का तय स्थान बचता है।',
  'hint.x-cycle.follow':
    '{true_cell} में {digit} होने के कारण {blocked} में {digit} नहीं आ सकता। इसलिए {unit} में {result} पर {digit} आना ही होगा।',
  'hint.x-cycle.close':
    '{true_cell} में {digit} होने के कारण {blocked} में {digit} नहीं आ सकता। अब {unit} में {result} ही {digit} के लिए एकमात्र स्थान बचता है।',
  'hint.x-cycle.place':
    'यदि {assumption} में {digit} न होने की धारणा मानें, तो यही शृंखला अंत में बताती है कि {cell} में {digit} होना चाहिए। यह धारणा अपने ही निष्कर्ष से गलत सिद्ध होती है, इसलिए {cell} में {digit} भरें। इस पैटर्न को {strategy} कहते हैं।',
  'hint.xy-chain.start':
    '{cell} में केवल {first_digit} और {second_digit} उम्मीदवार हैं। यह या तो {endpoint_digit} होगा; यदि {endpoint_digit} नहीं है, तो इसे {other_digit} होना ही होगा।',
  'hint.xy-chain.assume':
    'मान लें कि {start} में {endpoint_digit} नहीं है; तब वहाँ {start_value} होना होगा। {start} और {middle} एक ही {first_unit} में हैं, इसलिए {middle} में {start_value} नहीं आ सकता और वहाँ {middle_value} आएगा। इसके कारण {second_unit} में {result} से {middle_value} हट जाता है और वहाँ {result_value} होना आवश्यक हो जाता है।',
  'hint.xy-chain.follow':
    '{start} में {start_value} होने पर उसी {first_unit} के {middle} में {start_value} नहीं आ सकता, इसलिए वहाँ {middle_value} होगा। अब {middle} और {result} एक ही {second_unit} में हैं; इस कारण {result} में {middle_value} नहीं आ सकता और वहाँ {result_value} होना होगा।',
  'hint.xy-chain.reach':
    '{start} में {start_value} होने के कारण {endpoint} में {shared_digit} नहीं आ सकता। वहाँ बचा दूसरा उम्मीदवार {endpoint_digit} है, इसलिए {endpoint_digit} ही आएगा।',
  'hint.xy-chain.place':
    'यदि {first_endpoint} में {endpoint_digit} है, तो यह अंक पहले छोर पर मौजूद है। यदि वहाँ {endpoint_digit} नहीं है, तो शृंखला दूसरे छोर {second_endpoint} में {endpoint_digit} को अनिवार्य कर देती है। इसलिए कम से कम एक छोर पर {endpoint_digit} अवश्य मौजूद है। {cell}, दोनों छोरों में से हर एक के साथ अलग-अलग कोई पंक्ति, स्तंभ या बॉक्स साझा करता है, इसलिए वहाँ {endpoint_digit} नहीं आ सकता। {cell} में {digit} भरें। यह पैटर्न {strategy} कहलाता है।',
  'hint.argument.digit': '{digit}',
  'hint.naked-single.constraints':
    '{cell} से शुरू करें। इसकी पंक्ति, स्तंभ और बॉक्स में {excluded_digits} पहले से मौजूद हैं।',
  'hint.naked-single.only': 'इसलिए {cell} में केवल {digit} ही रखा जा सकता है।',
  'hint.naked-single.apply':
    '{cell} में {digit} रखें। जिस खाने में केवल एक उम्मीदवार बचता है, वह स्थिति {strategy} कहलाती है।',
  'hint.hidden-single.inspect': '{unit} में देखें कि {digit} कहाँ रखा जा सकता है।',
  'hint.hidden-single.blockers':
    '{blockers} में पहले से मौजूद {digit} के कारण {unit} के बाकी सभी खाली खानों में {digit} नहीं आ सकता।',
  'hint.hidden-single.only': 'अब केवल {cell} में ही {digit} हो सकता है।',
  'hint.hidden-single.apply':
    '{cell} में {digit} रखें। जब किसी अंक के लिए पंक्ति, स्तंभ या बॉक्स में केवल एक संभावित खाना बचता है, तो उसे {strategy} कहते हैं।',
  'hint.naked-pair.inspect':
    '{unit} में पहले {cell} को देखें। इस खाने में केवल {first_digit} या {second_digit} आ सकता है।',
  'hint.naked-pair.match':
    '{cell} में भी यही दो उम्मीदवार हैं: {first_digit} और {second_digit}।',
  'hint.naked-pair.reserve':
    'इन दोनों खानों में {digits} किसी भी क्रम में आएँगे। इसलिए {unit} के हर दूसरे खाने से उम्मीदवार {digit} हटाया जा सकता है।',
  'hint.naked-pair.apply':
    '{candidates} हटाएँ। इस चरण में कोई अंक नहीं भरा जाता। यह पैटर्न {strategy} है।',
  'hint.naked-triple.first':
    '{unit} से शुरू करें: {cell} में केवल {first_digit} या {second_digit} आ सकता है।',
  'hint.naked-triple.second':
    'पहले खाने के साथ {cell} पर भी विचार करें; इसमें केवल {first_digit} या {second_digit} आ सकता है।',
  'hint.naked-triple.third':
    'अब बाकी दो खानों के साथ {cell} को भी इस समूह में शामिल करें; इसमें केवल {first_digit} या {second_digit} आ सकता है। इस तरह इन तीनों खानों में केवल {reserved_digits} आ सकते हैं।',
  'hint.naked-triple.consequence':
    'इन तीनों खानों में किसी क्रम में {reserved_digits} ही आएँगे। इसलिए {cell} से {removed_digits} हटते हैं और केवल {remaining_digit} बचता है।',
  'hint.naked-triple.apply':
    '{cell} में {digit} भरें। जिन तीन खानों के उम्मीदवार उन्हीं तीन अंकों तक सीमित हों, वे {strategy} बनाते हैं।',
  'hint.naked-quad.cell': '{unit} में {cell} के संभावित अंक केवल {digits} हैं।',
  'hint.subset-reservation.observe':
    '{unit} में {cells} में केवल {digits} हो सकते हैं।',
  'hint.subset-reservation.explain':
    'इन खानों में मिलकर {digits} ही आएँगे। इसलिए {unit} के हर दूसरे खाने से ये अंक हटाए जा सकते हैं।',
  'hint.subset-reservation.apply': '{candidates} हटाएँ। यह पैटर्न {strategy} है।',
  'hint.subset-reservation.place': '{cell} में {digit} भरें। यह पैटर्न {strategy} है।',
  'hint.hidden-subset-confinement.observe':
    '{unit} में {digits} केवल {cells} में आ सकते हैं।',
  'hint.hidden-subset-confinement.explain':
    'क्योंकि {digits}, {unit} की इन्हीं कोशिकाओं तक सीमित हैं, इन कोशिकाओं में कोई अन्य उम्मीदवार नहीं हो सकता।',
  'hint.hidden-subset-confinement.apply':
    'सीमित कोशिकाओं से {candidates} हटाएँ। यह पैटर्न {strategy} है।',
  'hint.hidden-subset-confinement.place':
    'अन्य उम्मीदवार हटाने के बाद {cell} में {digit} रखें। यह पैटर्न {strategy} है।',
  'hint.hidden-pair.first':
    '{unit} में {digit} के लिए केवल {cells} ही संभावित खाने हैं।',
  'hint.hidden-pair.second':
    '{digit} के लिए भी यही दो खाने संभावित हैं। इसलिए {digits} किसी भी क्रम में {cells} में ही आएँगे।',
  'hint.hidden-pair.consequence':
    'ये दोनों खाने {digits} के लिए तय हैं, इसलिए इनमें मौजूद अन्य उम्मीदवार हटाए जा सकते हैं: {candidates}।',
  'hint.hidden-pair.apply': '{candidates} हटाएँ। इस पैटर्न को {strategy} कहते हैं।',
  'hint.hidden-triple.first':
    '{unit} में {digit} के लिए केवल {cells} ही संभावित खाने हैं।',
  'hint.hidden-triple.second':
    '{unit} में {digits} के लिए केवल {cells} ही संभावित खाने हैं।',
  'hint.hidden-triple.third': '{unit} में {digits} भी केवल {cells} में ही आ सकते हैं।',
  'hint.hidden-triple.consequence':
    '{unit} में {digits} इन्हीं खानों तक सीमित हैं, इसलिए इन खानों में कोई अन्य उम्मीदवार नहीं रह सकता।',
  'hint.hidden-triple.apply':
    'इन तय खानों से {candidates} हटाएँ। इस पैटर्न को {strategy} कहते हैं।',
  'hint.hidden-quad.first':
    '{unit} में {digit} के लिए केवल {cells} ही संभावित खाने हैं।',
  'hint.hidden-quad.second':
    '{unit} में {digits} के लिए केवल {cells} ही संभावित खाने हैं।',
  'hint.hidden-quad.third': '{unit} में {digits} भी केवल {cells} में ही आ सकते हैं।',
  'hint.hidden-quad.fourth':
    '{unit} में {digits} के संभावित स्थान भी केवल {cells} हैं।',
  'hint.hidden-quad.consequence':
    '{unit} में {digits} इन्हीं खानों तक सीमित हैं, इसलिए इन खानों में कोई अन्य उम्मीदवार नहीं रह सकता।',
  'hint.hidden-quad.apply':
    'इन तय खानों से {candidates} हटाएँ। इस पैटर्न को {strategy} कहते हैं।',
  'hint.pointing-pair.first':
    '{source_unit} में {cell} पर मौजूद उम्मीदवार {digit} से शुरू करें। अब देखें कि इसी बॉक्स में {digit} और कहाँ आ सकता है।',
  'hint.pointing-pair.second':
    '{source_unit} में {digit} के लिए केवल एक और संभावित खाना {cell} है। ये दोनों खाने {intersection_unit} में पड़ते हैं।',
  'hint.pointing-pair.consequence':
    '{source_unit} में {digit} इन्हीं दो खानों में से किसी एक में आएगा, और दोनों खाने {intersection_unit} में हैं। इसलिए {intersection_unit} के बाकी खानों से {candidate} हटाएँ।',
  'hint.pointing-pair.apply':
    '{cell} में अब केवल {digit} बचा है, इसलिए वहाँ {digit} भरें। यह पैटर्न {strategy} कहलाता है।',
  'hint.intersection-confinement.observe':
    '{source_unit} में, उम्मीदवार {digit} {cells} पर {intersection_unit} तक सीमित है।',
  'hint.intersection-confinement.explain':
    'क्योंकि {source_unit} में प्रत्येक {digit} {intersection_unit} में निहित है, स्रोत के बाहर लेकिन चौराहे के अंदर की कोशिकाएं इसे शामिल नहीं कर सकती हैं।',
  'hint.intersection-confinement.apply':
    '{cells} से उम्मीदवार {digit} को हटा दें। यह पैटर्न {strategy} है।',
  'hint.intersection-confinement.place':
    'चौराहा लगाने के बाद {digit} को {cell} में रखें। यह पैटर्न {strategy} है।',
  'hint.fish-confinement.observe':
    '{base_units} में उम्मीदवार {digit} के जितने भी संभावित खाने हैं, वे सभी {cover_units} के अंतर्गत आते हैं।',
  'hint.fish-confinement.explain':
    'उम्मीदवार {digit}, {base_units} से {cover_units} तक सीमित है, इसलिए इन कवर इकाइयों को हाइलाइट किए गए आधार स्थानों से यह अंक मिलना चाहिए।',
  'hint.swordfish.consequence':
    '{base_units} की हर इकाई में {cover_units} के भीतर कहीं न कहीं {digit} रखना होगा। इसलिए इसकी तीनों आवश्यक स्थितियाँ इन्हीं तीन प्रतिच्छेदी पंक्तियों या स्तंभों में होंगी और उनके बाकी खानों से {digit} हटाया जा सकता है।',
  'hint.jellyfish.consequence':
    '{base_units} की हर इकाई में {cover_units} के भीतर कहीं न कहीं {digit} रखना होगा। इसलिए इसकी चारों आवश्यक स्थितियाँ इन्हीं चार प्रतिच्छेदी पंक्तियों या स्तंभों में होंगी और उनके बाकी खानों से {digit} हटाया जा सकता है।',
  'hint.fish-confinement.apply':
    '{cells} से उम्मीदवार {digit} हटाएँ। यह पैटर्न {strategy} है।',
  'hint.x-wing.first':
    '{base_unit} में उम्मीदवार {digit} के सभी संभावित खाने {cover_units} के अंतर्गत आते हैं।',
  'hint.x-wing.second':
    '{base_unit} में भी उम्मीदवार {digit} के सभी संभावित खाने इन्हीं {cover_units} में पड़ते हैं। यानी दोनों चुनी गई पंक्तियों या स्तंभों में इसके संभावित खाने उन्हीं दो प्रतिच्छेदी स्तंभों या पंक्तियों तक सीमित हैं।',
  'hint.x-wing.consequence':
    '{base_units} की हर इकाई में {cover_units} के भीतर कहीं न कहीं {digit} रखना होगा। इसलिए इसकी दोनों आवश्यक स्थितियाँ इन्हीं दो प्रतिच्छेदी पंक्तियों या स्तंभों में होंगी और उनके बाकी खानों से {digit} हटाया जा सकता है।',
  'hint.x-wing.apply':
    '{cells} से उम्मीदवार {digit} हटाएँ। यह पैटर्न {strategy} कहलाता है।',
  'hint.pivot-wing.observe':
    '{pivot} पर, उम्मीदवार {pivot_digits} विंग कोशिकाओं को {wing_cells} पर जोड़ते हैं।',
  'hint.pivot-wing.explain':
    '{wing_cells} में प्रत्येक विंग {pivot} पर धुरी के साथ एक उम्मीदवार को साझा करता है, और दोनों विंग में {shared_digit} होता है। जो भी धुरी उम्मीदवार सत्य है, एक विंग में {shared_digit} शामिल होना चाहिए।',
  'hint.xy-wing.pivot':
    '{pivot} में केवल {digits} उम्मीदवार बचे हैं। इनमें से कोई एक अंक यहाँ अवश्य आएगा।',
  'hint.xy-wing.case':
    'यदि {pivot} में {pivot_digit} आता है, तो {wing} में {pivot_digit} नहीं आ सकता। वहाँ बचा एकमात्र दूसरा उम्मीदवार {shared_digit} है, इसलिए {wing} में {shared_digit} आएगा।',
  'hint.xy-wing.guarantee':
    '{pivot} में चाहे कोई भी उम्मीदवार आए, {wing_cells} के दो खानों में से कम से कम एक में {shared_digit} अवश्य होगा। यह जानना आवश्यक नहीं कि वह कौन-सा खाना है।',
  'hint.xy-wing.apply':
    '{cells}, दोनों विंग {wing_cells} को देखते हैं। कम से कम एक विंग {shared_digit} है, इसलिए इन खानों से उम्मीदवार {shared_digit} हटाएँ। इस पैटर्न को {strategy} कहते हैं।',
  'hint.xy-wing.place':
    '{cell}, {wing_cells} के दोनों खानों में से हर एक के साथ अलग-अलग कोई पंक्ति, स्तंभ या बॉक्स साझा करता है। इनमें से कम से कम एक खाने में {shared_digit} अवश्य होगा, इसलिए {cell} में {shared_digit} नहीं आ सकता। यहाँ बचा एकमात्र दूसरा उम्मीदवार {digit} है; उसे भरें। इस पैटर्न को {strategy} कहते हैं।',
  'hint.xyz-wing.pivot':
    '{pivot} में केवल {digits} उम्मीदवार बचे हैं। इनमें से कोई एक अंक यहाँ अवश्य आएगा।',
  'hint.xyz-wing.case':
    'यदि {pivot} में {pivot_digit} आता है, तो उसके साथ {unit} साझा करने वाले {wing} में {pivot_digit} नहीं आ सकता। {wing} में बचा दूसरा उम्मीदवार {shared_digit} है, इसलिए वहाँ {shared_digit} आएगा।',
  'hint.xyz-wing.pivot-case':
    'यदि {pivot} में {shared_digit} आता है, तो साझा अंक इसी खाने में मौजूद है।',
  'hint.xyz-wing.guarantee':
    '{pivot} में चाहे कोई भी उम्मीदवार आए, {pattern_cells} में से कम से कम एक खाने में {shared_digit} अवश्य होगा। यह जानना आवश्यक नहीं कि वह कौन-सा खाना है।',
  'hint.xyz-wing.apply':
    '{target} का खाना {first_pattern_cell} के साथ {first_unit}, {second_pattern_cell} के साथ {second_unit} और {third_pattern_cell} के साथ {third_unit} साझा करता है। इन तीनों खानों में से कम से कम एक में {shared_digit} अवश्य होगा, इसलिए लक्ष्य वाले खाने से यह उम्मीदवार हटाएँ। यह पैटर्न {strategy} कहलाता है।',
  'hint.strong-link-wing.observe':
    '{wing_cells} में दिए गए दोनों खानों में केवल {digits} उम्मीदवार हैं।',
  'hint.strong-link-wing.bridge':
    '{unit} में उम्मीदवार {link_digit} केवल {link_cells} में आ सकता है, इसलिए इन खानों में से कम से कम एक में {link_digit} अवश्य होगा।',
  'hint.strong-link-wing.force':
    'यदि {first_link_cell} में {link_digit} है, तो उससे संबंधित {first_wing_cell} में {link_digit} नहीं आ सकता और वहाँ {forced_digit} होना चाहिए। यदि {second_link_cell} में {link_digit} है, तो {second_wing_cell} में {forced_digit} होना चाहिए। इसलिए इन दोनों विंग खानों में से कम से कम एक में {forced_digit} अवश्य है।',
  'hint.strong-link-wing.apply':
    '{wing_cells} में से कम से कम एक में {digit} है। {cells} दोनों कोशिकाओं को देखती हैं, इसलिए वहाँ से उम्मीदवार {digit} हटाएँ। इस पैटर्न को {strategy} कहते हैं।',
  'hint.strong-link-wing.place':
    '{wing_cells} में से कम से कम एक खाने में {removed_digit} अवश्य होगा। {cell}, इन दोनों खानों में से हर एक के साथ अलग-अलग कोई पंक्ति, स्तंभ या बॉक्स साझा करता है, इसलिए उसमें {removed_digit} नहीं आ सकता। वहाँ बचा दूसरा उम्मीदवार {digit} रखें। यह पैटर्न {strategy} कहलाता है।',
  'hint.relational-wing.apply':
    '{cells} से उम्मीदवार {digit} को हटा दें। यह पैटर्न {strategy} है।',
  'hint.relational-wing.place':
    '{cell} से उम्मीदवार {removed_digit} को हटा दें, इसलिए वहां {digit} रखें। यह पैटर्न {strategy} है।',
  'hint.bug-plus-one.bivalue':
    '{cell} को छोड़कर बाकी {count} खाली खानों में ठीक दो-दो उम्मीदवार हैं।',
  'hint.bug-plus-one.trivalue':
    '{cell} में तीन उम्मीदवार हैं: {digits}। इस खाने में बाकी हर खाली खाने से एक उम्मीदवार अधिक है।',
  'hint.bug-plus-one.unit-count':
    '{unit} में उम्मीदवार {digit} के लिए तीन संभावित स्थान हैं, जबकि {other_digits} में से प्रत्येक के लिए केवल दो।',
  'hint.bug-plus-one.explain':
    '{units} में उम्मीदवार {digit} के लिए {other_digits} की तुलना में एक स्थान अधिक है। यदि {cell} में {digit} न हो, तो हर खाली खाने में ठीक दो उम्मीदवार रह जाएँगे और पहेली का समाधान अद्वितीय नहीं रहेगा। इसलिए {cell} में {digit} होना आवश्यक है।',
  'hint.bug-plus-one.place':
    '{cell} में {digit} रखें। अद्वितीय समाधान बनाए रखने वाला यह अतिरिक्त-उम्मीदवार पैटर्न {strategy} कहलाता है।',
  'hint.unique-rectangle.rectangle':
    '{cells} के चार खाली खाने एक आयत के चार कोनों पर हैं।',
  'hint.unique-rectangle.pair-corners': '{cells} में केवल {digits} उम्मीदवार हैं।',
  'hint.unique-rectangle.third-corner':
    '{cell} में भी ठीक {digits} ही उम्मीदवार हैं। अब तीन कोनों में उम्मीदवारों की एक ही जोड़ी है।',
  'hint.unique-rectangle.expanded-corner':
    '{cell} में {digits} उम्मीदवार हैं। अतिरिक्त उम्मीदवार {extra_digit} केवल इसी कोने में है।',
  'hint.unique-rectangle.protect-uniqueness':
    'यदि {cell} में {digits} की जोड़ी में से कोई अंक रखा जाए, तो चारों कोनों में उन दोनों अंकों की अदला-बदली करने पर भी पंक्ति, स्तंभ और बॉक्स की सभी शर्तें पूरी रहेंगी। इससे दो समाधान बनेंगे, इसलिए {digits} हटाकर {extra_digit} रखें।',
  'hint.unique-rectangle.type1-place':
    '{cell} में केवल {digit} बचा है। उसे वहीं भरें। यह पैटर्न {strategy} है।',
  'hint.unique-rectangle.observe':
    '{cells} की कोशिकाएँ एक आयत बनाती हैं और सभी में जोड़ी {digits} होती है।',
  'hint.unique-rectangle.type1':
    'तीन कोनों में बिल्कुल {digits} होता है। यदि {cell} भी किसी अंक का उपयोग करता है, तो आयत दो विनिमेय समाधानों की अनुमति देगा।',
  'hint.unique-rectangle.type2-first-expanded':
    '{cell} के उम्मीदवार {pair} और {extra_digit} हैं।',
  'hint.unique-rectangle.type2-shared-extra':
    '{cell} में भी {pair} के साथ {extra_digit} उम्मीदवार है। इस तरह अतिरिक्त उम्मीदवार वाले दोनों कोनों में वही अतिरिक्त उम्मीदवार {extra_digit} है।',
  'hint.unique-rectangle.type2-protect-uniqueness':
    'अदला-बदली से बनने वाले दो समाधानों को रोकने के लिए {cells} में से कम से कम एक में {extra_digit} आना आवश्यक है। {target}, इन दोनों खानों में से हर एक के साथ अलग-अलग कोई पंक्ति, स्तंभ या बॉक्स साझा करता है, इसलिए उसमें यह अंक नहीं आ सकता।',
  'hint.unique-rectangle.type2-place':
    '{cell} में केवल {digit} बचा है। उसे वहीं भरें। यह पैटर्न {strategy} है।',
  'hint.unique-rectangle.type2':
    '{cells} पर दो विस्तारित कोने अतिरिक्त उम्मीदवार {digit} साझा करते हैं, इसलिए कोई भी सेल जो दोनों कोनों को देखता है उसमें {digit} नहीं हो सकता है।',
  'hint.unique-rectangle.type3':
    'आयत में अतिरिक्त अंक {digits}, {unit} में आरक्षित उपसमुच्चय के रूप में {cells} के साथ संयोजित होते हैं, इसलिए उन अंकों को उस इकाई में कहीं और हटाया जा सकता है।',
  'hint.unique-rectangle.type3-first-expanded':
    '{cell} में {pair} के साथ अतिरिक्त उम्मीदवार {extra_digit} भी है।',
  'hint.unique-rectangle.type3-second-expanded':
    '{cell} में भी {pair} के साथ अतिरिक्त उम्मीदवार {extra_digit} है। इन दोनों कोनों में से कम से कम एक पर अतिरिक्त अंक आना आवश्यक है, वरना चारों कोनों में {pair} की अदला-बदली से दो समाधान बनेंगे।',
  'hint.unique-rectangle.type3-partner': '{cell} में केवल {digits} उम्मीदवार हैं।',
  'hint.unique-rectangle.type3-reserve':
    '{corners} में से एक खाने में {digits} का एक अंक और {partner} में दूसरा अंक आएगा। ये दोनों अंक {unit} में इन्हीं स्थानों के लिए तय हैं, इसलिए {target} से {removed_digit} हटाया जा सकता है।',
  'hint.unique-rectangle.type3-place':
    '{cell} में केवल {digit} बचा है। उसे वहीं भरें। यह पैटर्न {strategy} है।',
  'hint.unique-rectangle.type4-first-expanded':
    '{cell} में {pair} के साथ अतिरिक्त उम्मीदवार {extra_digit} भी है।',
  'hint.unique-rectangle.type4-second-expanded':
    '{cell} में भी {pair} के साथ अतिरिक्त उम्मीदवार {extra_digit} है। अब अतिरिक्त उम्मीदवार वाले दोनों कोनों में आयत की जोड़ी मौजूद है।',
  'hint.unique-rectangle.type4':
    '{unit} में {digit} के लिए केवल {cells} ही दो संभावित खाने हैं। इसलिए अतिरिक्त उम्मीदवार वाले इन दोनों कोनों में से किसी एक में {removed_digit} रखने पर अंकों की अदला-बदली से दो समाधान बनेंगे।',
  'hint.unique-rectangle.type4-apply':
    '{cells} से उम्मीदवार {digit} हटाएँ। अद्वितीय समाधान पर आधारित यह संबंध {strategy} कहलाता है।',
  'hint.unique-rectangle.apply':
    '{candidates} निकालें. यह विशिष्टता संबंध {strategy} है।',
  'hint.unique-rectangle.place':
    'विशिष्टता संबंध लागू करने के बाद {digit} को {cell} में रखें। यह पैटर्न {strategy} है।',
  'hint.implication-chain.observe':
    '{cell} से शुरू करें, जिसमें केवल {digits} उम्मीदवार हैं।',
  'hint.implication-chain.explain':
    '{from} और {to} में एक साझा उम्मीदवार है और वे एक-दूसरे को देखते हैं, इसलिए वह उम्मीदवार दोनों में सही नहीं हो सकता; निहितार्थ आगे बढ़ता है।',
  'hint.implication-chain.apply':
    'किसी एक अंतिम बिंदु में {digit} होना चाहिए, इसलिए {cells} से उम्मीदवार {digit} हटाएँ। यह पैटर्न {strategy} है।',
  'hint.narration.apply': 'कटौती लागू करें: ',
  'hint.narration.look-at': 'देखो ',
  'hint.narration.value-conflict':
    '. इसका दर्ज किया गया मूल्य पहेली के साथ संघर्ष करता है।',
  'hint.narration.clear-value': 'पर मान साफ़ करें ',
  'hint.narration.clear-value-tail': ' ताकि उम्मीदवार ग्रिड को आगे जांचा जा सके।',
  'hint.narration.candidate-inconsistent':
    '. इसका उम्मीदवार राज्य पहेली से असंगत है।',
  'hint.narration.reset-candidates': 'उम्मीदवार सेट को रीसेट करें ',
  'hint.narration.reset-candidates-tail':
    ' स्वीकृत पंक्ति, स्तंभ और बॉक्स मानों द्वारा अनुमत प्रत्येक अंक तक।',
  'hint.narration.only-candidate': '. इसका केवल एक ही उम्मीदवार है: ',
  'hint.narration.no-other-digit': 'क्योंकि कोई दूसरा अंक अंदर नहीं जा सकता ',
  'hint.narration.place': ', जगह ',
  'hint.narration.naked-single-tail': ' वहाँ. इसे नेकेड सिंगल कहा जाता है.',
  'hint.narration.in-unit': 'में ',
  'hint.narration.consider-digit': ', कहाँ पर विचार करें ',
  'hint.narration.can-appear': ' प्रकट हो सकता है.',
  'hint.narration.other-cells': 'हर दूसरी खाली कोशिका ',
  'hint.narration.cannot-contain': ' शामिल नहीं हो सकता ',
  'hint.narration.leaving-only': ', केवल छोड़कर ',
  'hint.narration.because-unit': 'क्योंकि ',
  'hint.narration.still-needs': ' अभी भी जरूरत है ',
  'hint.narration.only-cell': ' और ',
  'hint.narration.hidden-single-tail': ' एकमात्र संभावित सेल, स्थान है ',
  'hint.narration.hidden-single-name': ' वहाँ. इसे हिडन सिंगल कहा जाता है.',
  'hint.narration.place-result': 'जगह ',
  'hint.narration.in': ' में ',
  'hint.narration.remove': 'उम्मीदवार हटाओ ',
  'hint.narration.from': ' से ',
  'hint.narration.strategy-result': '. यह {strategy} परिणाम है.',
  'welcome.title': 'अपनी कठिनाई चुनें',
  'welcome.difficulty': 'कठिनाई',
  'welcome.start': '{difficulty} पहेली प्रारंभ करें',
  'welcome.starting': '{difficulty} पहेली शुरू हो रही है…',
  'welcome.preview': 'सुडोकू पहेली पूर्वावलोकन',
  'loading.initial': 'आपकी पहेली लोड हो रही है...',
  'loading.account.title': 'आपकी पहेली आपके खाते में सहेजी जा रही है...',
  'loading.account.detail':
    'खाते में सेव होने की पुष्टि तक आपकी प्रगति इस डिवाइस पर बनी रहती है।',
  'loading.home.title': 'पहले पन्ने पर लौट रहा हूँ...',
  'loading.home.detail': 'स्तर चयन दिखाने से पहले नवीनतम इंटरफ़ेस की जाँच कर रहा है।',
  'loading.restart.title': 'इस पहेली को पुनः प्रारंभ कर रहा हूँ...',
  'loading.restart.detail': 'नया प्रयास तैयार होने तक पुराने बोर्ड को बंद रखें।',
  'loading.new.title': 'आपका {difficulty} बोर्ड तैयार किया जा रहा है...',
  'confirmation.home.title': 'ये पहेली छोड़ो',
  'confirmation.home.description':
    'आपकी वर्तमान प्रगति अब इस डिवाइस पर स्वचालित रूप से नहीं खुलेगी।',
  'confirmation.home.cancel': 'खेलते रहो',
  'confirmation.home.confirm': 'पहले पन्ने पर लौटें',
  'confirmation.restart.title': 'फिर से शुरू करें',
  'confirmation.restart.replay.title': 'इस पहेली को दोबारा खेलें',
  'confirmation.restart.replay.description':
    'इन दिए गए बिंदुओं को रखें और इस प्रयास को रीसेट करें।',
  'confirmation.restart.different.title': 'एक अलग पहेली खेलें',
  'confirmation.restart.different.description': 'नए बोर्ड के लिए एक स्तर चुनें.',
  'confirmation.restart.different.level': 'विभिन्न पहेली के लिए स्तर',
  'common.cancel': 'रद्द करें',
  'account.confirm.deleteGame.title': 'इस गेम को हटाएं',
  'account.confirm.deleteGame.description':
    'यह पहेली और इसकी प्रगति माई गेम्स से स्थायी रूप से हटा दी जाएगी। इसे असंपादित नहीं किया जा सकता है।',
  'account.confirm.deleteGame.action': 'गेम हटाएं',
  'account.confirm.deleteGame.pending': 'सहेजा गया गेम हटाया जा रहा है...',
  'account.confirm.deleteAll.title': 'सभी गेम हटाएं',
  'account.confirm.deleteAll.description':
    'माई गेम्स की प्रत्येक पहेली और सभी प्रगति स्थायी रूप से हटा दी जाएगी। इसे असंपादित नहीं किया जा सकता है।',
  'account.confirm.deleteAll.action': 'सभी गेम हटाएं',
  'account.confirm.deleteAll.pending': 'सभी गेम हटाये जा रहे हैं...',
  'account.confirm.revoke.title': 'सभी डिवाइस से साइन आउट करें',
  'account.confirm.revoke.description':
    'यह आपको इस डिवाइस समेत सभी डिवाइस से साइन आउट कर देगा। आपका खाता और सेव किए गए गेम बने रहेंगे।',
  'account.confirm.revoke.action': 'सभी डिवाइस से साइन आउट करें',
  'account.confirm.revoke.pending': 'सभी डिवाइस से साइन आउट किया जा रहा है…',
  'account.confirm.deleteAccount.title': 'अपना खाता हटाएं',
  'account.confirm.deleteAccount.description':
    'आपकी पहचान, प्रत्येक साइन-इन सत्र और सभी सहेजे गए गेम स्थायी रूप से हटा दिए जाएंगे। साझा पहेली सूची अप्रभावित है.',
  'account.confirm.deleteAccount.action': 'खाता हटाएँ',
  'account.confirm.deleteAccount.pending': 'खाता हटाया जा रहा है...',
  'account.confirm.typeEmail': 'पुष्टि करने के लिए {email} टाइप करें',
  'account.label': 'खाता',
  'account.continue.title': 'अन्य डिवाइस पर जारी रखें',
  'account.continue.detail':
    'इस ब्राउज़र के सक्रिय गेम को स्वचालित रूप से सहेजने के लिए साइन इन करें।',
  'account.signIn': 'Google से साइन इन करें',
  'account.signIn.short': 'साइन इन करें',
  'game.title': '{difficulty} पहेली',
  'game.statusActions': 'खेल की स्थिति और क्रियाएँ',
  'game.elapsed': 'बीता हुआ समय',
  'game.mistakes': 'गलतियाँ {count}',
  'game.resume': 'बायोडाटा',
  'game.pause': 'विराम',
  'status.resumed': 'पहेली फिर शुरू हुई.',
  'status.paused': 'पहेली रुकी.',
  'status.restarted': 'पहेली फिर से शुरू हुई. ताज़ा प्रयास, वही पहेली।',
  'status.hintClosed': 'संकेत बंद. आपकी पहेली अपरिवर्तित है.',
  'status.strategyApplied': 'रणनीति लागू की गई. आप इसे एक चरण में पूर्ववत कर सकते हैं.',
  'status.correctionApplied':
    'सुधार लागू किया गया. आप इसे एक चरण में पूर्ववत कर सकते हैं.',
  'status.hintAlreadyApplied': 'यह संकेत पहले से ही बोर्ड पर परिलक्षित होता है।',
  'status.hintRefreshed': 'बोर्ड बदल गया, इसलिए संकेत अपडेट किया गया।',
  'status.accountSaved': 'गेम आपके खाते में सहेजा गया.',
  'status.waitBeforeLeaving': 'इस पहेली को छोड़ने से पहले लंबित चालों की प्रतीक्षा करें।',
  'status.selectEditableCell':
    'कोई संख्या दर्ज करने से पहले एक संपादन योग्य सेल का चयन करें।',
  'status.savingAccount': 'आपका स्थानीय गेम आपके खाते में सहेजा जा रहा है…',
  'status.restoring': 'आपकी पहेली पुनर्स्थापित की जा रही है...',
  'status.restored': 'आपकी स्थानीय पहेली पुनर्स्थापित कर दी गई.',
  'status.puzzleReady': '{difficulty} पहेली तैयार।',
  'status.puzzleRestored': '{difficulty} पहेली पुनर्स्थापित की गई।',
  'status.waitBeforeStarting':
    'दूसरी पहेली शुरू करने से पहले लंबित चालों की प्रतीक्षा करें।',
  'status.solved': 'हल हो गया! बहुत बढ़िया।',
  'status.moveSaved': 'ले जाएँ सहेजा गया.',
  'status.waitBeforeHint': 'संकेत खोलने से पहले लंबित चालों की प्रतीक्षा करें।',
  'status.hintReady': 'संकेत तैयार. चरण 1 से प्रारंभ करें.',
  'status.openingSaved': 'आपका सहेजा गया गेम खोला जा रहा है...',
  'status.savedDeleted': 'सहेजा गया गेम हटा दिया गया.',
  'status.allDeleted': 'सभी सहेजे गए गेम हटा दिए गए.',
  'status.signedOut': 'साइन आउट कर दिया गया. आपके खाते के गेम सहेजे रहते हैं.',
  'status.revoked':
    'सभी डिवाइस से साइन आउट हो गया। जारी रखने के लिए फिर से साइन इन करें।',
  'status.accountDeleted': 'खाता और सहेजे गए गेम हटा दिए गए.',
  'retry.saving': 'पुनः सहेजने का प्रयास करें',
  'retry.restoring': 'पुनः पुनर्स्थापित करने का प्रयास करें',
  'retry.connection': 'कनेक्शन की जाँच करें',
  'retry.starting': 'पुनः प्रारंभ करने का प्रयास करें',
  'retry.move': 'पुनः प्रयास करें',
  'retry.hint': 'फिर से संकेत देने का प्रयास करें',
  'retry.time': 'समय बचाने का पुनः प्रयास करें',
  'retry.progress': 'प्रगति को सहेजने का पुनः प्रयास करें',
  'retry.leaving': 'पुनः छोड़ने का प्रयास करें',
  'retry.opening': 'पुनः खोलने का प्रयास करें',
  'retry.deleting': 'पुनः हटाने का प्रयास करें',
  'retry.signOut': 'पुनः साइन आउट करने का प्रयास करें',
  'retry.revoke': 'सभी डिवाइस से साइन आउट करने की फिर कोशिश करें',
  'retry.deleteAccount': 'खाता पुनः हटाने का प्रयास करें',
  'error.accountSave':
    'आपका स्थानीय गेम सुरक्षित है, लेकिन इसे आपके खाते में सहेजा नहीं जा सका.',
  'error.restoring': 'आपकी पहेली पुनर्स्थापित नहीं की जा सकी.',
  'error.connection':
    'गेम सेवा तक नहीं पहुंचा जा सका. अपना कनेक्शन जांचें और पुनः प्रयास करें।',
  'error.http': 'गेम सेवा ने त्रुटि {status} लौटाई। कृपया पुन: प्रयास करें।',
  'error.unavailable':
    'गेम सेवा अस्थायी रूप से अनुपलब्ध है. आपका बोर्ड सुरक्षित है; पुनः प्रयास करें।',
  'error.starting': 'खेल प्रारंभ नहीं हो सका.',
  'error.signInAgain': 'चालें सहेजने के लिए फिर से साइन इन करें।',
  'error.localUnavailable': 'स्थानीय खेल अनुपलब्ध है.',
  'error.move': 'इस कदम को सहेजा नहीं जा सका.',
  'error.currentUnavailable': 'वर्तमान गेम अनुपलब्ध है.',
  'error.hintChanged': 'संकेत तैयार करते समय बोर्ड बदल गया।',
  'error.hint': 'इशारा तैयार नहीं हो सका.',
  'error.time': 'नवीनतम गेम का समय सहेजा नहीं जा सका.',
  'error.timer': 'नवीनतम टाइमर स्थिति सहेजी नहीं जा सकी.',
  'error.leaving': 'स्थानीय पहेली सुलझ नहीं सकी.',
  'error.opening': 'वह सहेजा गया गेम खोला नहीं जा सका.',
  'error.deleteGame': 'सहेजा गया गेम हटाया नहीं जा सका.',
  'error.deleteAll': 'सहेजे गए गेम को हटाया नहीं जा सका.',
  'error.signOut': 'आपको साइन आउट नहीं किया जा सका.',
  'error.revoke': 'सत्र निरस्त नहीं किये जा सके.',
  'error.deleteAccount': 'खाता हटाया नहीं जा सका.',
  'error.invalid-request': 'अनुरोध अमान्य है.',
  'error.invalid-json': 'अनुरोध में अमान्य JSON शामिल है.',
  'error.unsupported-media-type': 'अनुरोध सामग्री-प्रकार समर्थित नहीं है.',
  'error.payload-too-large': 'अनुरोध बहुत बड़ा है.',
  'error.unauthorized': 'प्राधिकरण आवश्यक है.',
  'error.forbidden-origin': 'इस अनुरोध की उत्पत्ति की अनुमति नहीं है.',
  'error.session-not-found': 'खेल सत्र नहीं मिला.',
  'error.revision-conflict': 'यह चाल लागू होने से पहले बोर्ड बदल गया।',
  'error.invalid-session': 'खेल सत्र अमान्य है.',
  'error.invalid-action': 'यह गेम क्रिया अमान्य है.',
  'error.invalid-cell': 'यह सेल अमान्य है.',
  'error.immutable-cell': 'किसी दिए गए सेल को बदला नहीं जा सकता.',
  'error.note-not-allowed': 'इस कक्ष में अभ्यर्थी नहीं बदले जा सकेंगे।',
  'error.no-undo': 'पूर्ववत करने के लिए कोई कार्रवाई नहीं है.',
  'error.no-redo': 'दोबारा करने के लिए कोई कार्रवाई नहीं है.',
  'error.no-hint': 'कोई संकेत उपलब्ध नहीं है.',
  'error.stale-hint': 'यह संकेत तैयार होने के बाद बोर्ड बदल गया।',
  'error.persistence-failed': 'खेल को बचाया नहीं जा सका.',
  'error.internal-error': 'अनुरोध पूरा नहीं किया जा सका.',
  'error.account-unavailable': 'खाता सुविधाएँ अनुपलब्ध हैं.',
  'error.account-unauthorized': 'एक वैध आवेदन सत्र आवश्यक है.',
  'error.csrf-failed': 'इस साइन-इन की पुष्टि नहीं हो सकी। कृपया फिर से साइन इन करें।',
  'error.account-game-not-found': 'सहेजा गया गेम नहीं मिला.',
  'error.guest-revision-conflict':
    'इस क्रिया के लागू होने से पहले स्थानीय खेल बदल गया।',
  'error.guest-claim-conflict': 'यह स्थानीय गेम पहले से ही एक खाते में सहेजा गया था।',
  'error.malformedDescriptor': 'स्पष्टीकरण प्रदर्शित नहीं किया जा सका.',
  'account.close': 'खाता पैनल बंद करें',
  'account.games.title': 'मेरे खेल',
  'account.games.deleteAll': 'सभी हटाएं',
  'account.games.deletingAll': 'सभी को हटाया जा रहा है...',
  'account.games.empty': 'अभी तक कोई सहेजा गया गेम नहीं.',
  'account.games.puzzle': '{difficulty} पहेली',
  'account.games.finished': 'समाप्त',
  'account.games.inProgress': 'प्रगति पर है',
  'account.games.saved': 'खेल सहेजा गया',
  'account.games.open': 'खुला',
  'account.games.opening': 'खुल रहा है...',
  'account.games.delete': 'हटाएँ',
  'account.games.deleting': 'हटाया जा रहा है...',
  'account.signOut': 'साइन आउट करें',
  'account.signingOut': 'साइन आउट हो रहा है...',
  'account.settings': 'खाता सेटिंग',
  'account.revoke': 'सभी डिवाइस से साइन आउट करें',
  'account.delete': 'खाता हटाएँ',
  'board.label': 'सुडोकू गेम बोर्ड',
  'board.cell.given': '{value} दिया गया',
  'board.cell.value': '{value}',
  'board.cell.candidates': 'खाली, उम्मीदवार {candidates}',
  'board.cell.empty': 'खाली',
  'board.hint.focus': 'संकेत फोकस',
  'board.hint.premise': 'संकेत साक्ष्य',
  'board.hint.eliminated': 'उम्मीदवार हटा दिया गया',
  'board.hint.conclusion': 'संकेत निष्कर्ष',
  'board.hint.problem': 'सुधार की आवश्यकता है',
  'board.hint.extra': 'असंभव उम्मीदवार',
  'board.hint.group': 'समूह {group}',
  'board.hint.chain': 'चेन स्थिति {position}',
  'board.paused.title': 'पहेली रुकी',
  'board.paused.detail': 'आपका समय रुक गया है.',
  'hint.label': 'संकेत',
  'hint.close': 'बंद करें',
  'hint.strategy.grade': '{grade} रणनीति',
  'hint.applying': 'संकेत लागू किया जा रहा है...',
  'hint.refreshing': 'ताज़ा संकेत...',
  'hint.step': '{total} का चरण {current}',
  'hint.legend.label': 'दृश्य संकेत कथा',
  'hint.legend.strong': 'ठोस: अवश्य होना चाहिए',
  'hint.legend.weak': 'धराशायी: दोनों नहीं कर सकते',
  'hint.legend.implication': 'तीर: निहितार्थ',
  'hint.legend.groups': 'ए/बी: वैकल्पिक समूह',
  'hint.legend.order': 'संख्याएँ: श्रृंखला क्रम',
  'hint.back': 'वापस',
  'hint.next': 'अगला',
  'hint.apply': 'संकेत लागू करें',
  'controls.label': 'खेल नियंत्रण',
  'controls.digit.note': 'नोट {digit} जोड़ें या हटाएँ',
  'controls.digit.enter': '{digit} दर्ज करें',
  'controls.hint.preparing': 'संकेत तैयार किया जा रहा है...',
  'controls.complete.title': '{time} में हल किया गया',
  'controls.complete.another': 'एक और {difficulty} चलायें',
  'controls.complete.replay': 'इस पहेली को दोबारा खेलें',
  'controls.complete.choose': 'दूसरा स्तर चुनें',
  'controls.pad': 'नंबर पैड',
  'controls.pad.notes': 'नंबर पैड, नोट्स मोड',
  'controls.modes': 'इनपुट मोड',
  'controls.notes.on': 'पर नोट्स',
  'controls.notes.off': 'नोट बंद',
  'controls.candidates.on': 'उम्मीदवार चालू',
  'controls.candidates.off': 'अभ्यर्थी बाहर',
  'controls.actions': 'पहेली क्रियाएँ',
  'controls.erase': 'मिटाओ',
  'controls.undo': 'पूर्ववत करें',
  'controls.undoing': 'पूर्ववत किया जा रहा है...',
  'controls.redo': 'पुनः करें',
  'controls.redoing': 'पुनः कर रहा हूँ...',
  'controls.hint.reveal': 'एक संकेत प्रकट करें',
  'controls.shortcuts': 'कीबोर्ड शॉर्टकट',
  'controls.shortcuts.move': 'हटो',
  'controls.shortcuts.arrows': 'तीर कुंजियाँ',
  'controls.shortcuts.enter': 'एक नंबर दर्ज करें',
  'controls.shortcuts.notes': 'नोट्स/उम्मीदवार',
  'controls.shortcuts.or': 'या',
  'controls.shortcuts.pause': 'रोकें या फिर से शुरू करें',
  'controls.shortcuts.hint': 'खोलें, आगे बढ़ें, या संकेत लागू करें',
  'controls.shortcuts.hintOther': 'अन्य संकेत नियंत्रण',
  'hint.target.candidate.visible': 'इस पर प्रकाश डाला गया उम्मीदवार',
  'hint.target.candidate.accessible':
    'उम्मीदवार {value} पंक्ति {row}, कॉलम {column} पर',
  'hint.target.cell.visible': 'यह हाइलाइट किया गया सेल',
  'hint.target.cell.accessible': 'पंक्ति {row}, स्तंभ {column}',
  'hint.target.unit.visible': 'इसने {kind} पर प्रकाश डाला',
  'hint.target.unit.locator': '{kind} {index}',
  'hint.target.unit.accessible': '{kind} {index}',
  'hint.target.row': 'पंक्ति',
  'hint.target.column': 'स्तंभ',
  'hint.target.box': 'बक्सा',
  'chrome.home': 'सुडोकू घर',
  'chrome.appearance': 'दिखावट',
  'chrome.theme.use': '{theme} थीम का उपयोग करें',
  'chrome.theme.systemTitle': 'सिस्टम थीम ({theme})',
  'chrome.theme.title': '{theme} थीम',
  'chrome.theme.system': 'सिस्टम',
  'chrome.theme.systemName': 'प्रणाली',
  'chrome.theme.light': 'रोशनी',
  'chrome.theme.dark': 'अंधेरा',
  'chrome.connection.connecting': 'जुड़ रहा है',
  'chrome.connection.unavailable': 'सेवा अनुपलब्ध',
  'chrome.footer.tagline': 'ध्यान भटकाए बिना, विचारशील खेल।',
  'chrome.footer.privacy': 'गोपनीयता',
  'chrome.footer.terms': 'शर्तें',
  'chrome.footer.input': 'कीबोर्ड और स्पर्श तैयार',
};
