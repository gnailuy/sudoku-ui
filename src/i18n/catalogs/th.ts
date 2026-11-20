import type { MessageCatalog } from './types';

export const th: MessageCatalog = {
  'common.language.label': 'ภาษา',
  'common.language.auto': 'อัตโนมัติ',
  'common.language.en': 'ภาษาอังกฤษ',
  'common.language.zh-Hans': '简体中文',
  'common.language.zh-Hant': '繁體中文',
  'common.language.pt-BR': 'โปรตุเกส (บราซิล)',
  'common.language.pt-BR.short': 'ภาษาโปรตุเกส',
  'common.language.es': 'สเปน',
  'common.language.ja': '日本語',
  'common.language.ko': 'เกาหลี',
  'common.language.fr': 'ฝรั่งเศส',
  'common.language.de': 'เยอรมัน',
  'common.language.ru': 'รัสเซีย',
  'common.language.ar': 'العربية',
  'common.language.id': 'บาฮาซาอินโดนีเซีย',
  'common.language.id.short': 'อินโดนีเซีย',
  'common.language.hi': 'हिन्दी',
  'common.language.it': 'อิตาเลียโน่',
  'common.language.tr': 'เติร์กเช่',
  'common.language.vi': 'เตียงเวียต',
  'common.language.uk': 'Укра́ська',
  'common.language.nl': 'เนเธอร์แลนด์',
  'common.language.pl': 'โพลสกี้',
  'common.language.th': 'ไทย',
  'common.language.fil': 'Filipino',
  'common.language.ms': 'Bahasa Melayu',
  'common.language.ms.short': 'Melayu',
  'common.language.cs': 'Čeština',
  'common.language.sv': 'Svenska',
  'accessibility.language.changed': 'ภาษาเปลี่ยนเป็น {language} แล้ว',
  'common.difficulty.easy': 'ง่าย',
  'common.difficulty.medium': 'ปานกลาง',
  'common.difficulty.hard': 'ยาก',
  'common.difficulty.expert': 'เชี่ยวชาญ',
  'common.difficulty.evil': 'โหด',
  'difficulty.easy.name': 'ง่าย',
  'difficulty.medium.name': 'ปานกลาง',
  'difficulty.hard.name': 'ยาก',
  'difficulty.expert.name': 'เชี่ยวชาญ',
  'difficulty.evil.name': 'โหด',
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
  'hint.value-correction.title': 'แก้ไขค่านี้',
  'hint.candidate-correction.title': 'แก้ไขตัวเลือกในช่องนี้',
  'hint.value-correction.summary':
    'ค่าที่ {cell} ขัดแย้งกับปริศนา ล้างข้อมูลก่อนดำเนินการต่อ',
  'hint.candidate-correction.summary':
    'ก่อนดำเนินการต่อ ให้สร้างตัวเลือกใน {cell} ใหม่จากค่าที่ถูกต้องในแถว คอลัมน์ และบล็อก',
  'hint.strategy.summary':
    'ทำงานผ่านขั้นตอน {steps} เพื่อทำความเข้าใจและใช้ {strategy}',
  'hint.value-correction.observe': 'ตรวจสอบ {cell} ค่าของมันขัดแย้งกับบอร์ด',
  'hint.value-correction.conclude':
    'ล้างค่าที่ {cell} เพื่อให้สามารถตรวจสอบตารางตัวเลือกได้ต่อไป',
  'hint.candidate-correction.observe': 'ตรวจสอบ {cell} ตัวเลือกไม่ตรงกับกระดาน',
  'hint.candidate-correction.compare':
    'เริ่มช่องนี้ใหม่จากค่าที่ถูกต้องในแถว คอลัมน์ และบล็อก',
  'hint.candidate-correction.conclude':
    'รีเซ็ตตัวเลือกใน {cell} เป็นตัวเลขทั้งหมดที่แถว คอลัมน์ และบล็อกอนุญาต',
  'hint.coloring.pair':
    'ใน {unit} เลข {digit} ลงได้เฉพาะที่ {cells} และต้องอยู่ในหนึ่งในสองช่องนี้พอดี จึงกำหนดให้สองช่องเป็นกรณีตรงข้ามกันโดยติดป้าย A และ B',
  'hint.coloring.chain':
    'ไล่ไปตามเส้นทึบแต่ละเส้น ซึ่งเชื่อมช่องที่เป็นไปได้เพียงสองช่องสำหรับ {digit} ในแถว คอลัมน์ หรือบล็อกเดียวกัน ป้ายกำกับจึงต้องสลับกันตลอดทั้งสาย โดย A อยู่ที่ {group_a} และ B อยู่ที่ {group_b}',
  'hint.coloring.alternatives':
    'มีเพียงสองกรณี: ช่อง A ทุกช่องเป็น {digit} และช่อง B ทุกช่องไม่ใช่เลขนี้ หรือช่อง B ทุกช่องเป็น {digit} และช่อง A ทุกช่องไม่ใช่เลขนี้ การตัดตัวเลือกทำได้โดยไม่ต้องรู้ว่ากรณีใดถูกต้อง',
  'hint.coloring.elimination':
    '{cell} มองเห็นทั้งตำแหน่งกลุ่ม A ที่ {group_a_cell} และตำแหน่งกลุ่ม B ที่ {group_b_cell} ไม่ว่ากลุ่มใดจะเป็นกลุ่มที่มี {digit} จริง ช่องนี้ก็จะมองเห็นเลขนั้นเสมอ จึงใส่เลขนี้ไม่ได้',
  'hint.coloring.apply':
    'ลบ {candidates} เพราะช่องเป้าหมายแต่ละช่องมองเห็นทั้งตำแหน่งกลุ่ม A และกลุ่ม B ของ {colored_digit} ไม่ว่ากลุ่มใดจะเป็นกลุ่มที่มีเลขนี้จริง ตัวเลือกนี้ก็อยู่ในช่องเป้าหมายไม่ได้ รูปแบบนี้เรียกว่า {strategy}',
  'hint.coloring.place':
    'ผู้สมัครที่เชื่อมโยงสำหรับ {colored_digit} บังคับใช้ผลลัพธ์ วาง {digit} ใน {cell} ลายนี้คือ {strategy}.',
  'hint.x-cycle.opening':
    'ใน {unit} เลข {digit} ลงได้เฉพาะใน {cells} ดังนั้นหนึ่งในสองช่องนี้ต้องเป็น {digit}',
  'hint.x-cycle.assume':
    'สมมติว่า {start} ไม่ใช่ {digit} ช่อง {forced} จะต้องเป็น {digit} ทำให้ {blocked} เป็น {digit} ไม่ได้ และใน {unit} จึงเหลือเพียง {result} ที่ใส่ {digit} ได้',
  'hint.x-cycle.follow':
    'เมื่อ {true_cell} เป็น {digit} ช่อง {blocked} จะเป็น {digit} ไม่ได้ ดังนั้นใน {unit} จึงต้องใส่ {digit} ที่ {result}',
  'hint.x-cycle.close':
    'เมื่อ {true_cell} เป็น {digit} ช่อง {blocked} จะเป็น {digit} ไม่ได้ จึงเหลือเพียง {result} ใน {unit} ที่ยังใส่ {digit} ได้',
  'hint.x-cycle.place':
    'สมมติฐานที่ว่า {assumption} ไม่ใช่ {digit} กลับนำไปสู่ข้อสรุปว่า {cell} เป็น {digit} สมมติฐานนี้จึงเป็นไปไม่ได้ ให้ใส่ {digit} ใน {cell} รูปแบบนี้เรียกว่า {strategy}',
  'hint.xy-chain.start':
    '{cell} มีตัวเลือกเพียง {first_digit} และ {second_digit} เท่านั้น ช่องนี้เป็น {endpoint_digit} หรือถ้าไม่ใช่ {endpoint_digit} ก็ต้องเป็น {other_digit}',
  'hint.xy-chain.assume':
    'สมมติว่า {start} ไม่ใช่ {endpoint_digit} ช่องนี้จึงต้องเป็น {start_value} เนื่องจาก {start} และ {middle} อยู่ใน {first_unit} เดียวกัน {middle} จึงเป็น {start_value} ไม่ได้และต้องเป็น {middle_value} ทำให้ {result} ใน {second_unit} เป็น {middle_value} ไม่ได้ จึงต้องเป็น {result_value}',
  'hint.xy-chain.follow':
    'เนื่องจาก {start} เป็น {start_value} {middle} ใน {first_unit} จึงเป็น {start_value} ไม่ได้และต้องเป็น {middle_value} เนื่องจาก {middle} และ {result} อยู่ใน {second_unit} เดียวกัน {result} จึงเป็น {middle_value} ไม่ได้และต้องเป็น {result_value}',
  'hint.xy-chain.reach':
    'เนื่องจาก {start} เป็น {start_value} {endpoint} จึงเป็น {shared_digit} ไม่ได้ ตัวเลือกอื่นเพียงตัวเดียวคือ {endpoint_digit} ดังนั้นจึงต้องเป็น {endpoint_digit}',
  'hint.xy-chain.place':
    'ถ้า {first_endpoint} เป็น {endpoint_digit} ปลายแรกก็จะเป็น {endpoint_digit} แต่ถ้าไม่ใช่ ลูกโซ่จะบังคับให้ปลายอีกด้านคือ {second_endpoint} เป็น {endpoint_digit} ดังนั้นอย่างน้อยหนึ่งปลายต้องเป็น {endpoint_digit} เนื่องจาก {cell} มองเห็นทั้งสองปลาย จึงเป็น {endpoint_digit} ไม่ได้ ให้ใส่ {digit} ที่ {cell} รูปแบบนี้เรียกว่า {strategy}',
  'hint.argument.digit': '{digit}',
  'hint.naked-single.constraints':
    'เริ่มที่ {cell} แถว คอลัมน์ และบล็อกของช่องนี้มี {excluded_digits} อยู่แล้ว',
  'hint.naked-single.only': 'ดังนั้น {digit} จึงเป็นตัวเลขเดียวที่ใส่ใน {cell} ได้',
  'hint.naked-single.apply':
    'ใส่ {digit} ที่ {cell} ช่องที่เหลือตัวเลือกเพียงตัวเดียวเรียกว่า {strategy}',
  'hint.hidden-single.inspect': 'ใน {unit} ลองดูว่า {digit} ลงช่องใดได้บ้าง',
  'hint.hidden-single.blockers':
    'เลข {digit} ที่วางไว้ใน {blockers} ทำให้ช่องว่างอื่นทั้งหมดใน {unit} ใส่ {digit} ไม่ได้',
  'hint.hidden-single.only': 'จึงเหลือเพียง {cell} ที่ยังใส่ {digit} ได้',
  'hint.hidden-single.apply':
    'ใส่ {digit} ใน {cell} เมื่อเลขหนึ่งตัวลงได้เพียงช่องเดียวในแถว คอลัมน์ หรือบล็อก วิธีนี้เรียกว่า {strategy}',
  'hint.naked-pair.inspect':
    'เริ่มจาก {unit}: {cell} ใส่ได้เพียง {first_digit} หรือ {second_digit}',
  'hint.naked-pair.match':
    'อีกช่องคือ {cell} ซึ่งมีชุดตัวเลือกสองตัวเหมือนกับช่องแรก ได้แก่ {first_digit} และ {second_digit}',
  'hint.naked-pair.reserve':
    'สองช่องนี้ต้องใช้ {digits} สลับกัน จึงลบตัวเลือก {digit} ออกจากช่องอื่นทุกช่องใน {unit} ได้',
  'hint.naked-pair.apply':
    'ลบ {candidates} โดยขั้นตอนนี้ยังไม่มีการใส่ตัวเลข รูปแบบนี้คือ {strategy}',
  'hint.naked-triple.first':
    'เริ่มที่ {unit} โดย {cell} ใส่ได้เพียง {first_digit} หรือ {second_digit}',
  'hint.naked-triple.second':
    'พิจารณา {cell} เพิ่ม ช่องนี้ใส่ได้เพียง {first_digit} หรือ {second_digit}',
  'hint.naked-triple.third':
    'พิจารณา {cell} เพิ่มอีกช่อง ช่องนี้ใส่ได้เพียง {first_digit} หรือ {second_digit} เมื่อรวมกันแล้ว ทั้งสามช่องมีตัวเลือกอยู่ใน {reserved_digits} เท่านั้น',
  'hint.naked-triple.consequence':
    'ทั้งสามช่องต้องใช้ {reserved_digits} คนละหนึ่งตัว จึงตัด {removed_digits} ออกจาก {cell} และเหลือเพียง {remaining_digit}',
  'hint.naked-triple.apply':
    'ใส่ {digit} ใน {cell} เมื่อรวมตัวเลือกของสามช่องแล้วมีเพียงเลขสามตัวเดียวกัน จะเกิดเป็น {strategy}',
  'hint.naked-quad.cell': 'ใน {unit} ช่อง {cell} มีตัวเลือกเพียง {digits}',
  'hint.subset-reservation.observe': 'ใน {unit} ช่อง {cells} มีได้เฉพาะ {digits}',
  'hint.subset-reservation.explain':
    'ช่องเหล่านี้ต้องใช้ {digits} ภายใน {unit} ช่องอื่นในหน่วยนี้จึงใส่ตัวเลขเหล่านี้ไม่ได้',
  'hint.subset-reservation.apply': 'ลบ {candidates} รูปแบบนี้คือ {strategy}',
  'hint.subset-reservation.place': 'ใส่ {digit} ใน {cell} วิธีนี้คือ {strategy}',
  'hint.hidden-subset-confinement.observe':
    'ใน {unit} ตัวเลข {digits} ปรากฏได้เฉพาะใน {cells}',
  'hint.hidden-subset-confinement.explain':
    'เนื่องจาก {digits} ถูกจำกัดอยู่ในช่องเหล่านี้ของ {unit} ช่องเหล่านี้จึงไม่มีตัวเลือกอื่นได้',
  'hint.hidden-subset-confinement.apply':
    'ลบ {candidates} ออกจากช่องที่ถูกจำกัด รูปแบบนี้คือ {strategy}',
  'hint.hidden-subset-confinement.place':
    'ใส่ {digit} ใน {cell} หลังจากลบตัวเลือกอื่น รูปแบบนี้คือ {strategy}',
  'hint.hidden-pair.first': 'ใน {unit} ตัวเลือก {digit} ปรากฏเฉพาะใน {cells}',
  'hint.hidden-pair.second':
    'ตัวเลือก {digit} ก็จำกัดอยู่ในสองช่องเดิม ดังนั้น {digits} ต้องอยู่ใน {cells} สลับลำดับกัน',
  'hint.hidden-pair.consequence':
    'สองช่องนี้ต้องเป็น {digits} จึงลบตัวเลือกอื่น ได้แก่ {candidates} ออกจากทั้งสองช่องได้',
  'hint.hidden-pair.apply': 'ลบ {candidates} รูปแบบนี้คือ {strategy}',
  'hint.hidden-triple.first': 'ใน {unit} ตัวเลือก {digit} ปรากฏเฉพาะใน {cells}',
  'hint.hidden-triple.second': 'ใน {unit} ตัวเลข {digits} ลงได้เฉพาะใน {cells}',
  'hint.hidden-triple.third': 'ใน {unit} ตัวเลข {digits} ลงได้เฉพาะใน {cells}',
  'hint.hidden-triple.consequence':
    'เนื่องจาก {digits} ใน {unit} ลงได้เฉพาะสามช่องนี้ จึงลบตัวเลือกอื่นออกจากทั้งสามช่องได้',
  'hint.hidden-triple.apply':
    'ลบ {candidates} ซึ่งเป็นตัวเลือกอื่นออกจากสามช่องที่ระบุ รูปแบบนี้เรียกว่า {strategy}',
  'hint.hidden-quad.first': 'ใน {unit} ตัวเลือก {digit} ปรากฏเฉพาะใน {cells}',
  'hint.hidden-quad.second': 'ใน {unit} ตัวเลข {digits} ลงได้เฉพาะใน {cells}',
  'hint.hidden-quad.third': 'ใน {unit} ตัวเลข {digits} ลงได้เฉพาะใน {cells}',
  'hint.hidden-quad.fourth': 'ใน {unit} ตัวเลข {digits} ลงได้เฉพาะใน {cells}',
  'hint.hidden-quad.consequence':
    'เนื่องจาก {digits} ใน {unit} ลงได้เฉพาะสี่ช่องนี้ จึงลบตัวเลือกอื่นออกจากทั้งสี่ช่องได้',
  'hint.hidden-quad.apply':
    'ลบ {candidates} ซึ่งเป็นตัวเลือกอื่นออกจากสี่ช่องที่ระบุ รูปแบบนี้เรียกว่า {strategy}',
  'hint.pointing-pair.first':
    'เริ่มจากตัวเลือก {digit} ที่ {cell} ใน {source_unit} แล้วหาช่องอื่นทั้งหมดในบล็อกนี้ที่ยังใส่ {digit} ได้',
  'hint.pointing-pair.second':
    'ใน {source_unit} มีเพียง {cell} ที่เป็นอีกตำแหน่งหนึ่งของ {digit} และทั้งสองช่องอยู่ใน {intersection_unit}',
  'hint.pointing-pair.consequence':
    'ดังนั้น {digit} ใน {source_unit} ต้องอยู่ในหนึ่งในสองช่องที่ระบุ ซึ่งทั้งคู่ตั้งอยู่ใน {intersection_unit} จึงลบ {candidate} ออกจากช่องอื่นใน {intersection_unit} ได้',
  'hint.pointing-pair.apply':
    'ที่ {cell} เหลือตัวเลือกเพียง {digit} จึงใส่ {digit} ลงในช่องนี้ รูปแบบนี้เรียกว่า {strategy}',
  'hint.intersection-confinement.observe':
    'ใน {source_unit} ตัวเลือก {digit} ถูกจำกัดอยู่ที่ {intersection_unit} ที่ {cells}',
  'hint.intersection-confinement.explain':
    'เนื่องจาก {digit} ทุกตัวใน {source_unit} อยู่ใน {intersection_unit} เซลล์ที่อยู่นอกแหล่งที่มาแต่ภายในจุดตัดกันจึงไม่สามารถบรรจุเซลล์ดังกล่าวได้',
  'hint.intersection-confinement.apply':
    'ลบผู้สมัคร {digit} ออกจาก {cells} ลายนี้คือ {strategy}.',
  'hint.intersection-confinement.place':
    'วาง {digit} ใน {cell} หลังจากใช้ทางแยก ลายนี้คือ {strategy}.',
  'hint.fish-confinement.observe':
    'เมื่อพิจารณา {base_units} ตัวเลือก {digit} อยู่ได้เฉพาะใน {cover_units}',
  'hint.fish-confinement.explain':
    'ตัวเลือก {digit} ถูกจำกัดจาก {base_units} ไปยัง {cover_units} ดังนั้นหน่วยครอบเหล่านี้ต้องรับเลขนี้ผ่านตำแหน่งฐานที่ไฮไลต์',
  'hint.swordfish.consequence':
    'แต่ละหน่วยใน {base_units} ต้องมี {digit} หนึ่งตัวอยู่ภายใน {cover_units} เมื่อนับรวมกัน ตำแหน่งเหล่านี้จะอยู่ครบทั้งสามหน่วยดังกล่าวพอดี จึงตัด {digit} ออกจากช่องอื่นในหน่วยเหล่านั้นได้',
  'hint.jellyfish.consequence':
    'แต่ละหน่วยใน {base_units} ต้องมี {digit} หนึ่งตัวอยู่ภายใน {cover_units} เมื่อนับรวมกัน ตำแหน่งเหล่านี้จะอยู่ครบทั้งสี่หน่วยดังกล่าวพอดี จึงตัด {digit} ออกจากช่องอื่นในหน่วยเหล่านั้นได้',
  'hint.fish-confinement.apply':
    'ลบตัวเลือก {digit} ออกจาก {cells} รูปแบบนี้คือ {strategy}',
  'hint.x-wing.first':
    'ใน {base_unit} ตัวเลือก {digit} อยู่ได้เฉพาะใน {cover_units}',
  'hint.x-wing.second':
    'ที่ {base_unit} ตัวเลือก {digit} ก็อยู่ได้เฉพาะใน {cover_units} เช่นกัน ดังนั้นทั้งสองหน่วยจึงมีตำแหน่งที่เป็นไปได้อยู่ในสองหน่วยเดียวกัน',
  'hint.x-wing.consequence':
    'แต่ละหน่วยใน {base_units} ต้องมี {digit} หนึ่งตัวอยู่ภายใน {cover_units} เมื่อนับรวมกัน ตำแหน่งของ {digit} จะอยู่ครบทั้งสองหน่วยดังกล่าวพอดี จึงตัด {digit} ออกจากช่องอื่นในหน่วยเหล่านั้นได้',
  'hint.x-wing.apply':
    'ลบตัวเลือก {digit} ออกจาก {cells} รูปแบบนี้เรียกว่า {strategy}',
  'hint.pivot-wing.observe':
    'ที่ {pivot} ผู้เข้าทดสอบ {pivot_digits} จะเชื่อมต่อเซลล์ปีกที่ {wing_cells}',
  'hint.pivot-wing.explain':
    'แต่ละวิงที่ {wing_cells} ใช้ผู้สมัครคนหนึ่งร่วมกับเดือยที่ {pivot} และทั้งสองวิงมี {shared_digit} ไม่ว่าตัวเลือกเดือยตัวใดจะเป็นจริง ปีกข้างหนึ่งจะต้องมี {shared_digit}',
  'hint.xy-wing.pivot': '{pivot} เหลือตัวเลือกเพียง {digits} จึงต้องเป็นหนึ่งในนั้น',
  'hint.xy-wing.case':
    'ถ้า {pivot} เป็น {pivot_digit} ช่อง {wing} จะเป็น {pivot_digit} ไม่ได้ เมื่อเหลือตัวเลือกอีกเพียงตัวเดียวคือ {shared_digit} ช่อง {wing} จึงต้องเป็น {shared_digit}',
  'hint.xy-wing.guarantee':
    'ไม่ว่า {pivot} จะเป็นตัวเลือกใด อย่างน้อยหนึ่งในสองช่องปีกที่ {wing_cells} ต้องเป็น {shared_digit} โดยไม่จำเป็นต้องรู้ว่าเป็นช่องใด',
  'hint.xy-wing.apply':
    '{cells} มองเห็นทั้งสองปีก {wing_cells} เนื่องจากอย่างน้อยหนึ่งปีกเป็น {shared_digit} ให้ลบ {shared_digit} ออกจากช่องเหล่านี้ รูปแบบนี้เรียกว่า {strategy}',
  'hint.xy-wing.place':
    '{cell} มองเห็นช่องปีกทั้งสองที่ {wing_cells} และอย่างน้อยหนึ่งช่องต้องเป็น {shared_digit} จึงลบ {shared_digit} ออกจากช่องนี้ได้ เมื่อเหลือตัวเลือกเพียง {digit} ให้ใส่เลขนี้ลงไป รูปแบบนี้เรียกว่า {strategy}',
  'hint.xyz-wing.pivot': '{pivot} มีตัวเลือกเพียง {digits} จึงต้องเป็นหนึ่งในนั้น',
  'hint.xyz-wing.case':
    'ถ้า {pivot} เป็น {pivot_digit} ช่อง {wing} ซึ่งอยู่ใน {unit} เดียวกันจะเป็น {pivot_digit} ไม่ได้ และเมื่อตัวเลือกอีกตัวมีเพียง {shared_digit} ช่อง {wing} จึงต้องเป็น {shared_digit}',
  'hint.xyz-wing.pivot-case':
    'ถ้า {pivot} เป็น {shared_digit} ก็แปลว่าช่องแกนมี {shared_digit} อยู่แล้ว',
  'hint.xyz-wing.guarantee':
    'ไม่ว่าตัวเลือกใดใน {pivot} จะเป็นค่าจริง อย่างน้อยหนึ่งช่องใน {pattern_cells} ต้องเป็น {shared_digit} โดยไม่จำเป็นต้องรู้ว่าเป็นช่องใด',
  'hint.xyz-wing.apply':
    '{target} อยู่ใน {first_unit} เดียวกับ {first_pattern_cell} อยู่ใน {second_unit} เดียวกับ {second_pattern_cell} และอยู่ใน {third_unit} เดียวกับ {third_pattern_cell} เนื่องจากอย่างน้อยหนึ่งในสามช่องนั้นเป็น {shared_digit} ช่อง {target} จึงเป็น {shared_digit} ไม่ได้ ให้ลบตัวเลือกนี้ออก วิธีนี้เรียกว่า {strategy}',
  'hint.strong-link-wing.observe':
    'แต่ละช่องใน {wing_cells} ใส่ได้เฉพาะ {digits} เท่านั้น',
  'hint.strong-link-wing.bridge':
    'ใน {unit} ตัวเลือก {link_digit} ปรากฏได้เฉพาะที่ {link_cells} ดังนั้นอย่างน้อยหนึ่งช่องต้องเป็น {link_digit}',
  'hint.strong-link-wing.force':
    'ถ้า {first_link_cell} เป็น {link_digit} ช่องปีก {first_wing_cell} จะเป็น {link_digit} ไม่ได้และต้องเป็น {forced_digit} ส่วนถ้า {second_link_cell} เป็น {link_digit} ช่องปีก {second_wing_cell} ต้องเป็น {forced_digit} ดังนั้นอย่างน้อยหนึ่งในสองช่องปีกดังกล่าวต้องเป็น {forced_digit}',
  'hint.strong-link-wing.apply':
    'อย่างน้อยหนึ่งช่องใน {wing_cells} เป็น {digit} ลบตัวเลือก {digit} ออกจาก {cells} เพราะช่องเหล่านี้มองเห็นทั้งสองช่อง รูปแบบนี้เรียกว่า {strategy}',
  'hint.strong-link-wing.place':
    'อย่างน้อยหนึ่งช่องใน {wing_cells} ต้องเป็น {removed_digit} จึงลบตัวเลือก {removed_digit} ออกจาก {cell} ซึ่งมองเห็นช่องปีกทั้งสองและจะเหลือได้เพียง {digit} ให้ใส่ค่านั้น รูปแบบนี้เรียกว่า {strategy}',
  'hint.relational-wing.apply':
    'ลบผู้สมัคร {digit} ออกจาก {cells} ลายนี้คือ {strategy}.',
  'hint.relational-wing.place':
    'ลบผู้สมัคร {removed_digit} ออกจาก {cell} ดังนั้นให้วาง {digit} ไว้ตรงนั้น ลายนี้คือ {strategy}.',
  'hint.bug-plus-one.bivalue':
    'นอกจาก {cell} แล้ว ช่องที่ยังไม่เติมอีก {count} ช่องต่างมีตัวเลือกช่องละสองตัวพอดี',
  'hint.bug-plus-one.trivalue':
    '{cell} มีตัวเลือกสามตัว ได้แก่ {digits} จึงมีตัวเลือกมากกว่าช่องที่ยังไม่เติมอื่น ๆ อยู่หนึ่งตัว',
  'hint.bug-plus-one.unit-count':
    'ใน {unit} ตัวเลือก {digit} ลงได้สามตำแหน่ง ส่วน {other_digits} ลงได้ตัวละสองตำแหน่ง',
  'hint.bug-plus-one.explain':
    'เมื่อพิจารณา {units} ตัวเลือก {digit} มีตำแหน่งที่ลงได้มากกว่า {other_digits} อยู่หนึ่งตำแหน่ง หาก {cell} ไม่ใช่ {digit} ช่องว่างทุกช่องจะเหลือตัวเลือกสองตัวพอดี ทำให้โจทย์มีคำตอบได้มากกว่าหนึ่งแบบ ดังนั้น {cell} ต้องเป็น {digit}',
  'hint.bug-plus-one.place':
    'เงื่อนไขที่โจทย์ต้องมีคำตอบเพียงแบบเดียวบังคับให้ใส่ {digit} ใน {cell} รูปแบบที่มีช่องหนึ่งซึ่งมีตัวเลือกเกินมาหนึ่งตัวนี้เรียกว่า {strategy}',
  'hint.unique-rectangle.rectangle':
    'ช่องที่ยังไม่เติมทั้งสี่ช่องที่ {cells} เป็นมุมของรูปสี่เหลี่ยมผืนผ้า',
  'hint.unique-rectangle.pair-corners': 'ช่องที่ {cells} มีตัวเลือกเพียง {digits}',
  'hint.unique-rectangle.third-corner':
    '{cell} ก็มีตัวเลือกเพียง {digits} เช่นกัน ตอนนี้สามมุมมีตัวเลือกคู่เดียวกัน',
  'hint.unique-rectangle.expanded-corner':
    '{cell} มีตัวเลือก {digits} โดยเป็นมุมเดียวที่มี {extra_digit} เป็นตัวเลือกเพิ่ม',
  'hint.unique-rectangle.protect-uniqueness':
    'ถ้า {cell} ใช้เลขตัวใดตัวหนึ่งจากคู่ {digits} มุมทั้งสี่จะสลับเลขสองตัวนี้กันได้โดยไม่กระทบแถว คอลัมน์ หรือบล็อก ทำให้โจทย์มีคำตอบที่ถูกต้องสองแบบ ดังนั้นให้ลบ {digits} และเหลือ {extra_digit} ไว้',
  'hint.unique-rectangle.type1-place':
    '{cell} เหลือเพียง {digit} จึงใส่เลขนี้ลงไป วิธีนี้คือ {strategy}',
  'hint.unique-rectangle.observe':
    'เซลล์ที่ {cells} เป็นรูปสี่เหลี่ยมผืนผ้าและทั้งหมดมีคู่ {digits}',
  'hint.unique-rectangle.type1':
    'มุมทั้งสามมี {digits} พอดี หาก {cell} ใช้ตัวเลขตัวใดตัวหนึ่งด้วย สี่เหลี่ยมจะยอมให้โซลูชันสองตัวที่ใช้แทนกันได้',
  'hint.unique-rectangle.type2-first-expanded':
    '{cell} มีตัวเลือกคู่ {pair} และ {extra_digit}',
  'hint.unique-rectangle.type2-shared-extra':
    '{cell} ก็มีตัวเลือกคู่ {pair} พร้อมกับ {extra_digit} เช่นกัน ดังนั้นสองมุมที่มีตัวเลือกเพิ่มจึงมี {extra_digit} ร่วมกัน',
  'hint.unique-rectangle.type2-protect-uniqueness':
    'อย่างน้อยหนึ่งช่องใน {cells} ต้องเป็น {extra_digit} เพื่อไม่ให้เกิดคำตอบที่สลับกันได้สองแบบ เนื่องจาก {target} มองเห็นทั้งสองช่อง จึงเป็น {extra_digit} ไม่ได้',
  'hint.unique-rectangle.type2-place':
    '{cell} เหลือเพียง {digit} จึงใส่เลขนี้ลงไป วิธีนี้เรียกว่า {strategy}',
  'hint.unique-rectangle.type2':
    'มุมที่ขยายทั้งสองมุมที่ {cells} ใช้ {digit} ร่วมกัน ดังนั้นเซลล์ใดๆ ที่เห็นทั้งสองมุมจึงไม่สามารถมี {digit} ได้',
  'hint.unique-rectangle.type3':
    'ตัวเลขพิเศษ {digits} ในสี่เหลี่ยมจะรวมกับ {cells} เป็นเซ็ตย่อยที่สงวนไว้ใน {unit} ดังนั้นตัวเลขเหล่านั้นจึงสามารถลบออกจากตำแหน่งอื่นในหน่วยนั้นได้',
  'hint.unique-rectangle.type3-first-expanded':
    '{cell} มีตัวเลือกคู่ {pair} และตัวเลือกเพิ่ม {extra_digit}',
  'hint.unique-rectangle.type3-second-expanded':
    '{cell} ก็มีตัวเลือกคู่ {pair} และตัวเลือกเพิ่ม {extra_digit} เช่นกัน อย่างน้อยหนึ่งในสองมุมที่มีตัวเลือกเพิ่มต้องใส่เลขจากตัวเลือกที่เพิ่มมา มิฉะนั้นมุมทั้งสี่จะสลับคู่ {pair} กันได้และทำให้โจทย์มีคำตอบสองแบบ',
  'hint.unique-rectangle.type3-partner': '{cell} มีตัวเลือกเพียง {digits}',
  'hint.unique-rectangle.type3-reserve':
    'หนึ่งช่องใน {corners} ต้องใช้เลขตัวหนึ่งจาก {digits} และ {partner} ต้องใช้อีกตัว เลขสองตัวนี้จึงถูกกันไว้ใน {unit} ทำให้ {target} ใส่ {removed_digit} ไม่ได้',
  'hint.unique-rectangle.type3-place':
    '{cell} เหลือเพียง {digit} จึงใส่เลขนี้ลงไป วิธีนี้เรียกว่า {strategy}',
  'hint.unique-rectangle.type4-first-expanded':
    '{cell} มีตัวเลือกคู่ {pair} และตัวเลือกเพิ่ม {extra_digit}',
  'hint.unique-rectangle.type4-second-expanded':
    '{cell} ก็มีตัวเลือกคู่ {pair} และตัวเลือกเพิ่ม {extra_digit} เช่นกัน ตอนนี้สองมุมที่มีตัวเลือกเพิ่มต่างก็มีตัวเลือกคู่นี้ครบทั้งคู่',
  'hint.unique-rectangle.type4':
    'ใน {unit} เลข {digit} ลงได้เพียงสองตำแหน่ง คือ {cells} จึงลบตัวเลือก {removed_digit} ออกจากมุมที่มีตัวเลือกเพิ่มทั้งสองมุมได้ เพราะหากยอมให้ลงในมุมใดมุมหนึ่ง จะทำให้เกิดคำตอบที่สลับกันได้',
  'hint.unique-rectangle.type4-apply':
    'ลบตัวเลือก {digit} ออกจาก {cells} ความสัมพันธ์ที่ทำให้มีคำตอบเดียวนี้เรียกว่า {strategy}',
  'hint.unique-rectangle.apply':
    'ลบ {candidates} ความสัมพันธ์ที่เป็นเอกลักษณ์นี้คือ {strategy}',
  'hint.unique-rectangle.place':
    'วาง {digit} ใน {cell} หลังจากใช้ความสัมพันธ์เฉพาะ ลายนี้คือ {strategy}.',
  'hint.implication-chain.observe': 'เริ่มที่ {cell} ซึ่งมีตัวเลือกเพียง {digits}',
  'hint.implication-chain.explain':
    '{from} และ {to} มีตัวเลือกร่วมกันและมองเห็นกัน ตัวเลือกนั้นจึงเป็นจริงพร้อมกันไม่ได้ และการเชื่อมโยงดำเนินต่อไป',
  'hint.implication-chain.apply':
    'ปลายด้านหนึ่งต้องมี {digit} ดังนั้นให้ลบตัวเลือก {digit} ออกจาก {cells} รูปแบบนี้คือ {strategy}',
  'hint.narration.apply': 'ใช้การหักเงิน:',
  'hint.narration.look-at': 'ดูสิ',
  'hint.narration.value-conflict': '. ค่าที่ป้อนขัดแย้งกับปริศนา',
  'hint.narration.clear-value': 'เคลียร์ค่าได้ที่',
  'hint.narration.clear-value-tail': 'เพื่อให้สามารถตรวจสอบตารางตัวเลือกได้ต่อไป',
  'hint.narration.candidate-inconsistent': '. สถานะตัวเลือกไม่สอดคล้องกับกระดาน',
  'hint.narration.reset-candidates': 'รีเซ็ตชุดตัวเลือกที่ ',
  'hint.narration.reset-candidates-tail':
    ' เป็นตัวเลขทั้งหมดที่ค่าที่ถูกต้องในแถว คอลัมน์ และบล็อกอนุญาต',
  'hint.narration.only-candidate': '. มีตัวเลือกเพียงตัวเดียว: ',
  'hint.narration.period': '.',
  'hint.narration.no-other-digit': 'เพราะไม่มีหลักอื่นเข้าได้',
  'hint.narration.place': ', สถานที่',
  'hint.narration.naked-single-tail': 'ตรงนั้น เทคนิคนี้เรียกว่า Naked Single',
  'hint.narration.in-unit': 'ใน',
  'hint.narration.consider-digit': 'พิจารณาว่าอยู่ที่ไหน',
  'hint.narration.can-appear': 'สามารถปรากฏได้',
  'hint.narration.other-cells': 'ช่องว่างอื่นๆ ทั้งหมดเข้ามา',
  'hint.narration.cannot-contain': 'ไม่สามารถมีได้',
  'hint.narration.leaving-only': 'เหลือเพียง',
  'hint.narration.because-unit': 'เพราะ',
  'hint.narration.still-needs': 'ยังคงต้องการ',
  'hint.narration.only-cell': 'และ',
  'hint.narration.hidden-single-tail': 'เป็นช่องเดียวที่เป็นไปได้',
  'hint.narration.hidden-single-name': 'ตรงนั้น เทคนิคนี้เรียกว่า Hidden Single',
  'hint.narration.place-result': 'สถานที่',
  'hint.narration.in': 'ใน',
  'hint.narration.remove': 'นำตัวเลือก ',
  'hint.narration.from': ' ออกจาก ',
  'hint.narration.separator': ',',
  'hint.narration.strategy-result': '. นี่คือผลลัพธ์ {strategy}',
  'welcome.title': 'เลือกระดับความยาก',
  'welcome.difficulty': 'ความยาก',
  'welcome.start': 'เริ่มปริศนาระดับ{difficulty}',
  'welcome.starting': 'กำลังเริ่มปริศนาระดับ{difficulty}…',
  'welcome.preview': 'ตัวอย่างปริศนาซูโดกุ',
  'loading.initial': 'กำลังโหลดปริศนาของคุณ...',
  'loading.account.title': 'บันทึกปริศนาของคุณลงในบัญชีของคุณ...',
  'loading.account.detail':
    'ความคืบหน้าของคุณยังคงอยู่บนอุปกรณ์นี้จนกว่าการบันทึกบัญชีจะได้รับการยืนยัน',
  'loading.home.title': 'กลับไปสู่หน้าแรก…',
  'loading.home.detail': 'ตรวจสอบอินเทอร์เฟซล่าสุดก่อนแสดงการเลือกระดับ',
  'loading.restart.title': 'กำลังเริ่มปริศนานี้อีกครั้ง...',
  'loading.restart.detail': 'ล็อคบอร์ดเก่าไว้จนกว่าความพยายามครั้งใหม่จะพร้อม',
  'loading.new.title': 'กำลังเตรียมกระดานระดับ{difficulty}…',
  'confirmation.home.title': 'ทิ้งปริศนานี้ไว้',
  'confirmation.home.description':
    'ความคืบหน้าปัจจุบันของคุณจะไม่เปิดโดยอัตโนมัติบนอุปกรณ์นี้อีกต่อไป',
  'confirmation.home.cancel': 'เล่นต่อไป',
  'confirmation.home.confirm': 'กลับสู่หน้าแรก',
  'confirmation.restart.title': 'เริ่มต้นใหม่',
  'confirmation.restart.replay.title': 'เล่นปริศนานี้ซ้ำ',
  'confirmation.restart.replay.description':
    'เก็บสิ่งที่ได้รับเหล่านี้ไว้และรีเซ็ตความพยายามนี้',
  'confirmation.restart.different.title': 'เล่นปริศนาที่แตกต่างกัน',
  'confirmation.restart.different.description': 'เลือกระดับสำหรับกระดานใหม่',
  'confirmation.restart.different.level': 'ระดับสำหรับปริศนาที่แตกต่างกัน',
  'common.cancel': 'ยกเลิก',
  'account.confirm.deleteGame.title': 'ลบเกมนี้',
  'account.confirm.deleteGame.description':
    'ปริศนานี้และความคืบหน้าจะถูกลบออกจากเกมของฉันอย่างถาวร สิ่งนี้ไม่สามารถยกเลิกได้',
  'account.confirm.deleteGame.action': 'ลบเกม',
  'account.confirm.deleteGame.pending': 'กำลังลบเกมที่บันทึกไว้...',
  'account.confirm.deleteAll.title': 'ลบเกมทั้งหมด',
  'account.confirm.deleteAll.description':
    'ปริศนาและความคืบหน้าทั้งหมดในเกมของฉันจะถูกลบออกอย่างถาวร สิ่งนี้ไม่สามารถยกเลิกได้',
  'account.confirm.deleteAll.action': 'ลบเกมทั้งหมด',
  'account.confirm.deleteAll.pending': 'กำลังลบเกมทั้งหมด...',
  'account.confirm.revoke.title': 'ออกจากระบบทุกที่',
  'account.confirm.revoke.description':
    'นี่เป็นการนำคุณออกจากระบบในทุกอุปกรณ์ รวมถึงอุปกรณ์นี้ด้วย บัญชีของคุณและเกมที่บันทึกไว้ยังคงอยู่',
  'account.confirm.revoke.action': 'ออกจากระบบทุกที่',
  'account.confirm.revoke.pending': 'กำลังออกจากระบบทุกที่...',
  'account.confirm.deleteAccount.title': 'ลบบัญชีของคุณ',
  'account.confirm.deleteAccount.description':
    'ข้อมูลประจำตัวของคุณ ทุกเซสชันที่ลงชื่อเข้าใช้ และเกมที่บันทึกไว้ทั้งหมดจะถูกลบออกอย่างถาวร แค็ตตาล็อกปริศนาที่แชร์จะไม่ได้รับผลกระทบ',
  'account.confirm.deleteAccount.action': 'ลบบัญชี',
  'account.confirm.deleteAccount.pending': 'กำลังลบบัญชี...',
  'account.confirm.typeEmail': 'พิมพ์ {email} เพื่อยืนยัน',
  'account.label': 'บัญชี',
  'account.continue.title': 'ดำเนินการต่อบนอุปกรณ์อื่น',
  'account.continue.detail': 'ลงชื่อเข้าใช้เพื่อบันทึกเกมที่ใช้งานของเบราว์เซอร์นี้โดยอัตโนมัติ',
  'account.signIn': 'ลงชื่อเข้าใช้งานด้วย Google',
  'account.signIn.short': 'เข้าสู่ระบบ',
  'game.title': 'ปริศนาระดับ{difficulty}',
  'game.statusActions': 'สถานะและการกระทำของเกม',
  'game.elapsed': 'เวลาที่ผ่านไป',
  'game.mistakes': 'ข้อผิดพลาด {count}',
  'game.mistakes.label':
    '{count, plural, one {# ข้อผิดพลาด} other {# ข้อผิดพลาด} }',
  'game.resume': 'ประวัติย่อ',
  'game.pause': 'หยุดชั่วคราว',
  'status.resumed': 'ปริศนาดำเนินการต่อ',
  'status.paused': 'ปริศนาหยุดชั่วคราว',
  'status.restarted': 'ปริศนาเริ่มต้นใหม่แล้ว ความพยายามครั้งใหม่ ปริศนาเดียวกัน',
  'status.hintClosed': 'ปิดคำแนะนำแล้ว ปริศนาของคุณไม่เปลี่ยนแปลง',
  'status.strategyApplied': 'ใช้กลยุทธ์แล้ว คุณสามารถยกเลิกได้ในขั้นตอนเดียว',
  'status.correctionApplied': 'ใช้การแก้ไขแล้ว คุณสามารถยกเลิกได้ในขั้นตอนเดียว',
  'status.hintAlreadyApplied': 'คำใบ้นี้สะท้อนให้เห็นบนกระดานแล้ว',
  'status.hintRefreshed': 'บอร์ดเปลี่ยนไป ดังนั้นคำใบ้จึงถูกรีเฟรช',
  'status.accountSaved': 'เกมที่บันทึกไว้ในบัญชีของคุณ',
  'status.waitBeforeLeaving': 'รอการเคลื่อนไหวที่ค้างอยู่ก่อนที่จะออกจากปริศนานี้',
  'status.selectEditableCell': 'เลือกช่องที่สามารถแก้ไขได้ก่อนป้อนตัวเลข',
  'status.savingAccount': 'บันทึกเกมท้องถิ่นของคุณลงในบัญชีของคุณ...',
  'status.restoring': 'กำลังกู้คืนปริศนาของคุณ...',
  'status.restored': 'ปริศนาท้องถิ่นของคุณได้รับการกู้คืนแล้ว',
  'status.puzzleReady': 'ปริศนาระดับ{difficulty}พร้อมแล้ว',
  'status.puzzleRestored': 'กู้คืนปริศนาระดับ{difficulty}แล้ว',
  'status.waitBeforeStarting': 'รอการเคลื่อนไหวที่ค้างอยู่ก่อนที่จะเริ่มปริศนาอื่น',
  'status.solved': 'แก้สำเร็จแล้ว! เยี่ยมมาก',
  'status.moveSaved': 'ย้ายที่บันทึกไว้',
  'status.waitBeforeHint': 'รอการเคลื่อนไหวที่ค้างอยู่ก่อนที่จะเปิดคำใบ้',
  'status.hintReady': 'พร้อมคำใบ้. เริ่มต้นด้วยขั้นตอนที่ 1',
  'status.openingSaved': 'กำลังเปิดเกมที่บันทึกไว้...',
  'status.savedDeleted': 'ลบเกมที่บันทึกไว้แล้ว',
  'status.allDeleted': 'ลบเกมที่บันทึกไว้ทั้งหมดแล้ว',
  'status.signedOut': 'ออกจากระบบแล้ว เกมบัญชีของคุณยังคงถูกบันทึกไว้',
  'status.revoked': 'ออกจากระบบทุกที่ ลงชื่อเข้าใช้อีกครั้งเพื่อดำเนินการต่อ',
  'status.accountDeleted': 'ลบบัญชีและเกมที่บันทึกไว้แล้ว',
  'retry.saving': 'ลองบันทึกอีกครั้ง',
  'retry.restoring': 'ลองกู้คืนอีกครั้ง',
  'retry.connection': 'ตรวจสอบการเชื่อมต่อ',
  'retry.starting': 'ลองเริ่มต้นใหม่อีกครั้ง',
  'retry.move': 'ลองย้ายอีกครั้ง',
  'retry.hint': 'ลองคำใบ้อีกครั้ง',
  'retry.time': 'ลองประหยัดเวลาอีกครั้ง',
  'retry.progress': 'ลองบันทึกความคืบหน้าอีกครั้ง',
  'retry.leaving': 'ลองออกไปอีกครั้ง',
  'retry.opening': 'ลองเปิดอีกครั้ง',
  'retry.deleting': 'ลองลบอีกครั้ง',
  'retry.signOut': 'ลองออกจากระบบอีกครั้ง',
  'retry.revoke': 'ลองออกจากระบบทุกที่อีกครั้ง',
  'retry.deleteAccount': 'ลองลบบัญชีอีกครั้ง',
  'error.accountSave': 'เกมในพื้นที่ของคุณปลอดภัย แต่ไม่สามารถบันทึกลงในบัญชีของคุณได้',
  'error.restoring': 'ปริศนาของคุณไม่สามารถกู้คืนได้',
  'error.connection':
    'ไม่สามารถเข้าถึงบริการเกมได้ ตรวจสอบการเชื่อมต่อของคุณแล้วลองอีกครั้ง',
  'error.http': 'บริการเกมส่งคืนข้อผิดพลาด {status} โปรดลองอีกครั้ง',
  'error.unavailable': 'บริการเกมไม่สามารถใช้งานได้ชั่วคราว บอร์ดของคุณปลอดภัย ลองอีกครั้ง',
  'error.starting': 'ไม่สามารถเริ่มเกมได้',
  'error.signInAgain': 'ลงชื่อเข้าใช้อีกครั้งเพื่อบันทึกการเคลื่อนไหว',
  'error.localUnavailable': 'เกมท้องถิ่นไม่พร้อมใช้งาน',
  'error.move': 'ไม่สามารถบันทึกการย้ายได้',
  'error.currentUnavailable': 'เกมปัจจุบันไม่พร้อมใช้งาน',
  'error.hintChanged': 'กระดานเปลี่ยนไปในขณะที่เตรียมคำใบ้',
  'error.hint': 'ไม่สามารถเตรียมคำใบ้ได้',
  'error.time': 'ไม่สามารถบันทึกเวลาเล่นเกมล่าสุดได้',
  'error.timer': 'ไม่สามารถบันทึกสถานะตัวจับเวลาล่าสุดได้',
  'error.leaving': 'ไม่สามารถเคลียร์ปริศนาในเครื่องได้',
  'error.opening': 'เกมที่บันทึกไว้นั้นไม่สามารถเปิดได้',
  'error.deleteGame': 'ไม่สามารถลบเกมที่บันทึกไว้ได้',
  'error.deleteAll': 'เกมที่บันทึกไว้ไม่สามารถลบได้',
  'error.signOut': 'คุณไม่สามารถออกจากระบบได้',
  'error.revoke': 'ไม่สามารถเพิกถอนเซสชันได้',
  'error.deleteAccount': 'ไม่สามารถลบบัญชีได้',
  'error.invalid-request': 'คำขอไม่ถูกต้อง',
  'error.invalid-json': 'คำขอมี JSON ที่ไม่ถูกต้อง',
  'error.unsupported-media-type': 'ไม่รองรับคำขอ Content-Type',
  'error.payload-too-large': 'คำขอมีขนาดใหญ่เกินไป',
  'error.unauthorized': 'จำเป็นต้องได้รับอนุญาต',
  'error.forbidden-origin': 'ไม่อนุญาตให้ใช้ที่มาของคำขอนี้',
  'error.session-not-found': 'ไม่พบเซสชันเกม',
  'error.revision-conflict': 'บอร์ดมีการเปลี่ยนแปลงก่อนที่จะใช้การย้ายนี้',
  'error.invalid-session': 'เซสชันเกมไม่ถูกต้อง',
  'error.invalid-action': 'การกระทำของเกมนี้ไม่ถูกต้อง',
  'error.invalid-cell': 'ช่องนี้ไม่ถูกต้อง',
  'error.immutable-cell': 'ช่องที่ระบุไม่สามารถเปลี่ยนแปลงได้',
  'error.note-not-allowed': 'ไม่สามารถเปลี่ยนแปลงตัวเลือกในช่องนี้ได้',
  'error.no-undo': 'ไม่มีการดำเนินการที่จะเลิกทำ',
  'error.no-redo': 'ไม่มีการดำเนินการที่จะทำซ้ำ',
  'error.no-hint': 'ไม่มีคำใบ้',
  'error.stale-hint': 'กระดานเปลี่ยนไปหลังจากเตรียมคำใบ้นี้แล้ว',
  'error.persistence-failed': 'ไม่สามารถบันทึกเกมได้',
  'error.internal-error': 'ไม่สามารถดำเนินการตามคำขอได้',
  'error.account-unavailable': 'คุณสมบัติบัญชีไม่พร้อมใช้งาน',
  'error.account-unauthorized': 'จำเป็นต้องมีเซสชันการสมัครที่ถูกต้อง',
  'error.csrf-failed': 'ไม่สามารถยืนยันการลงชื่อเข้าใช้นี้ได้ กรุณาเข้าสู่ระบบอีกครั้ง',
  'error.account-game-not-found': 'ไม่พบเกมที่บันทึกไว้',
  'error.guest-revision-conflict': 'เกมท้องถิ่นมีการเปลี่ยนแปลงก่อนที่จะใช้การดำเนินการนี้',
  'error.guest-claim-conflict': 'เกมท้องถิ่นนี้ถูกบันทึกลงในบัญชีแล้ว',
  'error.malformedDescriptor': 'ไม่สามารถแสดงคำอธิบายได้',
  'account.close': 'ปิดแผงบัญชี',
  'account.games.title': 'เกมของฉัน',
  'account.games.deleteAll': 'ลบทั้งหมด',
  'account.games.deletingAll': 'กำลังลบทั้งหมด...',
  'account.games.empty': 'ยังไม่มีเกมที่บันทึกไว้',
  'account.games.puzzle': 'ปริศนา {difficulty}',
  'account.games.finished': 'ที่เสร็จเรียบร้อย',
  'account.games.inProgress': 'อยู่ระหว่างดำเนินการ',
  'account.games.saved': 'เกมที่บันทึกไว้',
  'account.games.open': 'เปิด',
  'account.games.opening': 'กำลังเปิด...',
  'account.games.delete': 'ลบ',
  'account.games.deleting': 'กำลังลบ...',
  'account.signOut': 'ออกจากระบบ',
  'account.signingOut': 'กำลังออกจากระบบ...',
  'account.settings': 'การตั้งค่าบัญชี',
  'account.revoke': 'ออกจากระบบทุกที่',
  'account.delete': 'ลบบัญชี',
  'board.label': 'บอร์ดเกมซูโดกุ',
  'board.cell':
    'แถว {row}, คอลัมน์ {column}, {content}{pending, select, true {, กำลังตรวจสอบ } other {} }{invalid, select, true {, ไม่ถูกต้อง} other {} }{hint, select, none {} other {, {hint}} }',
  'board.cell.given': 'ให้ {value}',
  'board.cell.value': '{value}',
  'board.cell.candidates': 'ว่างเปล่า ตัวเลือก {candidates}',
  'board.cell.empty': 'ว่างเปล่า',
  'board.hint.focus': 'โฟกัสคำใบ้',
  'board.hint.premise': 'หลักฐานคำใบ้',
  'board.hint.eliminated': 'ตัวเลือกที่ถูกคัดออก',
  'board.hint.conclusion': 'ข้อสรุปคำใบ้',
  'board.hint.problem': 'ต้องการการแก้ไข',
  'board.hint.extra': 'ตัวเลือกที่เป็นไปไม่ได้',
  'board.hint.group': 'กลุ่ม {group}',
  'board.hint.chain': 'ตำแหน่งโซ่ {position}',
  'board.paused.title': 'ปริศนาหยุดชั่วคราว',
  'board.paused.detail': 'เวลาของคุณหยุดแล้ว',
  'hint.label': 'คำใบ้',
  'hint.close': 'ปิด',
  'hint.strategy.grade': 'ระดับ {grade}',
  'hint.applying': 'กำลังใช้คำแนะนำ...',
  'hint.refreshing': 'คำใบ้ที่สดชื่น...',
  'hint.step': 'ขั้นตอน {current} ของ {total}',
  'hint.legend.label': 'ตำนานคำใบ้ภาพ',
  'hint.legend.strong': 'ของแข็ง: ต้องมี',
  'hint.legend.weak': 'ประ: ไม่สามารถทั้งสองอย่างได้',
  'hint.legend.implication': 'ลูกศร: ความหมายโดยนัย',
  'hint.legend.groups': 'A/B: การสลับกลุ่ม',
  'hint.legend.order': 'หมายเลข: คำสั่งลูกโซ่',
  'hint.back': 'กลับ',
  'hint.next': 'ต่อไป',
  'hint.apply': 'ใช้คำใบ้',
  'controls.label': 'การควบคุมเกม',
  'controls.digit.note': 'เพิ่มหรือลบบันทึกย่อ {digit}',
  'controls.digit.enter': 'ป้อน {digit}',
  'controls.hint.preparing': 'กำลังเตรียมคำแนะนำ...',
  'controls.complete.title': 'แก้ได้ใน {time}',
  'controls.complete.another': 'เล่น {difficulty} อีกอัน',
  'controls.complete.replay': 'เล่นปริศนานี้ซ้ำ',
  'controls.complete.choose': 'เลือกระดับอื่น',
  'controls.pad': 'แป้นตัวเลข',
  'controls.pad.notes': 'แป้นตัวเลข โหมดบันทึกย่อ',
  'controls.modes': 'โหมดอินพุต',
  'controls.notes.on': 'เปิดโน้ต',
  'controls.notes.off': 'ปิดโน้ต',
  'controls.candidates.on': 'เปิดตัวเลือก',
  'controls.candidates.off': 'ปิดตัวเลือก',
  'controls.actions': 'การกระทำปริศนา',
  'controls.erase': 'ลบ',
  'controls.undo': 'เลิกทำ',
  'controls.undoing': 'กำลังเลิกทำ...',
  'controls.redo': 'ทำซ้ำ',
  'controls.redoing': 'กำลังทำซ้ำ…',
  'controls.hint.reveal': 'เผยคำใบ้',
  'controls.shortcuts': 'แป้นพิมพ์ลัด',
  'controls.shortcuts.move': 'เคลื่อนไหว',
  'controls.shortcuts.arrows': 'ปุ่มลูกศร',
  'controls.shortcuts.enter': 'ป้อนตัวเลข',
  'controls.shortcuts.notes': 'โน้ต / ตัวเลือก',
  'controls.shortcuts.or': 'หรือ',
  'controls.shortcuts.pause': 'หยุดชั่วคราวหรือดำเนินการต่อ',
  'controls.shortcuts.hint': 'เปิด ก้าวหน้า หรือใช้คำใบ้',
  'controls.shortcuts.hintOther': 'การควบคุมคำใบ้อื่น ๆ',
  'hint.target.candidate.visible': 'ตัวเลือกที่ไฮไลต์นี้',
  'hint.target.candidate.locator': '{value} · r{row}c{column}',
  'hint.target.candidate.accessible':
    'ตัวเลือก {value} ที่แถว {row} คอลัมน์ {column}',
  'hint.target.cell.visible': 'ช่องที่ไฮไลต์นี้',
  'hint.target.cell.locator': 'r{row}c{column}',
  'hint.target.cell.accessible': 'แถว {row} คอลัมน์ {column}',
  'hint.target.unit.visible': 'สิ่งนี้เน้น {kind}',
  'hint.target.unit.locator': '{kind} {index}',
  'hint.target.unit.accessible': '{kind} {index}',
  'hint.target.row': 'แถว',
  'hint.target.column': 'คอลัมน์',
  'hint.target.box': 'บล็อก',
  'chrome.home': 'บ้านซูโดกุ',
  'chrome.appearance': 'รูปร่าง',
  'chrome.theme.use': 'ใช้ธีม {theme}',
  'chrome.theme.systemTitle': 'ธีมของระบบ ({theme})',
  'chrome.theme.title': 'ธีม {theme}',
  'chrome.theme.system': 'ระบบ',
  'chrome.theme.systemName': 'ระบบ',
  'chrome.theme.light': 'แสงสว่าง',
  'chrome.theme.dark': 'มืด',
  'chrome.connection.connecting': 'กำลังเชื่อมต่อ',
  'chrome.connection.unavailable': 'บริการไม่พร้อมใช้งาน',
  'chrome.footer.tagline': 'เล่นอย่างใช้ความคิดโดยไม่มีการรบกวน',
  'chrome.footer.privacy': 'ความเป็นส่วนตัว',
  'chrome.footer.terms': 'เงื่อนไข',
  'chrome.footer.input': 'แป้นพิมพ์และระบบสัมผัสพร้อมแล้ว',
} as const;
