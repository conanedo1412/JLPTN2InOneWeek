import type { GrammarItem, KanjiItem, QuizQuestion, StudyContent, VocabularyItem } from "../types";
import { expandedKanji } from "./expandedKanji";
import { improveQuestionChoices } from "./questionQuality";
import { extendedReading } from "./reading";
import { shuffleDeterministic, uniqueTake } from "../utils/random";

const kanjiRows = [
  "圧力|あつりょく|pressure|政府の圧力が強まった。|政治;抽象|3",
  "移転|いてん|relocation|会社は駅前に移転した。|生活;仕事|3",
  "印象|いんしょう|impression|第一印象はとても大切だ。|抽象|2",
  "営業|えいぎょう|business operation|営業時間を確認する。|仕事|3",
  "延長|えんちょう|extension|会議を三十分延長した。|仕事;時間|2",
  "応用|おうよう|application|知識を実生活に応用する。|学習|3",
  "温暖|おんだん|warm climate|温暖な地域で育つ植物だ。|自然|3",
  "解決|かいけつ|solution|問題の解決には時間が必要だ。|抽象|2",
  "改善|かいぜん|improvement|生活習慣を改善する。|生活|2",
  "確認|かくにん|confirmation|予約内容を確認した。|仕事|2",
  "過程|かてい|process|成長の過程を記録する。|抽象|3",
  "可能|かのう|possible|参加は可能です。|抽象|2",
  "環境|かんきょう|environment|職場の環境を整える。|社会|2",
  "観察|かんさつ|observation|子どもの行動を観察する。|研究|3",
  "管理|かんり|management|資料を管理する。|仕事|2",
  "危険|きけん|danger|危険な作業を避ける。|安全|2",
  "基準|きじゅん|standard|判断の基準を決める。|抽象|3",
  "記録|きろく|record|練習時間を記録する。|学習|2",
  "議論|ぎろん|discussion|方針について議論した。|仕事|3",
  "禁止|きんし|prohibition|館内での撮影は禁止だ。|規則|2",
  "傾向|けいこう|tendency|物価は上がる傾向にある。|抽象|3",
  "経験|けいけん|experience|失敗も貴重な経験だ。|生活|2",
  "経済|けいざい|economy|経済の動きに注目する。|社会|3",
  "継続|けいぞく|continuation|学習を継続する。|学習|3",
  "検査|けんさ|inspection|健康診断で検査を受けた。|医療|2",
  "減少|げんしょう|decrease|人口が減少している。|社会|3",
  "効果|こうか|effect|薬の効果が現れた。|生活|2",
  "広告|こうこく|advertisement|駅に新しい広告が出た。|社会|2",
  "構成|こうせい|composition|文章の構成を考える。|学習|3",
  "講義|こうぎ|lecture|大学で講義を受ける。|学習|2",
  "交流|こうりゅう|exchange|地域の人々と交流する。|社会|3",
  "国際|こくさい|international|国際会議に出席する。|社会|2",
  "困難|こんなん|difficulty|困難な状況を乗り越える。|抽象|3",
  "混雑|こんざつ|crowding|電車が混雑している。|交通|2",
  "災害|さいがい|disaster|災害への備えが必要だ。|安全|3",
  "採用|さいよう|adoption; hiring|新しい方法を採用する。|仕事|3",
  "作業|さぎょう|task work|細かい作業が続く。|仕事|2",
  "支給|しきゅう|provision|制服が支給される。|仕事|3",
  "資源|しげん|resource|限られた資源を守る。|社会|3",
  "姿勢|しせい|posture; attitude|前向きな姿勢で取り組む。|抽象|3",
  "指導|しどう|guidance|先生の指導を受ける。|学習|2",
  "収集|しゅうしゅう|collection|情報を収集する。|仕事|3",
  "修正|しゅうせい|correction|書類の誤りを修正した。|仕事|2",
  "渋滞|じゅうたい|traffic jam|道路が渋滞している。|交通|2",
  "状態|じょうたい|condition|機械の状態を調べる。|抽象|2",
  "承認|しょうにん|approval|上司の承認を得る。|仕事|3",
  "消費|しょうひ|consumption|電力の消費を減らす。|社会|3",
  "証明|しょうめい|proof|身分を証明する。|仕事|3",
  "情報|じょうほう|information|正確な情報を集める。|仕事|2",
  "処理|しょり|processing|大量のデータを処理する。|仕事|3",
  "申請|しんせい|application|ビザを申請する。|手続き|3",
  "信頼|しんらい|trust|信頼できる友人だ。|人間関係|2",
  "制限|せいげん|restriction|利用時間に制限がある。|規則|3",
  "制度|せいど|system|新しい制度が始まった。|社会|3",
  "責任|せきにん|responsibility|責任を持って行動する。|仕事|2",
  "接近|せっきん|approach|台風が接近している。|自然|3",
  "設備|せつび|equipment|最新の設備を導入する。|仕事|2",
  "節約|せつやく|saving|水を節約する。|生活|2",
  "選択|せんたく|choice|複数の選択がある。|抽象|2",
  "増加|ぞうか|increase|観光客が増加した。|社会|2",
  "対象|たいしょう|target|調査の対象を決める。|研究|3",
  "態度|たいど|attitude|彼の態度は失礼だった。|人間関係|2",
  "担当|たんとう|being in charge|販売を担当している。|仕事|2",
  "地域|ちいき|region|地域の行事に参加する。|社会|2",
  "知識|ちしき|knowledge|専門的な知識が必要だ。|学習|2",
  "調整|ちょうせい|adjustment|予定を調整する。|仕事|3",
  "提案|ていあん|proposal|新しい計画を提案した。|仕事|2",
  "程度|ていど|degree|ある程度理解できる。|抽象|2",
  "適切|てきせつ|appropriate|適切な表現を選ぶ。|学習|3",
  "統計|とうけい|statistics|統計をもとに判断する。|研究|3",
  "特徴|とくちょう|feature|商品の特徴を説明する。|抽象|2",
  "独立|どくりつ|independence|会社から独立する。|社会|3",
  "努力|どりょく|effort|努力を続ければ伸びる。|学習|2",
  "内容|ないよう|content|メールの内容を確認する。|仕事|2",
  "能力|のうりょく|ability|能力を最大限に生かす。|抽象|2",
  "判断|はんだん|judgment|冷静に判断する。|抽象|2",
  "被害|ひがい|damage|台風で大きな被害が出た。|安全|3",
  "比較|ひかく|comparison|二つの資料を比較する。|学習|2",
  "必要|ひつよう|necessity|準備が必要だ。|生活|2",
  "表現|ひょうげん|expression|気持ちを表現する。|言語|2",
  "評価|ひょうか|evaluation|仕事ぶりを評価される。|仕事|3",
  "不足|ふそく|shortage|説明が不足している。|抽象|2",
  "負担|ふたん|burden|家賃の負担が大きい。|生活|3",
  "変更|へんこう|change|予定を変更した。|仕事|2",
  "報告|ほうこく|report|結果を報告する。|仕事|2",
  "保存|ほぞん|preservation|ファイルを保存する。|仕事|2",
  "満足|まんぞく|satisfaction|結果に満足している。|感情|2",
  "無視|むし|ignoring|警告を無視してはいけない。|行動|2",
  "目的|もくてき|purpose|旅行の目的を説明する。|抽象|2",
  "優先|ゆうせん|priority|安全を優先する。|仕事|3",
  "輸送|ゆそう|transport|荷物を輸送する。|交通|3",
  "予防|よぼう|prevention|病気を予防する。|医療|3",
  "利益|りえき|profit; benefit|会社の利益が増えた。|経済|3",
  "理解|りかい|understanding|相手の立場を理解する。|学習|2",
  "流行|りゅうこう|trend|新しい服が流行している。|社会|2",
  "冷静|れいせい|calm|冷静に対応する。|感情|3",
  "連絡|れんらく|contact|到着したら連絡する。|生活|2",
  "労働|ろうどう|labor|労働条件を見直す。|仕事|3",
  "余裕|よゆう|leeway|時間に余裕を持って行動する。|生活|2",
  "割合|わりあい|ratio|学生の割合が高い。|統計|3"
];

const vocabularyRows = [
  "あいにく|unfortunately|都合が悪い様子|adverb|あいにく部長は外出中です。|Unfortunately, the manager is out.|あいにくの雨|せっかく|3|formal",
  "曖昧|あいまい|vague|はっきりしないこと|na-adj|説明が曖昧で分かりにくい。|The explanation is vague.|曖昧な返事|不明確|3|abstract",
  "明らか|あきらか|obvious|疑いがないほどはっきりしていること|na-adj|原因は明らかだ。|The cause is obvious.|明らかな違い|明確|2|abstract",
  "憧れる|あこがれる|admire; long for|強くそうなりたいと思う|verb|海外で働くことに憧れている。|I long to work abroad.|都会に憧れる|望む|3|emotion",
  "扱う|あつかう|handle; treat|物事を処理する|verb|この店は輸入品を扱っている。|This shop handles imported goods.|丁寧に扱う|取り扱う|2|work",
  "あらかじめ|beforehand|前もって|adverb|資料をあらかじめ読んでおく。|Read the materials beforehand.|あらかじめ準備する|事前に|3|formal",
  "案外|あんがい|unexpectedly|予想と違って|adverb|試験は案外簡単だった。|The test was unexpectedly easy.|案外早く|意外に|2|abstract",
  "維持|いじ|maintenance|同じ状態を保つこと|noun|健康を維持するには運動が必要だ。|Exercise is needed to maintain health.|状態を維持する|保持|3|formal",
  "一応|いちおう|for the time being|十分ではないが最低限|adverb|一応確認しておきます。|I will check just in case.|一応の準備|とりあえず|2|spoken",
  "一時的|いちじてき|temporary|短い間だけのこと|na-adj|これは一時的な問題だ。|This is a temporary problem.|一時的な対応|臨時|3|abstract",
  "移動|いどう|movement|場所を変えること|noun|会議室へ移動してください。|Please move to the meeting room.|場所を移動する|移転|2|daily",
  "違反|いはん|violation|決まりに反すること|noun|交通ルールに違反した。|He violated traffic rules.|規則違反|違法|3|rules",
  "依頼|いらい|request|人に頼むこと|noun|資料の作成を依頼した。|I requested document preparation.|仕事を依頼する|お願い|2|work",
  "印刷|いんさつ|printing|文字や画像を紙に出すこと|noun|資料を印刷する。|Print the materials.|両面印刷|コピー|2|work",
  "引用|いんよう|quotation|他の文章を引いて使うこと|noun|論文から一部を引用した。|I quoted part of a paper.|文章を引用する|参考|3|study",
  "受け入れる|うけいれる|accept|提案や状況を認める|verb|相手の意見を受け入れる。|Accept the other person's opinion.|条件を受け入れる|認める|3|abstract",
  "失う|うしなう|lose|持っていたものをなくす|verb|信頼を失うのは簡単だ。|It is easy to lose trust.|機会を失う|なくす|2|abstract",
  "疑う|うたがう|doubt|本当かどうか怪しいと思う|verb|彼の説明を疑った。|I doubted his explanation.|効果を疑う|怪しむ|3|emotion",
  "打ち合わせ|うちあわせ|meeting|仕事の相談をすること|noun|午後に打ち合わせがある。|There is a meeting in the afternoon.|事前打ち合わせ|会議|2|work",
  "訴える|うったえる|appeal; complain|強く知らせる|verb|住民は騒音を訴えた。|Residents complained about noise.|必要性を訴える|主張する|3|formal",
  "売り切れ|うりきれ|sold out|商品が全部売れた状態|noun|人気商品はすぐ売り切れになった。|The popular item sold out quickly.|売り切れ表示|品切れ|2|shopping",
  "影響|えいきょう|influence|他に変化を与えること|noun|天候が売上に影響する。|Weather affects sales.|大きな影響|効果|2|abstract",
  "援助|えんじょ|assistance|困っている人を助けること|noun|被災地に援助を送る。|Send assistance to the disaster area.|経済援助|支援|3|formal",
  "延期|えんき|postponement|予定を後に延ばすこと|noun|試合は来週に延期された。|The match was postponed to next week.|開催を延期する|延長|2|time",
  "応援|おうえん|support; cheering|励まして助けること|noun|友人の挑戦を応援する。|Support a friend's challenge.|応援メッセージ|支援|2|daily",
  "応じる|おうじる|respond to; accept|求めに合わせて行動する|verb|相談に応じます。|We respond to consultations.|要望に応じる|従う|3|formal",
  "おおよそ|approximately|だいたい|adverb|費用はおおよそ五万円だ。|The cost is approximately 50,000 yen.|おおよその数|約|3|formal",
  "大幅|おおはば|large-scale|変化の程度が大きいこと|na-adj|価格が大幅に下がった。|The price dropped sharply.|大幅な改善|かなり|3|business",
  "おかげ|thanks to|よい結果の原因|noun|先生のおかげで合格できた。|Thanks to my teacher, I passed.|努力のおかげ|せい|2|grammar",
  "恐れる|おそれる|fear|悪いことを心配する|verb|失敗を恐れず挑戦する。|Challenge without fearing failure.|変化を恐れる|怖がる|3|emotion",
  "落ち着く|おちつく|calm down; settle|安定した状態になる|verb|気持ちが落ち着いた。|I calmed down.|落ち着いた雰囲気|静まる|2|emotion",
  "およそ|about|大体の数や量|adverb|駅までおよそ十分です。|It is about ten minutes to the station.|およそ半分|約|2|numbers",
  "解釈|かいしゃく|interpretation|意味を理解して説明すること|noun|この文の解釈は難しい。|This sentence is hard to interpret.|別の解釈|理解|3|study",
  "外出|がいしゅつ|going out|外へ出かけること|noun|午後は外出しています。|I am out in the afternoon.|外出中|出張|2|daily",
  "改善|かいぜん|improvement|悪い点をよくすること|noun|作業方法を改善する。|Improve the work method.|改善策|改良|2|work",
  "回復|かいふく|recovery|元のよい状態に戻ること|noun|体力が回復した。|My strength recovered.|景気回復|復活|3|health",
  "確認|かくにん|confirmation|間違いがないか確かめること|noun|集合時間を確認する。|Confirm the meeting time.|内容確認|チェック|2|work",
  "拡大|かくだい|expansion|大きく広げること|noun|会社は事業を拡大した。|The company expanded its business.|市場拡大|増加|3|business",
  "確実|かくじつ|certain; reliable|間違いがないこと|na-adj|確実な方法を選ぶ。|Choose a reliable method.|確実に進む|確か|3|abstract",
  "過剰|かじょう|excessive|必要以上に多いこと|na-adj|過剰な包装を減らす。|Reduce excessive packaging.|過剰反応|余分|3|formal",
  "課題|かだい|issue; assignment|解決すべき問題|noun|今後の課題を整理する。|Organize future issues.|重要な課題|問題|2|work",
  "活用|かつよう|effective use|役立つように使うこと|noun|空き時間を活用する。|Make use of free time.|データ活用|利用|3|business",
  "仮定|かてい|assumption|もしそうだと考えること|noun|仮定の話として聞いてください。|Please hear it as an assumption.|仮定条件|想定|3|abstract",
  "可能性|かのうせい|possibility|起こりうる見込み|noun|雨の可能性がある。|There is a possibility of rain.|成功の可能性|見込み|2|abstract",
  "かかわる|be involved|関係する|verb|環境問題にかかわる仕事だ。|It is work related to environmental issues.|命にかかわる|関係する|3|formal",
  "環境|かんきょう|environment|周りの条件や状況|noun|学習環境を整える。|Prepare a learning environment.|自然環境|状況|2|society",
  "感覚|かんかく|sense|体や心で感じる働き|noun|時間の感覚がなくなる。|Lose track of time.|金銭感覚|感じ|3|abstract",
  "間隔|かんかく|interval|物と物の間の距離や時間|noun|一定の間隔で休憩する。|Take breaks at regular intervals.|時間の間隔|距離|3|numbers",
  "観光|かんこう|sightseeing|名所などを見て回ること|noun|京都を観光する。|Sightsee in Kyoto.|観光客|旅行|2|travel",
  "関心|かんしん|interest|心を向けること|noun|政治に関心がある。|I am interested in politics.|高い関心|興味|2|abstract",
  "関連|かんれん|connection|物事のつながり|noun|関連する資料を読む。|Read related materials.|関連情報|関係|3|formal",
  "気軽|きがる|casual; easy|負担に感じない様子|na-adj|気軽に質問してください。|Feel free to ask questions.|気軽な相談|簡単|2|daily",
  "期限|きげん|deadline|決められた終わりの時|noun|提出期限を守る。|Meet the submission deadline.|期限切れ|期間|2|work",
  "機嫌|きげん|mood|人の気分|noun|今日は機嫌がよさそうだ。|He seems to be in a good mood today.|機嫌が悪い|気分|2|emotion",
  "貴重|きちょう|valuable|大切で得にくいこと|na-adj|貴重な経験をした。|I had a valuable experience.|貴重な資料|重要|2|abstract",
  "きっかけ|trigger; opportunity|始まりの原因|noun|留学がきっかけで日本語を始めた。|Study abroad triggered my Japanese study.|話すきっかけ|原因|2|daily",
  "規模|きぼ|scale|物事の大きさ|noun|大規模な調査を行う。|Conduct a large-scale survey.|事業規模|程度|3|business",
  "義務|ぎむ|duty|しなければならないこと|noun|税金を払う義務がある。|There is a duty to pay taxes.|義務教育|責任|3|formal",
  "逆に|ぎゃくに|conversely|反対に|adverb|安いが、逆に品質が心配だ。|It is cheap, but conversely the quality worries me.|逆に言えば|反対に|2|logic",
  "吸収|きゅうしゅう|absorption|取り込むこと|noun|新しい知識を吸収する。|Absorb new knowledge.|水分を吸収する|受け取る|3|science",
  "急速|きゅうそく|rapid|変化が非常に速いこと|na-adj|技術が急速に進歩した。|Technology advanced rapidly.|急速な発展|急激|3|formal",
  "休憩|きゅうけい|break|一時的に休むこと|noun|十分休憩しましょう。|Let's take a ten-minute break.|休憩時間|休み|2|daily",
  "強調|きょうちょう|emphasis|特に強く示すこと|noun|安全の重要性を強調した。|Emphasized the importance of safety.|強調表現|主張|3|language",
  "共通|きょうつう|common|二つ以上に同じ点があること|noun|二人には共通の趣味がある。|They have a common hobby.|共通点|同様|2|abstract",
  "協力|きょうりょく|cooperation|力を合わせること|noun|調査に協力してください。|Please cooperate with the survey.|協力体制|手伝い|2|work",
  "許可|きょか|permission|認めること|noun|写真撮影には許可が必要だ。|Permission is needed to take photos.|使用許可|承認|2|rules",
  "距離|きょり|distance|離れている長さ|noun|駅からの距離を調べる。|Check the distance from the station.|一定の距離|間隔|2|numbers",
  "具体的|ぐたいてき|concrete; specific|はっきりした形や内容がある|na-adj|具体的な例を挙げる。|Give a specific example.|具体的な方法|実際|2|study",
  "工夫|くふう|device; ingenuity|よくするための考え|noun|覚え方を工夫する。|Devise a way to remember.|工夫を重ねる|改善|2|study",
  "区別|くべつ|distinction|違いを分けること|noun|似た表現を区別する。|Distinguish similar expressions.|区別がつく|差別|3|language",
  "訓練|くんれん|training|能力を高める練習|noun|避難訓練に参加した。|Participated in evacuation training.|訓練を受ける|練習|3|formal",
  "経由|けいゆ|via|途中でそこを通ること|noun|大阪経由で福岡へ行く。|Go to Fukuoka via Osaka.|東京経由|通過|3|travel",
  "契約|けいやく|contract|約束を正式に決めること|noun|契約を結ぶ前に確認する。|Check before making a contract.|契約書|約束|3|business",
  "継続|けいぞく|continuation|続けること|noun|毎日の継続が力になる。|Daily continuation builds ability.|継続的な努力|続行|3|study",
  "傾向|けいこう|tendency|そうなりやすい方向|noun|最近は物価が上がる傾向だ。|Recently prices tend to rise.|増加傾向|特徴|3|abstract",
  "警告|けいこく|warning|危険を知らせること|noun|画面に警告が表示された。|A warning appeared on the screen.|警告音|注意|3|safety",
  "敬語|けいご|honorific language|相手を敬う表現|noun|敬語の使い方を練習する。|Practice using honorific language.|敬語表現|丁寧語|2|language",
  "欠席|けっせき|absence|出るべき場に出ないこと|noun|体調不良で欠席した。|I was absent due to poor health.|授業を欠席する|欠勤|2|school",
  "決定|けってい|decision|はっきり決めること|noun|会議で方針が決定した。|The policy was decided in the meeting.|正式決定|判断|2|work",
  "欠点|けってん|weak point|足りないところ|noun|この方法にも欠点がある。|This method also has weak points.|欠点を補う|短所|2|abstract",
  "結論|けつろん|conclusion|考えた末の結果|noun|結論から先に話す。|State the conclusion first.|結論を出す|結果|2|logic",
  "検討|けんとう|consideration|よく調べて考えること|noun|計画を検討している。|We are considering the plan.|再検討|確認|3|work",
  "限界|げんかい|limit|これ以上できない境目|noun|一人で作業するには限界がある。|There is a limit to working alone.|能力の限界|制限|3|abstract",
  "現実|げんじつ|reality|実際のこと|noun|理想と現実は違う。|Ideals and reality differ.|現実的な案|事実|2|abstract",
  "現象|げんしょう|phenomenon|観察できる出来事|noun|不思議な現象が起きた。|A strange phenomenon occurred.|自然現象|出来事|3|science",
  "講演|こうえん|lecture; speech|人前で話すこと|noun|専門家の講演を聞く。|Listen to an expert lecture.|記念講演|講義|3|formal",
  "効果的|こうかてき|effective|よい結果につながること|na-adj|効果的な復習方法を選ぶ。|Choose an effective review method.|効果的に学ぶ|有効|2|study",
  "交換|こうかん|exchange|互いに取り替えること|noun|名刺を交換した。|We exchanged business cards.|意見交換|変更|2|work",
  "合計|ごうけい|total|全部を合わせた数|noun|合計金額を確認する。|Check the total amount.|合計点|総計|2|numbers",
  "広告|こうこく|advertisement|商品などを知らせるもの|noun|広告を見て店に行った。|I went to the shop after seeing the advertisement.|広告費|宣伝|2|business",
  "貢献|こうけん|contribution|役に立つ働きをすること|noun|地域に貢献したい。|I want to contribute to the community.|社会貢献|協力|3|formal",
  "考慮|こうりょ|consideration|事情を含めて考えること|noun|安全面を考慮する。|Consider safety aspects.|事情を考慮する|検討|3|formal",
  "越える|こえる|exceed; cross|基準や場所を過ぎる|verb|参加者は百人を越えた。|Participants exceeded one hundred.|限界を越える|超える|2|numbers",
  "誤解|ごかい|misunderstanding|間違って理解すること|noun|説明不足で誤解が生じた。|A misunderstanding arose from insufficient explanation.|誤解を招く|勘違い|2|communication",
  "国籍|こくせき|nationality|所属する国|noun|申請書に国籍を書く。|Write nationality on the form.|国籍欄|出身|3|formal",
  "個人|こじん|individual|一人の人|noun|個人情報を守る。|Protect personal information.|個人差|私人|2|society",
  "固定|こてい|fixing|動かないようにすること|noun|棚を壁に固定する。|Fix the shelf to the wall.|固定費|安定|3|formal",
  "異なる|ことなる|differ|同じでない|verb|地域によって習慣が異なる。|Customs differ by region.|意見が異なる|違う|2|formal",
  "断る|ことわる|refuse|相手の頼みを受けない|verb|丁寧に依頼を断った。|I politely refused the request.|誘いを断る|拒否する|2|communication",
  "混乱|こんらん|confusion|秩序が乱れること|noun|急な変更で現場が混乱した。|The site was confused by the sudden change.|混乱を招く|迷惑|3|abstract",
  "差|さ|difference|二つの間の違い|noun|成績に大きな差がある。|There is a big difference in results.|差が出る|違い|2|numbers",
  "採用|さいよう|hiring; adoption|人や方法を選んで使うこと|noun|新卒を採用する。|Hire new graduates.|採用試験|雇用|3|work",
  "削除|さくじょ|deletion|消して取り除くこと|noun|不要なデータを削除する。|Delete unnecessary data.|削除ボタン|消去|2|tech",
  "避ける|さける|avoid|問題が起きないように離れる|verb|混雑を避けて出発した。|Departed to avoid crowds.|危険を避ける|逃げる|2|daily",
  "支える|ささえる|support|倒れないよう助ける|verb|家族が彼を支えた。|His family supported him.|生活を支える|応援する|2|daily",
  "作成|さくせい|creation|書類などを作ること|noun|報告書を作成する。|Create a report.|資料作成|制作|2|work",
  "作業|さぎょう|work task|決まった仕事をすること|noun|細かい作業を続ける。|Continue detailed work.|確認作業|仕事|2|work",
  "指示|しじ|instruction|することを伝えること|noun|上司の指示に従う。|Follow the boss's instructions.|指示を出す|命令|2|work",
  "支持|しじ|support|考えや人をよいとして助けること|noun|多くの人が政策を支持した。|Many people supported the policy.|支持を得る|応援|3|society",
  "事情|じじょう|circumstances|背景にある理由や状況|noun|事情を説明する。|Explain the circumstances.|特別な事情|理由|2|formal",
  "自然|しぜん|nature; natural|人の手が入っていないこと|noun|自然を守る活動に参加する。|Participate in nature conservation.|自然環境|当然|2|nature",
  "実施|じっし|implementation|実際に行うこと|noun|アンケートを実施する。|Conduct a questionnaire.|試験実施|実行|3|formal",
  "実績|じっせき|achievement record|これまでの結果|noun|この会社は実績がある。|This company has a record of achievements.|販売実績|成果|3|business",
  "実力|じつりょく|actual ability|本当の力|noun|試験で実力を出し切る。|Show your true ability on the test.|実力不足|能力|2|study",
  "指定|してい|designation|特定して決めること|noun|指定された席に座る。|Sit in the designated seat.|日時指定|決定|3|formal",
  "支配|しはい|control; rule|強い力で動かすこと|noun|感情に支配されない。|Do not be controlled by emotion.|市場を支配する|管理|4|formal",
  "死亡|しぼう|death|人が亡くなること|noun|事故で死亡者が出た。|There were deaths in the accident.|死亡率|死去|3|news",
  "締切|しめきり|deadline|受け付けの終わり|noun|申し込みの締切は明日だ。|The application deadline is tomorrow.|締切間近|期限|2|work",
  "需要|じゅよう|demand|必要として求めること|noun|電気自動車の需要が増えた。|Demand for electric cars increased.|需要と供給|必要|3|economy",
  "修正|しゅうせい|correction|間違いを直すこと|noun|文章を修正する。|Correct the text.|修正案|訂正|2|work",
  "充実|じゅうじつ|fulfillment; enrichment|内容が十分で満ちていること|noun|充実した一日だった。|It was a fulfilling day.|内容が充実する|満足|3|abstract",
  "柔軟|じゅうなん|flexible|状況に合わせて変えられること|na-adj|柔軟な対応が必要だ。|Flexible response is needed.|柔軟に考える|自由|3|abstract",
  "順調|じゅんちょう|smooth|問題なく進むこと|na-adj|準備は順調に進んでいる。|Preparation is going smoothly.|順調な回復|好調|2|abstract",
  "承認|しょうにん|approval|正式に認めること|noun|計画は承認された。|The plan was approved.|承認を得る|許可|3|work",
  "省略|しょうりゃく|omission|一部を省くこと|noun|説明を一部省略した。|Part of the explanation was omitted.|省略表現|短縮|3|language",
  "証拠|しょうこ|evidence|事実を示すもの|noun|十分な証拠がない。|There is not enough evidence.|証拠を示す|証明|3|formal",
  "詳細|しょうさい|details|細かい内容|noun|詳細はメールで送ります。|I will send the details by email.|詳細情報|内容|2|work",
  "状態|じょうたい|state; condition|その時の様子|noun|機械の状態を確認する。|Check the machine's condition.|健康状態|状況|2|abstract",
  "条件|じょうけん|condition|物事が成立するための決まり|noun|条件に合う人を探す。|Look for someone who meets the conditions.|条件付き|状況|2|formal",
  "譲る|ゆずる|yield; hand over|自分のものや順番を相手に渡す|verb|席をお年寄りに譲る。|Give up a seat to an elderly person.|席を譲る|渡す|2|daily",
  "処理|しょり|processing|問題や作業を片付けること|noun|問い合わせを処理する。|Process inquiries.|事務処理|対応|3|work",
  "申請|しんせい|application|許可を求めて申し込むこと|noun|パスポートを申請する。|Apply for a passport.|申請書|申し込み|3|formal",
  "慎重|しんちょう|careful|十分に注意する様子|na-adj|慎重に判断する。|Judge carefully.|慎重な態度|注意深い|3|abstract",
  "信頼|しんらい|trust|安心して頼れること|noun|信頼関係を築く。|Build a relationship of trust.|信頼できる人|信用|2|relationship",
  "制限|せいげん|restriction|自由にできる範囲を狭めること|noun|利用時間を制限する。|Restrict usage time.|年齢制限|限界|3|rules",
  "制度|せいど|system|社会の決まりや仕組み|noun|新しい制度を導入する。|Introduce a new system.|社会制度|仕組み|3|society",
  "請求|せいきゅう|billing; demand|支払いなどを求めること|noun|料金を請求された。|I was billed the fee.|請求書|要求|3|business",
  "製造|せいぞう|manufacturing|物を作ること|noun|この工場は部品を製造している。|This factory manufactures parts.|製造業|制作|3|business",
  "積極的|せっきょくてき|proactive|自分から進んで行う様子|na-adj|積極的に質問する。|Ask questions proactively.|積極的な姿勢|前向き|2|abstract",
  "設計|せっけい|design|構造や計画を考えること|noun|建物を設計する。|Design a building.|設計図|計画|3|work",
  "説得|せっとく|persuasion|相手に納得させること|noun|両親を説得した。|I persuaded my parents.|説得力|説明|3|communication",
  "設備|せつび|equipment|必要な機械や施設|noun|設備が整っている。|The equipment is complete.|医療設備|道具|2|work",
  "節約|せつやく|saving|無駄を減らすこと|noun|電気を節約する。|Save electricity.|時間の節約|倹約|2|daily",
  "選択|せんたく|selection|複数から選ぶこと|noun|正しい選択をする。|Make the right choice.|選択肢|決定|2|abstract",
  "操作|そうさ|operation|機械などを動かすこと|noun|機械の操作を覚える。|Learn how to operate the machine.|操作方法|運転|2|tech",
  "組織|そしき|organization|人が集まり役割を持つ集団|noun|大きな組織で働く。|Work in a large organization.|組織改革|団体|3|business",
  "存在|そんざい|existence|あること|noun|その問題の存在に気づいた。|I noticed the existence of the problem.|存在感|有無|2|abstract",
  "対応|たいおう|response|状況に合わせて処理すること|noun|苦情に対応する。|Respond to complaints.|迅速な対応|処理|2|work",
  "対象|たいしょう|target; object|行動や調査が向けられるもの|noun|調査対象は大学生だ。|The survey target is university students.|対象者|目的|3|formal",
  "代表|だいひょう|representative|集団を代表する人やもの|noun|代表として意見を述べる。|State an opinion as representative.|日本代表|代理|2|society",
  "態度|たいど|attitude|人に対する様子や考え方|noun|面接では態度も見られる。|Attitude is also observed in interviews.|態度が悪い|姿勢|2|relationship",
  "大半|たいはん|majority|半分を大きく超える部分|noun|参加者の大半は学生だった。|Most participants were students.|大半を占める|多く|3|numbers",
  "確かめる|たしかめる|make sure|本当かどうか確認する|verb|出発前に時間を確かめる。|Make sure of the time before leaving.|事実を確かめる|確認する|2|daily",
  "多少|たしょう|somewhat; a little|少しあること|adverb|多少の遅れは問題ない。|A slight delay is not a problem.|多少異なる|少々|2|abstract",
  "達成|たっせい|achievement|目標を成し遂げること|noun|売上目標を達成した。|Achieved the sales target.|目標達成|成功|2|work",
  "担当|たんとう|person in charge|ある仕事を受け持つこと|noun|私は予約を担当しています。|I am in charge of reservations.|担当者|責任|2|work",
  "単なる|たんなる|mere|それだけの|adnominal|それは単なる偶然ではない。|That is not mere coincidence.|単なるミス|ただの|3|formal",
  "知識|ちしき|knowledge|知っている内容|noun|幅広い知識が必要だ。|Broad knowledge is necessary.|専門知識|情報|2|study",
  "地域|ちいき|region|ある範囲の土地|noun|地域の特徴を調べる。|Research regional features.|地域社会|地方|2|society",
  "知恵|ちえ|wisdom|経験から得たよい考え|noun|昔の人の知恵を学ぶ。|Learn the wisdom of people in the past.|生活の知恵|知識|3|abstract",
  "遅刻|ちこく|lateness|決められた時刻に遅れること|noun|会議に遅刻した。|I was late for the meeting.|遅刻理由|遅延|2|daily",
  "調査|ちょうさ|survey; investigation|詳しく調べること|noun|利用者の満足度を調査する。|Survey user satisfaction.|市場調査|研究|2|work",
  "調整|ちょうせい|adjustment|合うように整えること|noun|日程を調整する。|Adjust the schedule.|調整中|変更|3|work",
  "直前|ちょくぜん|just before|すぐ前|noun|試験直前に復習する。|Review just before the exam.|出発直前|直後|2|time",
  "通勤|つうきん|commuting|仕事場へ通うこと|noun|電車で通勤している。|I commute by train.|通勤時間|通学|2|daily",
  "通過|つうか|passing through|そこを通り過ぎること|noun|駅を通過する電車だ。|It is a train passing through the station.|台風通過|経由|3|travel",
  "通知|つうち|notification|知らせること|noun|結果はメールで通知される。|Results are notified by email.|通知を受ける|連絡|2|work",
  "ついに|finally|長い時間の後で|adverb|ついに計画が完成した。|The plan was finally completed.|ついに実現|とうとう|2|time",
  "追加|ついか|addition|後から加えること|noun|資料を追加する。|Add materials.|追加料金|補足|2|work",
  "提出|ていしゅつ|submission|書類などを出すこと|noun|宿題を提出する。|Submit homework.|提出期限|提示|2|school",
  "低下|ていか|decline|程度が下がること|noun|集中力が低下した。|Concentration declined.|品質低下|減少|3|abstract",
  "提案|ていあん|proposal|考えを出すこと|noun|改善案を提案する。|Propose an improvement plan.|提案書|提示|2|work",
  "程度|ていど|degree; extent|どのくらいかということ|noun|どの程度必要ですか。|To what extent is it necessary?|ある程度|レベル|2|abstract",
  "適切|てきせつ|appropriate|目的や状況に合っていること|na-adj|適切な言葉を選ぶ。|Choose appropriate words.|適切な判断|正確|3|abstract",
  "適度|てきど|moderate|ちょうどよい程度|na-adj|適度な運動をする。|Do moderate exercise.|適度な休憩|適切|3|health",
  "手続き|てつづき|procedure|決められた順に行う作業|noun|入学手続きを済ませる。|Complete enrollment procedures.|手続き方法|処理|2|formal",
  "徹底|てってい|thoroughness|最後まで十分に行うこと|noun|安全確認を徹底する。|Thoroughly confirm safety.|徹底的に調べる|完全|3|formal",
  "展開|てんかい|development; unfolding|物事が広がり進むこと|noun|話が意外な方向に展開した。|The story developed unexpectedly.|事業展開|進展|3|formal",
  "統一|とういつ|unification|一つにそろえること|noun|表記を統一する。|Unify the notation.|デザイン統一|一貫|3|work",
  "当然|とうぜん|natural; of course|そうであるのが普通|adverb|当然の結果だと思う。|I think it is a natural result.|当然ながら|自然|2|logic",
  "特徴|とくちょう|feature|他と違う目立つ点|noun|商品の特徴を説明する。|Explain the product's features.|大きな特徴|特色|2|abstract",
  "独自|どくじ|original; independent|他とは違うそのものだけの|noun|独自の方法で学ぶ。|Study with an original method.|独自性|個別|3|formal",
  "突然|とつぜん|suddenly|予想なく急に|adverb|突然雨が降り出した。|It suddenly started raining.|突然の変更|急に|2|time",
  "努力|どりょく|effort|目標のために力を尽くすこと|noun|努力が結果につながる。|Effort leads to results.|努力を重ねる|頑張り|2|study",
  "取り組む|とりくむ|work on|真剣に行う|verb|課題に取り組む。|Work on the issue.|問題に取り組む|対応する|2|study",
  "内容|ないよう|content|中に含まれること|noun|契約内容を確認する。|Confirm the contract contents.|内容が濃い|中身|2|work",
  "納得|なっとく|understanding; acceptance|十分理解して認めること|noun|説明を聞いて納得した。|I understood after hearing the explanation.|納得がいく|理解|2|emotion",
  "慣れる|なれる|get used to|経験して普通になる|verb|新しい生活に慣れる。|Get used to a new life.|仕事に慣れる|習慣化する|2|daily",
  "何とか|なんとか|somehow|十分でなくてもどうにか|adverb|何とか締切に間に合った。|Somehow made the deadline.|何とかなる|どうにか|2|spoken",
  "似合う|にあう|suit|人や物に合っている|verb|その色はあなたに似合う。|That color suits you.|服が似合う|合う|2|daily",
  "認める|みとめる|recognize; admit|正しいと受け入れる|verb|自分の間違いを認めた。|Admitted my mistake.|正式に認める|受け入れる|2|formal",
  "能力|のうりょく|ability|物事を行う力|noun|読む能力を伸ばす。|Improve reading ability.|能力が高い|実力|2|study",
  "農業|のうぎょう|agriculture|作物を育てる産業|noun|この地域では農業が盛んだ。|Agriculture is active in this region.|農業技術|産業|3|society",
  "のんびり|leisurely|急がずゆったり|adverb|休日は家でのんびり過ごす。|Spend the holiday leisurely at home.|のんびりした性格|ゆっくり|2|daily",
  "背景|はいけい|background|後ろにある事情|noun|問題の背景を説明する。|Explain the background of the problem.|社会的背景|事情|3|formal",
  "発見|はっけん|discovery|新しく見つけること|noun|新しい方法を発見した。|Discovered a new method.|発見につながる|見つける|2|study",
  "発表|はっぴょう|announcement; presentation|人前で知らせること|noun|研究結果を発表する。|Present research results.|発表資料|公表|2|school",
  "判断|はんだん|judgment|情報をもとに決めること|noun|状況を見て判断する。|Judge based on the situation.|判断力|決定|2|abstract",
  "範囲|はんい|range|決められた広がり|noun|試験範囲を確認する。|Confirm the exam range.|範囲外|領域|2|study",
  "反応|はんのう|reaction|刺激への返事や変化|noun|客の反応を見る。|Watch customers' reactions.|反応が早い|対応|2|abstract",
  "被害|ひがい|damage|悪い影響を受けること|noun|大雨で被害が出た。|Heavy rain caused damage.|被害者|損害|3|news",
  "比較|ひかく|comparison|二つ以上を比べること|noun|料金を比較する。|Compare prices.|比較表|対比|2|study",
  "批判|ひはん|criticism|欠点を指摘すること|noun|政策に批判が集まった。|Criticism gathered against the policy.|厳しい批判|非難|3|news",
  "秘密|ひみつ|secret|他人に知らせないこと|noun|秘密を守る。|Keep a secret.|秘密にする|内緒|2|daily",
  "微妙|びみょう|subtle|はっきり言いにくい様子|na-adj|二つの意味は微妙に違う。|The two meanings differ subtly.|微妙な違い|曖昧|3|language",
  "評価|ひょうか|evaluation|価値や成果を判断すること|noun|努力が評価された。|The effort was evaluated.|高い評価|判断|3|work",
  "表現|ひょうげん|expression|考えや気持ちを表すこと|noun|自然な表現を覚える。|Learn natural expressions.|表現力|言い方|2|language",
  "費用|ひよう|expense|必要なお金|noun|旅行の費用を計算する。|Calculate travel expenses.|費用負担|料金|2|money",
  "不安|ふあん|anxiety|安心できない気持ち|noun|結果が出るまで不安だった。|I was anxious until the result came out.|不安を感じる|心配|2|emotion",
  "不足|ふそく|shortage|十分でないこと|noun|人手が不足している。|There is a labor shortage.|説明不足|欠乏|2|abstract",
  "負担|ふたん|burden|重く感じる責任や費用|noun|通勤の負担が大きい。|The commuting burden is heavy.|負担を減らす|責任|3|abstract",
  "普及|ふきゅう|spread; diffusion|広く行き渡ること|noun|スマートフォンが普及した。|Smartphones became widespread.|普及率|流行|3|society",
  "不満|ふまん|dissatisfaction|満足できない気持ち|noun|サービスに不満がある。|I am dissatisfied with the service.|不満を持つ|文句|2|emotion",
  "分類|ぶんるい|classification|種類ごとに分けること|noun|資料を分類する。|Classify the documents.|分類表|区別|3|study",
  "分析|ぶんせき|analysis|細かく調べること|noun|データを分析する。|Analyze data.|分析結果|調査|3|work",
  "平等|びょうどう|equality|差がなく同じ扱い|noun|平等な機会を与える。|Give equal opportunities.|男女平等|公平|3|society",
  "変更|へんこう|change|決まっていたことを変えること|noun|予定を変更する。|Change the schedule.|変更点|修正|2|work",
  "報告|ほうこく|report|結果や状況を知らせること|noun|進み具合を報告する。|Report progress.|報告書|連絡|2|work",
  "方針|ほうしん|policy|進む方向や考え方|noun|今後の方針を決める。|Decide future policy.|基本方針|方法|3|work",
  "保存|ほぞん|saving; preservation|残しておくこと|noun|写真を保存する。|Save photos.|データ保存|保管|2|tech",
  "募集|ぼしゅう|recruitment|人を集めること|noun|参加者を募集する。|Recruit participants.|募集要項|採用|2|work",
  "保証|ほしょう|guarantee|責任を持って確かだとすること|noun|品質を保証する。|Guarantee quality.|保証期間|保障|3|business",
  "満足|まんぞく|satisfaction|十分だと感じること|noun|結果に満足している。|I am satisfied with the result.|満足度|納得|2|emotion",
  "魅力|みりょく|appeal; charm|人を引きつける力|noun|この町には魅力がある。|This town has charm.|魅力的な商品|人気|2|abstract",
  "無視|むし|ignoring|存在や意見を取り上げないこと|noun|警告を無視した。|Ignored the warning.|無視できない|軽視|2|communication",
  "目標|もくひょう|goal|目指すところ|noun|具体的な目標を立てる。|Set a specific goal.|目標達成|目的|2|study",
  "目的|もくてき|purpose|何のためにするか|noun|訪問の目的を説明する。|Explain the purpose of the visit.|目的地|目標|2|abstract",
  "役割|やくわり|role|果たすべき働き|noun|チームでの役割を理解する。|Understand your role in the team.|重要な役割|責任|2|work",
  "やや|somewhat|少し|adverb|説明がやや難しい。|The explanation is somewhat difficult.|やや高い|少し|2|formal",
  "唯一|ゆいいつ|only; sole|ただ一つ|noun|それが唯一の方法だ。|That is the only method.|唯一の欠点|一つだけ|2|abstract",
  "優先|ゆうせん|priority|他より先に扱うこと|noun|安全を優先する。|Prioritize safety.|優先順位|先行|3|work",
  "有効|ゆうこう|valid; effective|効果があること|na-adj|この方法は有効だ。|This method is effective.|有効期限|効果的|3|formal",
  "余裕|よゆう|leeway|時間や力にゆとりがあること|noun|少し余裕を持って出発する。|Leave with a little extra time.|時間の余裕|ゆとり|2|daily",
  "予想|よそう|prediction|前もって考えること|noun|結果を予想する。|Predict the result.|予想以上|想像|2|abstract",
  "予防|よぼう|prevention|悪いことが起きないようにすること|noun|風邪を予防する。|Prevent colds.|予防接種|防止|3|health",
  "利点|りてん|advantage|よい点|noun|この方法の利点を説明する。|Explain the advantages of this method.|利点と欠点|長所|2|abstract",
  "利益|りえき|profit; benefit|得になること|noun|利益を上げる。|Make a profit.|利益率|利点|3|business",
  "理解|りかい|understanding|意味や事情が分かること|noun|文法の違いを理解する。|Understand grammar differences.|理解が深まる|把握|2|study",
  "理想|りそう|ideal|最も望ましい状態|noun|理想の働き方を考える。|Think about an ideal way of working.|理想的な環境|目標|2|abstract",
  "流行|りゅうこう|trend|広くはやること|noun|新しい表現が流行している。|A new expression is trending.|流行語|普及|2|society",
  "留守|るす|absence from home|家にいないこと|noun|留守の間に電話があった。|There was a call while I was away.|留守番電話|外出|2|daily",
  "冷静|れいせい|calm|感情に流されない様子|na-adj|冷静に考える。|Think calmly.|冷静な判断|落ち着く|3|emotion",
  "連続|れんぞく|continuation in a row|続いて起こること|noun|三日連続で雨が降った。|It rained for three days in a row.|連続記録|継続|2|time",
  "連絡|れんらく|contact|情報を知らせること|noun|到着したら連絡してください。|Please contact me when you arrive.|緊急連絡|通知|2|daily",
  "労働|ろうどう|labor|働くこと|noun|労働時間を減らす。|Reduce working hours.|労働条件|仕事|3|work",
  "論理|ろんり|logic|筋道立った考え方|noun|論理的に説明する。|Explain logically.|論理的思考|理由|3|study",
  "割合|わりあい|ratio; comparatively|全体に対する部分|noun|高齢者の割合が増えた。|The ratio of elderly people increased.|割合が高い|比率|3|numbers",
  "割引|わりびき|discount|値段を安くすること|noun|学生割引を利用する。|Use a student discount.|割引券|値引き|2|shopping"
];

const grammarRows = [
  "あげく|after all; in the end|長く迷ったり苦労した後、よくない結果になる。|Vた/名の + あげく|悩んだあげく、留学をやめた。|After much worry, I gave up studying abroad.|末に is more neutral and can be positive.|Long struggle, bad ending.|3|result",
  "以上は|now that; since|責任を持って最後まで行う気持ちを表す。|V辞書/た + 以上は|約束した以上は、守るべきだ。|Now that you promised, you should keep it.|からには is very similar but stronger spoken emphasis.|Promise means responsibility.|3|obligation",
  "一方だ|keep on|変化が一方向に進み続ける。|V辞書 + 一方だ|物価は上がる一方だ。|Prices keep rising.|ばかりだ often stresses worsening.|One direction arrow.|2|tendency",
  "一方で|while; on the other hand|二つの対照的な面を示す。|普通形 + 一方で|便利な一方で、費用も高い。|While convenient, it is also expensive.|反面 is similar but contrast is sharper.|Two sides of one thing.|2|contrast",
  "上で|after; for the purpose of|準備や確認をしてから次の行動をする。|Vた/名の + 上で|内容を確認した上で、署名する。|Sign after confirming the contents.|てから is simpler and chronological.|Check first, act second.|2|sequence",
  "上に|in addition; moreover|よいことや悪いことが重なる。|普通形 + 上に|安い上に、品質もよい。|It is cheap and also good quality.|だけでなく is broader.|Stacked bonus or problem.|2|addition",
  "得る|can; possible|可能性があることを表す。|Vます stem + 得る|誰にでも起こり得る問題だ。|It is a problem that can happen to anyone.|できる is general ability.|Possible in theory.|3|possibility",
  "かけだ|in the middle of|動作が始まり、まだ終わっていない。|Vます stem + かけだ|読みかけの本を机に置いた。|I put the half-read book on the desk.|途中 is a noun meaning middle.|Started but unfinished.|3|state",
  "かねない|could well; might|悪い結果になる可能性がある。|Vます stem + かねない|このままでは事故が起こりかねない。|At this rate an accident could happen.|かもしれない is neutral possibility.|Danger possibility.|3|risk",
  "かねる|cannot; find it hard to|立場上、心理的にできない。|Vます stem + かねる|その質問には答えかねます。|I cannot answer that question.|できない is direct and less formal.|Polite refusal.|3|formal",
  "かのようだ|as if|実際は違うが、そう見える。|普通形 + かのようだ|彼は何も知らなかったかのように話した。|He spoke as if he knew nothing.|みたい is casual.|Looks like, not real.|3|comparison",
  "からいうと|from the viewpoint of|ある立場や基準で判断する。|名 + からいうと|品質からいうと、この値段は安い。|From the viewpoint of quality, this price is cheap.|によると means according to information source.|Judgment angle.|3|viewpoint",
  "からして|even; judging from|代表例や判断の根拠を示す。|名 + からして|態度からして、彼は反省していない。|Judging from his attitude, he is not sorry.|さえ is a simpler even.|First clue already shows it.|3|viewpoint",
  "からすると|from; judging by|立場や根拠から判断する。|名 + からすると|専門家からすると、これは基本的なミスだ。|From an expert's view, this is a basic mistake.|にとって stresses personal relation.|Who is judging.|3|viewpoint",
  "からには|now that; since|決めたことへの責任や覚悟。|普通形 + からには|参加するからには、最後までやりたい。|Since I am participating, I want to finish.|以上は is more formal.|Decision creates duty.|2|obligation",
  "かといって|having said that|前の内容から当然考えられる結論を否定する。|文 + かといって|忙しい。かといって、休むわけにはいかない。|I am busy. That does not mean I can rest.|しかし is simple contrast.|Not that conclusion.|3|contrast",
  "限り|as long as; limit|条件の範囲内ではそうだと言う。|普通形/名の + 限り|努力する限り、可能性はある。|As long as you try, there is possibility.|うちは can mean during a period.|Boundary condition.|2|condition",
  "限りでは|as far as|自分が知る・見る範囲を限定する。|V辞書/た + 限りでは|私が知る限りでは、問題ない。|As far as I know, there is no problem.|によると cites a source.|Limited evidence.|3|condition",
  "がたい|hard to|気持ちとしてできないほど難しい。|Vます stem + がたい|信じがたい話だ。|It is a hard-to-believe story.|にくい is practical difficulty.|Emotionally hard.|3|difficulty",
  "気味|a little; -ish|少しその傾向がある。|Vます stem/名 + 気味|最近、疲れ気味だ。|Recently I am a little tired.|がち is repeated tendency often negative.|Slight tendency.|2|tendency",
  "きり|only; since|それだけで終わる、または最後に続いていない。|Vた/名 + きり|彼とは去年会ったきりだ。|I have not seen him since last year.|だけ is simple only.|Cut off after that.|3|limitation",
  "くせに|even though; despite|非難や不満を込める。|普通形 + くせに|知っているくせに、教えてくれない。|Even though he knows, he will not tell me.|のに is neutral.|Blame hidden inside.|2|contrast",
  "ことから|from the fact that|理由や判断の根拠を示す。|普通形 + ことから|道がぬれていることから、雨が降ったと分かる。|From the wet road, we know it rained.|ため is direct cause.|Evidence-based reason.|3|cause",
  "ことだ|should; important to|助言として大切な行動を示す。|V辞書/ない + ことだ|合格したいなら、毎日復習することだ。|If you want to pass, you should review daily.|べき is stronger obligation.|Advice core.|2|advice",
  "ことなく|without doing|ある動作をしないまま別の動作をする。|V辞書 + ことなく|彼は休むことなく働いた。|He worked without resting.|ないで is more common.|Formal without.|3|negative",
  "ことに|to my...|話し手の感情を先に示す。|感情形容詞 + ことに|驚いたことに、全員が合格した。|To my surprise, everyone passed.|ものだ can express emotion differently.|Emotion headline.|3|emotion",
  "最中に|right in the middle of|ちょうど何かをしている時。|Vている/名の + 最中に|会議の最中に電話が鳴った。|The phone rang during the meeting.|間に is broader.|Exactly mid-action.|2|time",
  "際に|when; on the occasion of|特別な機会や手続きで使う硬い表現。|V辞書/た/名の + 際に|申し込みの際に、身分証を見せてください。|Show ID when applying.|とき is neutral.|Formal occasion.|2|formal",
  "ざるを得ない|cannot help but|本当はしたくないが、そうするしかない。|Vない stem + ざるを得ない|雨なので中止せざるを得ない。|Because of rain, we have no choice but to cancel.|なければならない is duty, not reluctant necessity.|No other choice.|3|obligation",
  "次第|as soon as|何かが終わったらすぐ次をする。|Vます stem + 次第|準備ができ次第、出発します。|We will leave as soon as ready.|たらすぐ is less formal.|Immediate after completion.|3|time",
  "次第だ|depends on|結果が条件によって決まる。|名 + 次第だ|成功するかは努力次第だ。|Success depends on effort.|による is broader.|Depends on this key.|3|condition",
  "上|in terms of|ある面から見て。|名 + 上|安全上、問題がある。|There is a safety problem.|について is about topic.|Aspect label.|3|viewpoint",
  "せいで|because of|悪い結果の原因を示す。|普通形 + せいで|寝不足のせいで集中できない。|I cannot concentrate because of lack of sleep.|おかげで is positive.|Blame cause.|2|cause",
  "だけに|precisely because|理由が強く結果に結びつく。|普通形 + だけに|期待していただけに、残念だ。|Precisely because I expected it, I am disappointed.|からこそ is stronger positive emphasis.|Because exactly that.|3|cause",
  "だけでなく|not only but also|追加を示す。|普通形/名 + だけでなく|漢字だけでなく、文法も大切だ。|Not only kanji but grammar is important.|上に often stacks qualities.|Not only A, also B.|2|addition",
  "たとえ～ても|even if|仮定しても結果は変わらない。|たとえ + Vても/いAくても/なAでも|たとえ忙しくても、復習する。|Even if busy, I review.|ても alone is weaker.|Even if scenario.|2|condition",
  "たびに|every time|その時いつも同じことが起こる。|V辞書/名の + たびに|この曲を聞くたびに、学生時代を思い出す。|Every time I hear this song, I remember school days.|ごとに can mean regular interval.|Each occasion triggers.|2|time",
  "つつある|be in the process of|変化が進行中である。|Vます stem + つつある|状況は改善しつつある。|The situation is improving.|ている is general ongoing.|Formal gradual change.|3|progress",
  "つつ|while; though|同時動作または逆接を硬く言う。|Vます stem + つつ|悪いと知りつつ、続けてしまった。|Though I knew it was bad, I continued.|ながら is more common.|Knowing yet doing.|3|contrast",
  "っぽい|seems; -ish|その性質が強く感じられる。|名/いA stem/Vます stem + っぽい|この服は少し子どもっぽい。|These clothes look a little childish.|らしい can be typical or hearsay.|Feels like that quality.|2|tendency",
  "て以来|since|ある時から今まで続く。|Vて + 以来|日本に来て以来、毎日漢字を見ている。|Since coming to Japan, I see kanji every day.|から can be simple starting point.|Since then until now.|2|time",
  "てたまらない|cannot help feeling|感情や感覚がとても強い。|Vて/いAくて/なAで + たまらない|試験結果が気になってたまらない。|I cannot stop worrying about the exam result.|てしかたがない is similar.|Feeling overflows.|2|emotion",
  "てならない|cannot help feeling|自然に強くそう感じる。|Vて/いAくて/なAで + ならない|将来が心配でならない。|I cannot help worrying about the future.|てたまらない can be more physical/emotional.|Feeling will not settle.|3|emotion",
  "というものだ|it is truly|話し手の評価や判断を強く言う。|普通形 + というものだ|努力せず合格したいとは無理というものだ。|Wanting to pass without effort is unreasonable.|ということだ can report information.|That is what you call...|3|judgment",
  "とは限らない|not necessarily|いつもそうとは言えない。|普通形 + とは限らない|高い物がよいとは限らない。|Expensive things are not necessarily good.|わけではない is broader partial denial.|Not always true.|2|partial-negative",
  "ないことはない|it is not that...not|完全には否定しない。|Vない/いAくない/なAではない + ことはない|読めないことはないが、時間がかかる。|It is not that I cannot read it, but it takes time.|わけではない denies a conclusion.|Weak yes hidden in no.|3|partial-negative",
  "ないではいられない|cannot help doing|気持ちを抑えられず行動する。|Vない + ではいられない|その話を聞いて笑わないではいられなかった。|I could not help laughing at the story.|ずにはいられない is equivalent.|Cannot stay without doing.|3|emotion",
  "にあたって|on the occasion of|重要な行動の前の時点を示す。|V辞書/名 + にあたって|発表にあたって、資料を準備した。|In preparing for the presentation, I prepared materials.|際に is more general occasion.|Before important event.|3|formal",
  "に応じて|according to|状況や相手に合わせて変わる。|名 + に応じて|能力に応じてクラスを分ける。|Divide classes according to ability.|によって can mean by means or depends.|Adjust to level.|2|condition",
  "に限って|especially; only when|特別にその場合だけ。|名 + に限って|急いでいる日に限って電車が遅れる。|Trains are late especially when I am in a hurry.|だけ is simple only.|Of all times, that one.|3|limitation",
  "にかかわらず|regardless of|条件に関係なく同じ。|名/普通形 + にかかわらず|年齢にかかわらず参加できる。|Anyone can participate regardless of age.|にもかかわらず means despite.|Condition does not matter.|2|condition",
  "に加えて|in addition to|さらに別のものを足す。|名 + に加えて|雨に加えて、風も強い。|In addition to rain, wind is strong.|だけでなく can connect clauses.|Add another factor.|2|addition",
  "に対して|toward; in contrast to|対象や対比を示す。|名 + に対して|質問に対して答える。|Answer a question.|について is about topic.|Direction toward target.|2|relation",
  "に違いない|must be|強い確信を表す。|普通形 + に違いない|彼は理由を知っているに違いない。|He must know the reason.|はずだ is expectation based on logic.|Strong certainty.|2|certainty",
  "に伴って|along with|一つの変化に合わせて別も変化する。|名/V辞書 + に伴って|人口増加に伴って、住宅が増えた。|Housing increased along with population growth.|につれて is gradual emotional/natural change.|Change A brings B.|3|change",
  "にとって|for; to|ある立場から見た評価。|名 + にとって|学習者にとって、例文は大切だ。|For learners, example sentences are important.|からいうと is viewpoint for judgment.|For this person/group.|2|viewpoint",
  "に反して|contrary to|予想や期待と反対の結果。|名 + に反して|予想に反して、試験は難しかった。|Contrary to expectations, the exam was hard.|一方で contrasts two sides.|Against expectation.|3|contrast",
  "に基づいて|based on|根拠や資料をもとにする。|名 + に基づいて|データに基づいて判断する。|Decide based on data.|によって can mean by method.|Built on evidence.|3|formal",
  "にわたって|over; throughout|広い範囲や長い期間に及ぶ。|名 + にわたって|五日間にわたって練習した。|Practiced over five days.|を通じて often means through medium/time.|Spans across range.|3|range",
  "ぬきで|without|普通はあるものを入れない。|名 + ぬきで|冗談ぬきで、真剣に考えている。|Jokes aside, I am thinking seriously.|なしで is simpler.|Remove usual element.|3|negative",
  "のみならず|not only; as well as|硬い追加表現。|名/普通形 + のみならず|国内のみならず、海外でも人気だ。|It is popular not only domestically but overseas.|だけでなく is less formal.|Formal not only.|3|addition",
  "反面|on the other hand|同じ物の反対の性質を示す。|普通形 + 反面|便利な反面、危険もある。|It is convenient, but also has danger.|一方で is a little broader.|Reverse face.|3|contrast",
  "べきだ|should|当然そうするのがよい。|V辞書 + べきだ|時間を守るべきだ。|You should keep time.|ことだ is advice, softer.|Moral should.|2|obligation",
  "ものだ|it is natural; used to|一般的な感慨や過去の習慣。|普通形 + ものだ|学生時代はよく図書館に行ったものだ。|I used to go to the library often as a student.|ことだ is advice.|Looking back or general truth.|2|emotion",
  "ものの|although|事実を認めて逆の結果を言う。|普通形 + ものの|申し込んだものの、参加できなかった。|Although I applied, I could not participate.|のに can express surprise/blame.|Admit, then contrast.|3|contrast",
  "わけではない|it does not mean that|全部を否定せず一部を否定する。|普通形 + わけではない|嫌いなわけではないが、得意ではない。|It does not mean I dislike it, but I am not good at it.|とは限らない means not always.|Correct overstatement.|2|partial-negative",
  "わけにはいかない|cannot afford to|事情や常識でできない。|V辞書/ない + わけにはいかない|明日は試験なので、遊ぶわけにはいかない。|Since the exam is tomorrow, I cannot afford to play.|できない is simple inability.|Social reason blocks it.|3|obligation"
];

const makeKanji = (row: string, index: number): KanjiItem => {
  const [kanji, readings, meaning, exampleSentence, tags, difficulty] = row.split("|");
  return {
    id: `k-${String(index + 1).padStart(3, "0")}`,
    kanji,
    readings: readings.split("・"),
    meaning,
    exampleCompound: kanji,
    exampleSentence,
    tags: tags.split(";"),
    difficulty: Number(difficulty) as KanjiItem["difficulty"]
  };
};

const makeVocabulary = (row: string, index: number): VocabularyItem => {
  const cells = row.split("|");
  const hasReading = cells.length === 11;
  const [word, reading, meaning, japaneseDefinition, partOfSpeech, exampleSentence, translation, collocation, similarWord, difficulty, tags] = hasReading
    ? cells
    : [cells[0], cells[0], cells[1], cells[2], cells[3], cells[4], cells[5], cells[6], cells[7], cells[8], cells[9]];
  return {
    id: `v-${String(index + 1).padStart(3, "0")}`,
    word,
    reading,
    meaning,
    japaneseDefinition,
    partOfSpeech,
    exampleSentence,
    translation,
    collocation,
    similarWord,
    tags: tags.split(";"),
    difficulty: Number(difficulty) as VocabularyItem["difficulty"]
  };
};

const makeGrammar = (row: string, index: number): GrammarItem => {
  const [pattern, meaning, japaneseExplanation, formation, example, translation, commonConfusion, memoryHint, difficulty, tags] = row.split("|");
  return {
    id: `g-${String(index + 1).padStart(3, "0")}`,
    pattern,
    meaning,
    japaneseExplanation,
    formation,
    example,
    translation,
    commonConfusion,
    memoryHint,
    tags: tags.split(";"),
    difficulty: Number(difficulty) as GrammarItem["difficulty"]
  };
};

export const starterKanji = kanjiRows.map(makeKanji);
export const starterVocabulary = vocabularyRows.map(makeVocabulary);
export const starterGrammar = grammarRows.map(makeGrammar);

function choices(answer: string, pool: string[], seed: string, count = 4): string[] {
  const distractors = uniqueTake(shuffleDeterministic(pool.filter((item) => item && item !== answer), seed), count - 1);
  return shuffleDeterministic([answer, ...distractors], `${seed}-choices`);
}

function japaneseOnlyChoicePool<T>(items: T[], mapper: (item: T) => string): string[] {
  return items.map(mapper).filter((value) => value && !/[A-Za-z]/.test(value));
}

function grammarLabel(item: GrammarItem): string {
  return item.pattern
    .replaceAll("V", "動詞")
    .replaceAll("いA", "い形容詞")
    .replaceAll("なA", "な形容詞")
    .replaceAll("N", "名詞");
}

const commonReadingOverrides: Record<string, string> = {
  脳: "ノウ",
  王: "オウ"
};

function representativeKanjiReading(item: KanjiItem): string {
  const override = commonReadingOverrides[item.kanji];
  if (override) return override;
  return item.readings.find((reading) => !reading.startsWith("-") && !reading.includes(".")) ?? item.readings[0];
}

function withRepresentativeReadingFirst(item: KanjiItem): KanjiItem {
  const representative = representativeKanjiReading(item);
  const example = starterVocabulary.find(word => word.word.includes(item.kanji));
  return {
    ...item,
    exampleCompound: example?.word ?? "",
    exampleSentence: example?.exampleSentence ?? "",
    readings: [representative, ...item.readings.filter((reading) => reading !== representative)]
  };
}

export const allBundledKanji = [...starterKanji, ...expandedKanji.map(withRepresentativeReadingFirst)];

function buildQuestions(): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  starterKanji.forEach((item, index) => {
    questions.push({
      id: `q-kr-${String(index + 1).padStart(3, "0")}`,
      category: "kanji",
      subcategory: "kanji-reading",
      type: "multiple-choice",
      prompt: `「${item.kanji}」の読み方として最も自然なものを選びなさい。`,
      choices: choices(item.readings[0], starterKanji.map((k) => k.readings[0]), item.id),
      correctAnswer: item.readings[0],
      explanation: `「${item.kanji}」は「${item.readings[0]}」と読む。例文：${item.exampleSentence}`,
      relatedContentId: item.id,
      difficulty: item.difficulty,
      tags: item.tags
    });
  });
  starterKanji.slice(50, 100).forEach((item, index) => {
    questions.push({
      id: `q-km-${String(index + 1).padStart(3, "0")}`,
      category: "kanji",
      subcategory: "kanji-meaning",
      type: "multiple-choice",
      prompt: `次の文で使う語として最も自然なものを選びなさい。\n${item.exampleSentence.replace(item.kanji, "（　）")}`,
      choices: choices(item.kanji, starterKanji.map((k) => k.kanji), `${item.id}-meaning`),
      correctAnswer: item.kanji,
      explanation: `この文では「${item.kanji}」を入れると自然な文になる。読み：${item.readings.join("、")}`,
      relatedContentId: item.id,
      difficulty: item.difficulty,
      tags: item.tags
    });
  });
  starterVocabulary.forEach((item, index) => {
    questions.push({
      id: `q-vr-${String(index + 1).padStart(3, "0")}`,
      category: "vocabulary",
      subcategory: "vocabulary-recognition",
      type: "multiple-choice",
      prompt: `「${item.word}」の説明として最も近いものを選びなさい。`,
      choices: choices(item.japaneseDefinition, starterVocabulary.map((v) => v.japaneseDefinition), item.id),
      correctAnswer: item.japaneseDefinition,
      explanation: `「${item.word}」は「${item.japaneseDefinition}」という意味で使う。似た語：${item.similarWord}`,
      relatedContentId: item.id,
      difficulty: item.difficulty,
      tags: item.tags
    });
  });
  starterVocabulary.slice(70, 140).forEach((item, index) => {
    questions.push({
      id: `q-vc-${String(index + 1).padStart(3, "0")}`,
      category: "vocabulary",
      subcategory: "vocabulary-context",
      type: "fill-blank",
      prompt: `次の説明に当てはまる語を選びなさい。\n${item.japaneseDefinition}`,
      choices: choices(item.word, starterVocabulary.map((v) => v.word), `${item.id}-context`),
      correctAnswer: item.word,
      explanation: `正解は「${item.word}」。例文：${item.exampleSentence}`,
      relatedContentId: item.id,
      difficulty: item.difficulty,
      tags: item.tags
    });
  });
  starterGrammar.forEach((item, index) => {
    questions.push({
      id: `q-gr-${String(index + 1).padStart(3, "0")}`,
      category: "grammar",
      subcategory: "grammar-recognition",
      type: "multiple-choice",
      prompt: `次の説明に合う文法を選びなさい。\n${item.japaneseExplanation}`,
      choices: choices(grammarLabel(item), starterGrammar.map(grammarLabel), item.id),
      correctAnswer: grammarLabel(item),
      explanation: `${grammarLabel(item)}：${item.japaneseExplanation} 例文：${item.example}`,
      relatedContentId: item.id,
      difficulty: item.difficulty,
      tags: item.tags
    });
  });
  starterGrammar.slice(20, 60).forEach((item, index) => {
    questions.push({
      id: `q-gn-${String(index + 1).padStart(3, "0")}`,
      category: "grammar",
      subcategory: "grammar-nuance",
      type: "multiple-choice",
      prompt: `次の例文に最も合う文法を選びなさい。\n${item.example}`,
      choices: choices(grammarLabel(item), starterGrammar.map(grammarLabel), `${item.id}-nuance`),
      correctAnswer: grammarLabel(item),
      explanation: `${grammarLabel(item)}：${item.japaneseExplanation} 例文：${item.example}`,
      relatedContentId: item.id,
      difficulty: item.difficulty,
      tags: item.tags
    });
  });

  const ordering = [
    ["q-so-001", "約束した|以上は|最後まで|やるべきだ", "次の文が自然な順番になるように並べなさい。", "g-002"],
    ["q-so-002", "高い物が|必ずしも|よい|とは限らない", "次の文が自然な順番になるように並べなさい。", "g-045"],
    ["q-so-003", "準備が|でき次第|すぐに|出発します", "次の文が自然な順番になるように並べなさい。", "g-030"],
    ["q-so-004", "年齢に|かかわらず|誰でも|参加できる", "次の文が自然な順番になるように並べなさい。", "g-050"],
    ["q-so-005", "努力した|ものの|結果は|出なかった", "次の文が自然な順番になるように並べなさい。", "g-059"],
    ["q-so-006", "安全を|考慮した|上で|判断する", "次の文が自然な順番になるように並べなさい。", "g-005"],
    ["q-so-007", "このままでは|問題が|起こり|かねない", "次の文が自然な順番になるように並べなさい。", "g-009"],
    ["q-so-008", "知っている|くせに|何も|言わない", "次の文が自然な順番になるように並べなさい。", "g-022"],
    ["q-so-009", "資料に|基づいて|意見を|述べる", "次の文が自然な順番になるように並べなさい。", "g-054"],
    ["q-so-010", "冗談|ぬきで|真剣に|考えている", "次の文が自然な順番になるように並べなさい。", "g-056"]
  ] as const;
  ordering.forEach(([id, answer, prompt, relatedContentId], index) => {
    const parts = answer.split("|");
    questions.push({
      id,
      category: "sentence-ordering",
      subcategory: "sentence-ordering",
      type: "ordering",
      prompt,
      choices: choices(answer, [
        shuffleDeterministic(parts, `${id}-a`).join("|"),
        shuffleDeterministic(parts, `${id}-b`).join("|"),
        shuffleDeterministic(parts, `${id}-c`).join("|"),
        [...parts].reverse().join("|")
      ], id),
      correctAnswer: answer,
      explanation: `固定した形に注意する。自然な順番：${parts.join(" / ")}`,
      relatedContentId,
      difficulty: (index % 3 === 0 ? 3 : 2),
      tags: ["ordering", "grammar"]
    });
  });

  const readings = [
    ["q-rd-001", "新しい制度が始まったが、利用者の大半はまだ詳しい内容を理解していない。", "問題になっていることは何ですか。", "利用者の多くが新制度の内容をまだ理解していないこと。", "新しい制度は始まったが、利用者の大半が詳しい内容を理解していないと述べている。", "v-128"],
    ["q-rd-002", "締切直前に資料を修正したため、最終確認の時間が不足した。", "最終確認の時間が不足した理由は何ですか。", "締切直前に資料を修正したため。", "「ため」は理由を表し、資料の修正が時間不足の原因になっている。", "v-113"],
    ["q-rd-003", "価格は高い反面、保証期間が長く、長期的には安心できる。", "どのような対比が述べられていますか。", "価格は高いが、保証期間が長く安心できること。", "「反面」は同じ物の反対の面を示す。", "g-057"],
    ["q-rd-004", "調査結果に基づいて方針を変更することになった。", "方針変更の根拠は何ですか。", "調査結果。", "「に基づいて」は根拠を表す。", "g-054"],
    ["q-rd-005", "彼は経験が豊富なだけでなく、説明も具体的で分かりやすい。", "追加されている内容は何ですか。", "説明も具体的で分かりやすいこと。", "「だけでなく」は別の内容を加える表現。", "g-035"],
    ["q-rd-006", "交通状況に応じて、出発時間を調整してください。", "何を調整する必要がありますか。", "出発時間。", "「に応じて」は状況に合わせることを表す。", "g-049"],
    ["q-rd-007", "安全上の理由から、この設備の使用は一時的に制限されています。", "使用が制限されている理由は何ですか。", "安全上の理由。", "「安全上」は安全という面から見た理由を表す。", "g-032"],
    ["q-rd-008", "結果は予想に反して悪くなかったが、細かいミスが目立った。", "予想と違っていたことは何ですか。", "結果が悪くなかったこと。", "「に反して」は予想や期待と反対の結果を表す。", "g-053"],
    ["q-rd-009", "この表現は使えないことはないが、やや不自然に聞こえる。", "話し手の判断として最も近いものはどれですか。", "使えるが、少し不自然に聞こえる。", "「ないことはない」は弱い肯定を表す。", "g-046"],
    ["q-rd-010", "試験直前は新しい教材を増やすより、個人の誤りを確認するべきだ。", "試験直前に優先すべきことは何ですか。", "自分の誤りを確認すること。", "新しい教材を増やすより、個人の誤りを確認するべきだと述べている。", "v-176"]
  ] as const;
  readings.forEach(([id, passage, prompt, answer, explanation, relatedContentId]) => {
    questions.push({
      id,
      category: "reading",
      subcategory: "short-reading",
      type: "multiple-choice",
      prompt: `${passage}\n${prompt}`,
      choices: choices(answer, [
        "新しい教材をできるだけ増やすこと。",
        "細かい誤りを気にしないこと。",
        "試験日を変更すること。",
        "自分の誤りを確認すること。",
        "調査結果。",
        "安全上の理由。",
        "出発時間。",
        "利用者の多くが新制度の内容をまだ理解していないこと。"
      ], id),
      correctAnswer: answer,
      explanation,
      relatedContentId,
      difficulty: 3,
      tags: ["reading", "context"]
    });
  });

  return questions;
}

function buildExpandedKanjiQuestions(): QuizQuestion[] {
  const questionKanji = shuffleDeterministic(expandedKanji, "expanded-kanji-questions").slice(0, 320);
  const readingPool = expandedKanji.map((item) => item.readings[0]).filter(Boolean);
  const kanjiPool = japaneseOnlyChoicePool(expandedKanji, (item) => item.kanji);
  return questionKanji.flatMap((item, index) => {
    const representativeReading = representativeKanjiReading(item);
    const readingQuestion: QuizQuestion = {
      id: `q-ekr-${String(index + 1).padStart(4, "0")}`,
      category: "kanji",
      subcategory: "kanji-reading",
      type: "multiple-choice",
      prompt: `「${item.kanji}」の読み方として正しいものを選びなさい。`,
      choices: choices(representativeReading, readingPool.filter(reading => !item.readings.includes(reading)), `${item.id}-expanded-reading`),
      correctAnswer: representativeReading,
      explanation: `「${item.kanji}」の主な読み：${[representativeReading, ...item.readings.filter((reading) => reading !== representativeReading)].join("、")}`,
      relatedContentId: item.id,
      difficulty: item.difficulty,
      tags: item.tags
    };
    const meaningQuestion: QuizQuestion = {
      id: `q-ekm-${String(index + 1).padStart(4, "0")}`,
      category: "kanji",
      subcategory: "kanji-meaning",
      type: "multiple-choice",
      prompt: `次の条件に合う漢字を選びなさい。\n読み：${representativeReading}\n画数：${item.tags.find((tag) => tag.startsWith("strokes-"))?.replace("strokes-", "") ?? "未確認"}`,
      choices: choices(item.kanji, kanjiPool.filter(kanji => {
        const other = expandedKanji.find(entry => entry.kanji === kanji)!;
        return !other.readings.includes(representativeReading) || other.tags.find(tag => tag.startsWith("strokes-")) !== item.tags.find(tag => tag.startsWith("strokes-"));
      }), `${item.id}-expanded-meaning`),
      correctAnswer: item.kanji,
      explanation: `正解は「${item.kanji}」。主な読み：${item.readings.join("、")}`,
      relatedContentId: item.id,
      difficulty: item.difficulty,
      tags: item.tags
    };
    return [readingQuestion, meaningQuestion];
  });
}

export const starterQuestions = improveQuestionChoices([...buildQuestions(), ...buildExpandedKanjiQuestions(), ...extendedReading], starterVocabulary, starterGrammar, allBundledKanji);

export const starterContent: StudyContent = {
  kanji: allBundledKanji,
  vocabulary: starterVocabulary,
  grammar: starterGrammar,
  questions: starterQuestions
};
