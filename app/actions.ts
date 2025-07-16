"use server";
import { firestore } from "@/lib/firebase";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

export async function generateEssay(formData: FormData) {
  const posts = String(formData.get("posts"));
  const birthdate = String(formData.get("birthdate"));

  // Use OpenAI to turn scattered LinkedIn posts into a cohesive essay.
  // Requires OPENAI_API_KEY environment variable (set in Vercel settings).
  let fullEssay: string;
  let title: string;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // falls back to gpt-3.5 if unavailable
      messages: [
        {
          role: "system",
          content: `🧠 역할:
당신은 인간이 남긴 단편적 글 속에서 의미의 구조(온톨로지)를 읽어내어, 그들이 미처 정리하지 못한 흐름을 논리적·정서적으로 재편집하는 AI 사유 편집자입니다.

🧾 작업 대상:
사용자가 LinkedIn에 남긴 복수의 포스트·메모·문장 조각입니다. 이는 미완성된 생각의 파편이며, 그 속에 잠재된 주제·감정·비유·누락된 연결 고리를 탐색해야 합니다.

🛠 작업 지침:
1. 사고의 흐름, 감정의 리듬, 반복 주제, 변주되는 비유, 누락된 연결을 해석하십시오.
2. 원문 순서에 구애받지 말고 서사적 완결성을 위해 재배열·통합·압축·확장을 자유롭게 수행하십시오.
3. 결과물은 ‘서론 – 전개 – 정점 – 울림 – 차가운 질문’으로 이어지는 하나의 유기적 에세이여야 합니다.
   • 서론: 왜 이 글을 쓰게 되었는지 조용히 드러낼 것.
   • 전개: 감정과 사유가 점진적으로 고조되도록.
   • 결말: 따뜻한 화해가 아닌 차가운 질문·불편한 제안으로 닫을 것.

🎯 톤·문체:
• 과도한 친절·교훈 금지, 차분하지만 응축된 어조.
• 압축적이고 구체적인 문장. 추상어 최소화, 사례·이미지로 구체화.
• 사용자의 냉소적·단정적 특성을 살릴 것.
• 문단 연결은 논리보다 정서적 흐름을 우선.

📏 분량:
• 본문 최소 3,000자.

📄 출력(UTF-8 plain text):
TITLE: <30자 이내 제목 한 줄>

<단일 흐름 에세이 – 문단 사이 빈 줄 1개>

HASHTAGS: #키워드1 #키워드2 … (최대 5개)`,
        },
        { role: "user", content: posts },
      ],
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content ?? "";
    const [firstLine, ...rest] = raw.split(/\n+/);
    title = firstLine.replace(/^TITLE:\s*/, "").slice(0, 30) || "Untitled Essay";
    fullEssay = rest.join("\n\n").trim() || posts;

  } catch (err) {
    console.error("OpenAI failed, falling back to raw text", err);
    // Fallback: just use the original posts concatenated.
    const paragraphs = posts
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    fullEssay = paragraphs.join("\n\n");
    title = paragraphs[0]?.slice(0, 30) || "Untitled Essay";
  }

  const essayRef = doc(collection(firestore, "essays"));
  const data = {
    sourcePosts: posts,
    fullEssay,
    title,
    hashtags: [],
    authorBirthdate: birthdate,
    authorId: null,
    createdAt: serverTimestamp(),
    public: true,
    likeCount: 0,
  };

  await setDoc(essayRef, data);

  revalidatePath(`/essay/${essayRef.id}`);
  redirect(`/essay/${essayRef.id}`);
}
