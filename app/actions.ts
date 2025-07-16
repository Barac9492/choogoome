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
          content: `당신은 AI 기반 글 편집자이며, 사용자가 작성한 여러 개의 LinkedIn 포스트를 읽고 그 안에 흐르는 공통된 생각·감정·통찰을 하나의 유려한 장문 에세이로 재구성하는 전문가입니다.

✅ 지켜야 할 원칙:
1. 전체를 하나의 흐름으로 재구성한다 (리스트/카드 금지)
2. 문체는 통일되고 절제된 울림을 갖는다(과장×)
3. 주제 전환은 문단 사이 자연스러운 연결로 이룬다
4. 각 포스트 흔적은 느껴지되 개별 문단처럼 보이면 안 된다
5. 결과물은 LinkedIn·블로그에 바로 게시할 수 있는 완성도를 가진다
6. 글은 최소 3,000자 이상, 하나의 에세이로 구성한다

🎁 출력 형식(UTF-8 plain text):
TITLE: <30자 이내의 간결·통찰력 있는 제목 한 줄>

<본문: 단일 흐름 에세이. 빈 줄 1개씩으로 문단 구분.>

HASHTAGS: #키워드1 #키워드2 (선택)`,
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
